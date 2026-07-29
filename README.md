# MediCare - Medicine Management System

A comprehensive web-based medicine management system built with Node.js, Express, MySQL, and EJS templates.

## Features

- **Role-based Access Control**: Admin and User roles
- **Admin Features**:
  - Dashboard with medicine overview
  - Add, edit, delete medicines
  - User approval system
  - Search functionality
- **User Features**:
  - Medicine availability check
  - Registration (requires admin approval)
  - Search medicines
- **Security**: Password hashing with bcrypt
- **Database**: MySQL with automatic setup

## Local Development

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/sanaullak666/medicare.git
   cd medicare
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start MySQL server and ensure it's running

4. Start the application:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

### Default Admin Credentials
- Username: `admin`
- Password: `admin123`

## Deployment Options

### Option 1: Heroku
1. Create a Heroku account and install Heroku CLI
2. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```
3. Add MySQL database (e.g., ClearDB or JawsDB)
4. Set environment variables:
   ```bash
   heroku config:set DATABASE_URL=your_mysql_connection_string
   heroku config:set NODE_ENV=production
   ```
5. Deploy:
   ```bash
   git push heroku master
   ```

### Option 2: Railway
1. Connect your GitHub repository to Railway
2. Add MySQL database service
3. Set environment variables in Railway dashboard
4. Deploy automatically

### Option 3: Render
1. Connect GitHub repository to Render
2. Choose Web Service
3. Add MySQL database
4. Configure environment variables
5. Deploy

### Option 4: Vercel (Frontend Only)
Note: This app requires a backend server, so Vercel would need modifications for serverless functions.

## Environment Variables

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=medicine_db
PORT=3000
NODE_ENV=development
```

## Database Schema

The application automatically creates the following tables:
- `users`: User accounts with roles
- `medicines`: Medicine inventory with expiry tracking

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: EJS, Bootstrap 5, CSS3
- **Security**: bcrypt for password hashing
- **Session Management**: In-memory sessions (upgrade to redis for production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License
