require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let currentUser = null;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456789',
  database: process.env.DB_NAME || 'medicine_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1')) {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);

let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'user') DEFAULT 'user',
          status ENUM('pending', 'approved') DEFAULT 'pending'
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS medicines (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          dosage VARCHAR(100) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          expiry_date DATE NOT NULL
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          medicine_id INT NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          total_price DECIMAL(10,2) NOT NULL,
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status ENUM('pending', 'confirmed', 'delivered') DEFAULT 'pending',
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (medicine_id) REFERENCES medicines(id)
        )
      `);

      const [admin] = await conn.query("SELECT * FROM users WHERE username = 'admin'");
      if (admin.length === 0) {
        const hash = await bcrypt.hash('admin123', 10);
        await conn.query("INSERT INTO users (username, password, role, status) VALUES (?, ?, 'admin', 'approved')", ['admin', hash]);
        console.log("Admin account created: admin / admin123");
      }

      dbInitialized = true;
      console.log("DB setup verified");
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("DB Initialization Error:", err.message);
  }
}

app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initDB();
  }
  next();
});

const getUser = async (username) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
};

const getAllMedicines = async () => {
  const [rows] = await pool.execute('SELECT * FROM medicines ORDER BY expiry_date ASC');
  return rows.map(m => ({
    ...m,
    status: new Date(m.expiry_date) >= new Date() ? 'available' : 'expired'
  }));
};

const getAvailable = async () => {
  const all = await getAllMedicines();
  return all.filter(m => m.status === 'available');
};

app.get('/', (req, res) => res.render('login', { error: null }));

app.get('/register', (req, res) => res.render('register', { error: null }));

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.render('register', { error: 'Fill all fields' });
    if (await getUser(username)) return res.render('register', { error: 'Username taken' });
    const hash = await bcrypt.hash(password, 10);
    await pool.execute('INSERT INTO users (username, password, role, status) VALUES (?, ?, "user", "pending")', [username, hash]);
    res.redirect('/');
  } catch (err) {
    console.error("Register error:", err);
    res.render('register', { error: 'Database connection failed. Please verify environment variables on Vercel.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await getUser(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    if (user.status !== 'approved') {
      return res.render('login', { error: 'Account pending approval by admin' });
    }
    currentUser = { id: user.id, username: user.username, role: user.role };
    res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/check-availability');
  } catch (err) {
    console.error("Login error:", err);
    res.render('login', { error: 'Database connection error. Ensure database host and credentials are set in Vercel environment variables.' });
  }
});

// ADMIN
app.get('/admin/dashboard', async (req, res) => {
  if (!currentUser || currentUser.role !== 'admin') return res.redirect('/');
  let medicines = [];
  let users = [];
  const search = req.query.search || '';
  try {
    if (search) {
      const [rows] = await pool.execute('SELECT * FROM medicines WHERE name LIKE ? ORDER BY expiry_date ASC', [`%${search}%`]);
      medicines = rows.map(m => ({
        ...m,
        status: new Date(m.expiry_date) >= new Date() ? 'available' : 'expired'
      }));
    } else {
      medicines = await getAllMedicines();
    }
    [users] = await pool.execute('SELECT id, username, role, status FROM users WHERE role = "user" AND status = "pending"');
  } catch (err) {
    console.error('Database error:', err);
  }
  res.render('admin/dashboard', { medicines, users, user: currentUser, search });
});

app.post('/admin/update-order/:id', async (req, res) => {
  if (!currentUser || currentUser.role !== 'admin') return res.redirect('/');
  const { status } = req.body;
  await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.redirect('/admin/orders');
});

app.get('/admin/add', (req, res) => {
  if (!currentUser || currentUser.role !== 'admin') return res.redirect('/');
  res.render('admin/add');
});

app.post('/admin/add', async (req, res) => {
  if (!currentUser || currentUser.role !== 'admin') return res.redirect('/');
  const { name, dosage, price, expiry_date } = req.body;
  await pool.execute('INSERT INTO medicines (name, dosage, price, expiry_date) VALUES (?, ?, ?, ?)', [name, dosage, price, expiry_date]);
  res.redirect('/admin/dashboard');
});

app.get('/admin/edit/:id', async (req, res) => {
  if (!currentUser || currentUser.role !== 'admin') return res.redirect('/');
  const [rows] = await pool.execute('SELECT * FROM medicines WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.redirect('/admin/dashboard');
  res.render('admin/edit', { med: rows[0] });
});

app.post('/admin/update/:id', async (req, res) => {
  if (!currentUser || currentUser.role !== 'admin') return res.redirect('/');
  const { name, dosage, price, expiry_date } = req.body;
  await pool.execute('UPDATE medicines SET name = ?, dosage = ?, price = ?, expiry_date = ? WHERE id = ?', [name, dosage, price, expiry_date, req.params.id]);
  res.redirect('/admin/dashboard');
});

app.post('/admin/delete/:id', async (req, res) => {
  if (!currentUser || currentUser.role !== 'admin') return res.redirect('/');
  await pool.execute('DELETE FROM medicines WHERE id = ?', [req.params.id]);
  res.redirect('/admin/dashboard');
});

// USER APPROVAL
app.get('/admin/approvals', async (req, res) => {
  if (!currentUser || currentUser.role !== 'admin') return res.redirect('/');
  let users = [];
  try {
    [users] = await pool.execute('SELECT id, username, role, status FROM users WHERE role = "user" AND status = "pending"');
  } catch (err) {
    console.error('Database error:', err);
  }
  res.render('admin/approvals', { users, user: currentUser });
});

app.post('/admin/approve/:id', async (req, res) => {
  if (!currentUser || currentUser.role !== 'admin') return res.redirect('/');
  await pool.execute('UPDATE users SET status = "approved" WHERE id = ?', [req.params.id]);
  res.redirect('/admin/approvals');
});

// USER
app.get('/check-availability', async (req, res) => {
  if (!currentUser) return res.redirect('/');
  let medicines = [];
  const search = req.query.search || '';
  try {
    if (search) {
      const [rows] = await pool.execute('SELECT * FROM medicines WHERE name LIKE ? ORDER BY expiry_date ASC', [`%${search}%`]);
      medicines = rows.map(m => ({
        ...m,
        status: new Date(m.expiry_date) >= new Date() ? 'available' : 'expired'
      }));
    } else {
      medicines = await getAllMedicines();
    }
  } catch (err) {
    console.error('Database error:', err);
  }
  res.render('user/availability', { medicines, user: currentUser, search });
});

app.post('/buy/:id', async (req, res) => {
  if (!currentUser) return res.redirect('/');
  const { quantity } = req.body;
  const medicineId = req.params.id;
  try {
    const [medicineRows] = await pool.execute('SELECT * FROM medicines WHERE id = ?', [medicineId]);
    if (medicineRows.length === 0) return res.redirect('/check-availability');

    const medicine = medicineRows[0];
    if (new Date(medicine.expiry_date) < new Date()) {
      return res.redirect('/check-availability'); // Medicine expired
    }

    const qty = parseInt(quantity) || 1;
    const totalPrice = medicine.price * qty;

    await pool.execute('INSERT INTO orders (user_id, medicine_id, quantity, total_price) VALUES (?, ?, ?, ?)',
      [currentUser.id, medicineId, qty, totalPrice]);

    res.redirect('/my-orders');
  } catch (err) {
    console.error('Order error:', err);
    res.redirect('/check-availability');
  }
});

app.post('/buy-selected', async (req, res) => {
  if (!currentUser) return res.redirect('/');
  const { selected, quantity } = req.body;
  if (!selected || selected.length === 0) return res.redirect('/check-availability');

  const selectedIds = Array.isArray(selected) ? selected : [selected];
  try {
    for (const medicineId of selectedIds) {
      const [medicineRows] = await pool.execute('SELECT * FROM medicines WHERE id = ?', [medicineId]);
      if (medicineRows.length === 0) continue;

      const medicine = medicineRows[0];
      if (new Date(medicine.expiry_date) < new Date()) continue; // Skip expired medicines

      const qty = parseInt(quantity[medicineId]) || 1;
      const totalPrice = medicine.price * qty;

      await pool.execute('INSERT INTO orders (user_id, medicine_id, quantity, total_price) VALUES (?, ?, ?, ?)',
        [currentUser.id, medicineId, qty, totalPrice]);
    }
    res.redirect('/my-orders');
  } catch (err) {
    console.error('Bulk order error:', err);
    res.redirect('/check-availability');
  }
});

app.get('/my-orders', async (req, res) => {
  if (!currentUser) return res.redirect('/');
  let orders = [];
  try {
    [orders] = await pool.execute(`
      SELECT o.*, m.name, m.dosage, m.price as unit_price
      FROM orders o
      JOIN medicines m ON o.medicine_id = m.id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `, [currentUser.id]);
  } catch (err) {
    console.error('Database error:', err);
  }
  res.render('user/orders', { orders, user: currentUser });
});

app.get('/admin/orders', async (req, res) => {
  if (!currentUser || currentUser.role !== 'admin') return res.redirect('/');
  let orders = [];
  const search = req.query.search || '';
  try {
    if (search) {
      [orders] = await pool.execute(`
        SELECT o.*, m.name, m.dosage, u.username
        FROM orders o
        JOIN medicines m ON o.medicine_id = m.id
        JOIN users u ON o.user_id = u.id
        WHERE u.username LIKE ? OR m.name LIKE ?
        ORDER BY o.order_date DESC
      `, [`%${search}%`, `%${search}%`]);
    } else {
      [orders] = await pool.execute(`
        SELECT o.*, m.name, m.dosage, u.username
        FROM orders o
        JOIN medicines m ON o.medicine_id = m.id
        JOIN users u ON o.user_id = u.id
        ORDER BY o.order_date DESC
      `);
    }
  } catch (err) {
    console.error('Database error:', err);
  }
  res.render('admin/orders', { orders, user: currentUser, search });
});

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { error: null, success: null });
});

app.post('/forgot-password', async (req, res) => {
  const { username, newPassword, confirmPassword } = req.body;

  if (!username || !newPassword || !confirmPassword) {
    return res.render('forgot-password', {
      error: 'All fields are required',
      success: null
    });
  }

  if (newPassword !== confirmPassword) {
    return res.render('forgot-password', {
      error: 'New passwords do not match',
      success: null
    });
  }

  if (newPassword.length < 6) {
    return res.render('forgot-password', {
      error: 'New password must be at least 6 characters long',
      success: null
    });
  }

  try {
    // Check if user exists
    const [userRows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (userRows.length === 0) {
      return res.render('forgot-password', {
        error: 'User not found',
        success: null
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute('UPDATE users SET password = ? WHERE username = ?', [hashedNewPassword, username]);

    res.render('forgot-password', {
      error: null,
      success: 'Password reset successfully! You can now login with your new password.'
    });

  } catch (err) {
    console.error('Password reset error:', err);
    res.render('forgot-password', {
      error: 'An error occurred while resetting password',
      success: null
    });
  }
});

app.get('/change-password', (req, res) => {
  if (!currentUser) return res.redirect('/');
  res.render('change-password', { user: currentUser, error: null, success: null });
});

app.post('/change-password', async (req, res) => {
  if (!currentUser) return res.redirect('/');

  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.render('change-password', {
      user: currentUser,
      error: 'All fields are required',
      success: null
    });
  }

  if (newPassword !== confirmPassword) {
    return res.render('change-password', {
      user: currentUser,
      error: 'New passwords do not match',
      success: null
    });
  }

  if (newPassword.length < 6) {
    return res.render('change-password', {
      user: currentUser,
      error: 'New password must be at least 6 characters long',
      success: null
    });
  }

  try {
    // Get current user data
    const [userRows] = await pool.execute('SELECT * FROM users WHERE id = ?', [currentUser.id]);
    if (userRows.length === 0) {
      return res.render('change-password', {
        user: currentUser,
        error: 'User not found',
        success: null
      });
    }

    const user = userRows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.render('change-password', {
        user: currentUser,
        error: 'Current password is incorrect',
        success: null
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, currentUser.id]);

    res.render('change-password', {
      user: currentUser,
      error: null,
      success: 'Password changed successfully!'
    });

  } catch (err) {
    console.error('Password change error:', err);
    res.render('change-password', {
      user: currentUser,
      error: 'An error occurred while changing password',
      success: null
    });
  }
});

app.get('/logout', (req, res) => {
  currentUser = null;
  res.redirect('/');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Application Error:", err);
  res.status(500).render('login', { 
    error: 'An internal server error occurred. If deployed on Vercel, make sure environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) are set in your Vercel project settings.' 
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server: http://localhost:${PORT}`);
  });
}

module.exports = app;
