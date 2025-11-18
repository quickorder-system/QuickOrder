# QuickOrder - Restaurant Management System

QuickOrder is a full-stack web application designed to streamline restaurant operations. It provides a user-friendly interface for customers to browse the menu and place orders, and a comprehensive dashboard for administrators and owners to manage orders, inventory, and view sales reports.

## Features

### Customer Facing
- Modern and responsive landing page with dark mode support
- Browse menu with search and filter functionality
- Add items to a shopping cart with quantity management
- Place orders with customer details and email confirmation
- Upload proof of payment with file validation
- Real-time order status tracking (Pending → Preparing → Ready → Completed)
- Order confirmation and receipt generation
- Payment method selection

### Admin & Owner Dashboard
- **Order Management**: View, update status, and cancel orders in real-time
- **Inventory Management**: Add, edit, delete menu items with categories
- **Sales Analytics**: View comprehensive sales reports with multiple time periods
- **Report Generation**: Daily, weekly, monthly, and yearly sales analytics
- **Export Functionality**: Export reports to CSV format
- **User Authentication**: JWT-based login with role-based access control (Admin, Owner, Customer)
- **Email Notifications**: Automated emails for order status updates and confirmations

## Technologies Used

### Backend
- **Node.js** v18.20.8
- **Express.js** v4.21.2
- **MongoDB Atlas** with Mongoose ODM v7.8.7
- **SendGrid** HTTP Web API v3 for email delivery
- **JWT** for authentication with 24-hour token expiration
- **Helmet** for security headers
- **express-rate-limit** for API rate limiting
- **Multer** for file uploads and validation
- **bcrypt** for password hashing
- **dotenv** for environment configuration

### Frontend
- **HTML5** with semantic markup
- **CSS3** with Grid/Flexbox, CSS variables for theming
- **Vanilla JavaScript** (ES6+) with component-based architecture
- **Chart.js** for sales analytics visualization
- **Dark Mode** support with localStorage persistence
- **Responsive Design** optimized for mobile, tablet, and desktop

## Setup and Installation

### Prerequisites
- Node.js v18+ 
- MongoDB Atlas account or local MongoDB instance
- SendGrid account for email service

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/quickorder-system/QuickOrder.git
   cd QuickOrder
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/quickorder
   JWT_SECRET=your_jwt_secret_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_EMAIL=system.quickorder@gmail.com
   PORT=8080
   NODE_ENV=development
   ```

4. **Run the application:**
   ```bash
   npm start
   ```
   Development: `http://localhost:8080`
   Production: `https://quickorder-production-145f.up.railway.app`

## Project Structure

```
QuickOrder/
├── public/                          # Frontend assets
│   ├── css/                        # Stylesheets (base, components, pages)
│   ├── js/                         # Client-side JavaScript
│   │   ├── components/             # Reusable components (cart, order-card)
│   │   ├── services/               # API and state management services
│   │   ├── utils/                  # Utility functions
│   │   └── pages/                  # Page-specific scripts
│   ├── image/                      # Images and assets
│   ├── uploads/                    # User-uploaded files
│   └── *.html                      # Page templates
├── src/                             # Backend source code
│   ├── middleware/                 # Express middleware
│   │   ├── auth.js                # JWT authentication
│   │   ├── authorization.js       # Role-based access control
│   │   ├── validation.js          # Request validation
│   │   └── errorHandler.js        # Global error handling
│   ├── models/                    # Mongoose schemas
│   │   ├── user.js                # User model (Customer, Admin, Owner)
│   │   ├── order.js               # Order model with status tracking
│   │   └── inventory.js           # Menu item model
│   ├── routes/                    # API endpoints
│   │   ├── auth.js                # Authentication routes
│   │   ├── orders.js              # Order CRUD operations
│   │   ├── inventory.js           # Inventory management
│   │   ├── reports.js             # Sales analytics endpoints
│   │   ├── upload.js              # File upload handling
│   │   └── health.js              # Health check endpoint
│   ├── services/                  # Business logic services
│   │   └── email.service.js       # SendGrid email delivery
│   └── utils/                     # Utility functions
│       ├── logger.js              # Logging utility
│       └── errors.js              # Custom error classes
├── tests/                          # Test files
├── docker-compose.yml              # Docker configuration
├── Dockerfile                      # Container image definition
├── railway.json                    # Railway deployment config
├── server.js                       # Main application entry point
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Orders
- `GET /api/orders` - Get all orders (paginated)
- `GET /api/orders/:id` - Get order by ID (supports both MongoDB ObjectId and custom orderId)
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status (Admin/Owner only)
- `PUT /api/orders/:id/cancel` - Cancel order
- `DELETE /api/orders/:id` - Delete order (Admin/Owner only)

### Inventory
- `GET /api/inventory` - Get all menu items
- `GET /api/inventory/:id` - Get item by ID
- `POST /api/inventory` - Create item (Owner only)
- `PUT /api/inventory/:id` - Update item (Owner only)
- `DELETE /api/inventory/:id` - Delete item (Owner only)

### Reports
- `GET /api/reports/daily` - Daily sales report
- `GET /api/reports/weekly` - Weekly sales report
- `GET /api/reports/monthly` - Monthly sales report
- `GET /api/reports/yearly` - Yearly sales report
- `GET /api/reports/sales` - Custom date range sales report

### File Upload
- `POST /api/upload` - Upload payment proof (multipart/form-data)

### Health
- `GET /api/health` - Server health check with environment status

## Deployment

QuickOrder is deployed on **Railway.app** using Docker. The application runs on port 8080 and includes:
- MongoDB Atlas cloud database
- SendGrid for email delivery (HTTP API, not SMTP)
- Auto-scaling capabilities
- Environment-based configuration
- Health check endpoints

### Deploying to Railway
1. Push code to GitHub
2. Connect Railway to repository
3. Configure environment variables in Railway dashboard
4. Deploy with `npm start` command

## Key Features Implemented

### Security
- JWT authentication with secure token validation
- Role-based access control (RBAC) for Admin/Owner/Customer
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection with Helmet security headers
- File upload validation and sanitization

### Performance
- MongoDB aggregation pipelines for analytics
- Indexed database queries for fast retrieval
- Email delivery via HTTP API (port 443) for reliability
- 5-second auto-refresh for real-time order updates
- Lazy loading and code splitting for frontend

### User Experience
- Real-time order status updates
- Dark mode with theme persistence
- Responsive mobile-first design
- Comprehensive error handling
- Loading states and user feedback
- Export functionality for data analysis

## Troubleshooting

### Email Not Sending
- Verify SendGrid API key in environment variables
- Check firewall settings - HTTP API uses port 443
- Review SendGrid dashboard for bounce/delivery reports

### Database Connection Issues
- Verify MongoDB URI connection string
- Check MongoDB Atlas network access settings
- Confirm IP whitelist includes your server

### Order Status Updates Not Working
- Verify JWT tokens haven't expired
- Check authorization middleware for role-based access
- Review server logs for middleware errors

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For issues or questions, please open an issue on GitHub or contact the development team.
