# MediCare Medicine Management System - Project Documentation

## Overview
MediCare is a comprehensive web-based medicine management system built with Node.js and Express.js backend, featuring a responsive frontend using EJS templates, Bootstrap, and custom CSS. The application allows users to check medicine availability, place orders, and administrators to manage the medicine inventory.

## Technology Stack

### Frontend
- **Template Engine**: EJS (Embedded JavaScript)
- **CSS Framework**: Bootstrap 5.3.0
- **Icons**: Font Awesome 6.0.0
- **Fonts**: Inter (Google Fonts)
- **Custom Styling**: Professional gradient-based design with glass morphism effects
- **Responsive Design**: Mobile-first approach with breakpoints

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (with sqlite3 package)
- **Authentication**: Session-based with express-session
- **Password Hashing**: bcrypt
- **File Upload**: multer (for medicine images)
- **Email**: nodemailer (for password reset)

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Editor**: VS Code
- **Browser Testing**: Chrome/Firefox

## Features and Functions

### User Features
1. **User Registration & Login**
   - Secure user account creation
   - Password hashing with bcrypt
   - Session management

2. **Medicine Availability Check**
   - Search medicines by name
   - View available medicines with details (name, dosage, price, expiry date, status)
   - Real-time availability status

3. **Order Management**
   - Select multiple medicines for purchase
   - Specify quantities for each medicine
   - View order history
   - Order status tracking

4. **Password Management**
   - Change password functionality
   - Forgot password with email reset

### Admin Features
1. **Dashboard Overview**
   - Medicine inventory management
   - Order management interface
   - User approval system

2. **Medicine Management**
   - Add new medicines
   - Edit existing medicine details
   - Delete medicines
   - Upload medicine images
   - Set expiry dates and status

3. **Order Management**
   - View all user orders
   - Process and update order status
   - Manage order fulfillment

4. **User Management**
   - Approve new user registrations
   - Manage user accounts

## Application Structure

### Directory Structure
```
medicine-appy/
├── node_modules/
├── public/
│   ├── style.css          # Custom CSS styles
│   ├── script.js          # Client-side JavaScript
│   └── icons/
│       └── pill.svg       # Medicine icon
├── views/
│   ├── admin/
│   │   ├── dashboard.ejs  # Admin dashboard
│   │   ├── orders.ejs     # Order management
│   │   ├── add.ejs        # Add medicine form
│   │   ├── edit.ejs       # Edit medicine form
│   │   └── approvals.ejs  # User approvals
│   ├── user/
│   │   ├── availability.ejs # Medicine availability
│   │   └── orders.ejs     # User orders
│   ├── login.ejs          # Login page
│   ├── register.ejs       # Registration page
│   ├── change-password.ejs # Password change
│   └── forgot-password.ejs # Password reset
├── server.js              # Main application file
├── package.json           # Dependencies and scripts
├── package-lock.json      # Lock file
├── README.md              # Project README
└── .gitignore             # Git ignore rules
```

### Database Schema
- **users**: id, username, email, password, role, approved
- **medicines**: id, name, dosage, price, expiry_date, status, image_path
- **orders**: id, user_id, medicine_id, quantity, order_date, status
- **sessions**: Express session storage

## Key Functions

### Authentication Functions
- `registerUser()`: User registration with validation
- `loginUser()`: User authentication
- `logoutUser()`: Session destruction
- `changePassword()`: Password update
- `forgotPassword()`: Email-based password reset

### Medicine Management Functions
- `getMedicines()`: Retrieve all medicines
- `addMedicine()`: Add new medicine to database
- `updateMedicine()`: Modify existing medicine
- `deleteMedicine()`: Remove medicine from inventory
- `searchMedicines()`: Search medicines by name

### Order Management Functions
- `placeOrder()`: Create new order
- `getUserOrders()`: Retrieve user's order history
- `getAllOrders()`: Admin view of all orders
- `updateOrderStatus()`: Change order status

### Utility Functions
- `isAuthenticated()`: Middleware for authentication
- `isAdmin()`: Middleware for admin access
- `uploadImage()`: Handle file uploads
- `sendEmail()`: Email notifications

## Security Features
- Password hashing with bcrypt
- Session-based authentication
- CSRF protection
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- File upload restrictions

## Responsive Design
- Mobile-first approach
- Bootstrap grid system
- Custom media queries for tablets and desktops
- Touch-friendly interface elements

## Performance Optimizations
- Efficient database queries
- Image optimization for uploads
- Caching with browser caching headers
- Minified CSS and JavaScript

## Deployment
- Environment variables for configuration
- Production-ready session secrets
- Database backup strategies
- Error logging and monitoring

## Future Enhancements
- Real-time notifications with WebSockets
- Advanced search with filters
- Inventory alerts for low stock
- Multi-language support
- API endpoints for mobile app integration
- Payment gateway integration

## Installation and Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations
5. Start the server: `npm start`
6. Access at http://localhost:3000

## Contributing
- Follow the existing code style
- Write tests for new features
- Update documentation
- Create pull requests for changes

## License
This project is licensed under the MIT License.

---
*Generated on: November 2025*
*MediCare Medicine Management System v1.0*
