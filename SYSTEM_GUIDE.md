# QuickOrder System Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Backend Structure](#backend-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [Order Flow](#order-flow)
8. [Key Features](#key-features)
9. [Setup & Installation](#setup--installation)

---

## System Overview

**QuickOrder** is a full-stack web application for online food ordering with payment verification. It supports multiple user roles (Admin, Owner, Customer) and integrates with digital payment methods (GCash, Maya).

### Key Components:
- **Frontend**: HTML, CSS, JavaScript (ES6 modules)
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Payment Methods**: GCash & Maya (screenshot-based verification)
- **File Storage**: Local file uploads for payment proofs

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Public)                         │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │ Customer │  Admin   │  Owner   │  Menu    │ Checkout │   │
│  │ Portal   │ Panel    │ Panel    │ Page     │ Pages    │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
                    HTTP/REST API Requests
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │  Routes  │Middleware│ Services │ Models   │ Upload   │   │
│  │          │          │          │ Layer    │ Handler  │   │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
                    Database Queries (Mongoose)
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Database                          │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │  Users   │ Inventory│ Orders   │ Reports  │             │
│  │          │          │          │ (cached) │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## Backend Structure

### Directory Layout

```
src/
├── middleware/
│   ├── appMiddleware.js       # Global middleware setup
│   ├── auth.js                # JWT authentication
│   ├── authorization.js       # Role-based access control
│   ├── error.js               # Error middleware
│   ├── errorHandler.js        # Error handling utility
│   └── validation.js          # Input validation
├── models/
│   ├── user.js                # User schema (Admin, Owner, Customer)
│   ├── inventory.js           # Menu items schema
│   └── order.js               # Orders schema
├── routes/
│   ├── auth.js                # /api/auth/* endpoints
│   ├── inventory.js           # /api/inventory/* endpoints
│   ├── orders.js              # /api/orders/* endpoints
│   ├── reports.js             # /api/reports/* endpoints
│   ├── upload.js              # /api/upload/* endpoints
│   └── health.js              # /api/health endpoint
├── services/
│   └── email.service.js       # Email notification service
├── utils/
│   ├── errors.js              # Custom error classes
│   ├── logger.js              # Logging utility
│   └── order.js               # Order utility functions
└── server.js                  # Main server entry point
```

### Key Files Explained

#### `server.js` - Main Application Entry Point
- Initializes Express server on port 3000
- Connects to MongoDB
- Sets up middleware and routes
- Includes seed data for initial setup

#### `src/models/user.js` - User Schema
```javascript
{
  username: String (unique),
  password: String (hashed),
  role: String (admin | owner | customer),
  email: String,
  createdAt: Date
}
```

#### `src/models/inventory.js` - Inventory Item Schema
```javascript
{
  itemName: String (required),
  category: String (required),
  price: Number (required),
  unit: String (default: 'pcs'),
  quantity: Number (required),
  alertLevel: Number (default: 0),
  description: String,
  image: String (base64 or URL),
  isAvailable: Boolean (default: true),
  createdAt: Date
}
```

#### `src/models/order.js` - Order Schema
```javascript
{
  orderId: String (unique, auto-generated format: #QO000001),
  customerId: ObjectId (reference to User),
  items: [
    {
      itemId: ObjectId (reference to Inventory),
      name: String,
      quantity: Number,
      price: Number
    }
  ],
  total: Number,
  customerInfo: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  paymentMethod: String (GCash | Maya),
  paymentScreenshot: String (image URL),
  status: String (pending | preparing | ready | complete | cancelled),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Database Schema

### Users Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `username` | String | Unique login identifier |
| `password` | String | Hashed password (bcrypt) |
| `role` | String | admin, owner, or customer |
| `email` | String | User email |
| `createdAt` | Date | Account creation timestamp |

**Roles:**
- **Admin**: Can view inventory and toggle item availability
- **Owner**: Full access to inventory, orders, and reports
- **Customer**: Can place orders (not registered in system)

### Inventory Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `itemName` | String | Product name |
| `category` | String | Product category (burger, pizza, desserts, etc.) |
| `price` | Number | Item price in PHP |
| `quantity` | Number | Current stock level |
| `unit` | String | Measurement unit (pcs, cup, etc.) |
| `alertLevel` | Number | Low stock threshold |
| `description` | String | Item description |
| `image` | String | Base64 or image URL |
| `isAvailable` | Boolean | Availability flag |
| `createdAt` | Date | Item creation timestamp |

**Indexes:**
- Category (for fast filtering)
- createdAt (for sorting)

### Orders Collection

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Primary key |
| `orderId` | String | Human-readable order ID (#QO000001) |
| `items` | Array | Order line items with itemId, name, qty, price |
| `total` | Number | Total order amount |
| `customerInfo` | Object | Name, email, phone, address |
| `paymentMethod` | String | GCash or Maya |
| `paymentScreenshot` | String | URL to payment proof image |
| `status` | String | pending, preparing, ready, complete, cancelled |
| `createdAt` | Date | Order timestamp |
| `updatedAt` | Date | Last update timestamp |

**Status Flow:**
```
pending → preparing → ready → complete
   ↓                              ↓
cancelled ← ← ← ← ← ← ← ← ← ← ← 
```

---

## API Endpoints

### Authentication Routes (`/api/auth/*`)

#### Login
```
POST /api/auth/login
Body: { username: string, password: string }
Returns: { token: JWT, role: string, username: string }
```

#### Check Username
```
POST /api/auth/check-username
Body: { username: string }
Returns: { exists: boolean, role: string }
```

#### Verify Token
```
GET /api/auth/verify
Headers: { x-auth-token: JWT }
Returns: { username: string, role: string }
```

---

### Inventory Routes (`/api/inventory/*`)

#### Get All Items
```
GET /api/inventory
Returns: Array of inventory items
Query: ?category=pizza (optional filter)
```

#### Create Item
```
POST /api/inventory
Headers: { x-auth-token: JWT }
Body: { itemName, category, price, quantity, unit, alertLevel, description, image }
Returns: { _id, ...itemData }
Auth: Owner only
```

#### Update Item
```
PATCH /api/inventory/:id
Headers: { x-auth-token: JWT }
Body: { itemName?, category?, price?, quantity?, isAvailable?, ... }
Returns: Updated item object
Auth: Owner/Admin
```

#### Delete Item
```
DELETE /api/inventory/:id
Headers: { x-auth-token: JWT }
Auth: Owner only
```

---

### Orders Routes (`/api/orders/*`)

#### Get All Orders
```
GET /api/orders
Headers: { x-auth-token: JWT }
Returns: Array of all orders
Query: ?status=pending (optional filter)
Auth: Admin/Owner
```

#### Create Order
```
POST /api/orders
Body: { 
  items: [{ itemId, name, quantity, price }],
  total: number,
  customerInfo: { name, email, phone, address },
  paymentMethod: string,
  paymentScreenshot: string
}
Returns: { orderId, _id, ...orderData }
```

#### Update Order Status
```
PATCH /api/orders/:id
Headers: { x-auth-token: JWT }
Body: { status: string }
Returns: Updated order object
Auth: Admin/Owner
```

---

### Upload Routes (`/api/upload/*`)

#### Upload Image
```
POST /api/upload
Headers: { x-auth-token: JWT (optional) }
FormData: { paymentScreenshot: File }
Returns: { fileUrl: string, fileName: string }
```

---

### Reports Routes (`/api/reports/*`)

#### Get Popular Items
```
GET /api/reports/popular-items
Returns: { items: [{ itemId, itemName, orderCount }] }
```

#### Get Daily Revenue
```
GET /api/reports/daily-revenue
Query: ?date=2025-11-20
Returns: { date, totalRevenue, orderCount }
```

---

### Health Check Route

#### System Health
```
GET /api/health
Returns: { status: "ok", timestamp: Date }
```

---

## Authentication & Authorization

### JWT (JSON Web Token) Flow

```
1. User Login
   ↓
2. Verify credentials against hashed password
   ↓
3. Generate JWT token (expires in 24 hours)
   ↓
4. Client stores token in localStorage
   ↓
5. For protected routes, include token in header:
   x-auth-token: <JWT_TOKEN>
   ↓
6. Server verifies token before granting access
```

### Middleware Stack

1. **appMiddleware.js**: CORS, body parsing, JSON handling
2. **auth.js**: JWT verification and token extraction
3. **authorization.js**: Role-based access control (RBAC)
4. **validation.js**: Input sanitization and validation
5. **errorHandler.js**: Global error catching

### Role Permissions

| Action | Admin | Owner | Customer |
|--------|-------|-------|----------|
| View Inventory | ✅ | ✅ | ✅ |
| Add Item | ❌ | ✅ | ❌ |
| Edit Item | ❌ | ✅ | ❌ |
| Delete Item | ❌ | ✅ | ❌ |
| Toggle Availability | ✅ | ✅ | ❌ |
| View All Orders | ✅ | ✅ | ❌ |
| Update Order Status | ✅ | ✅ | ❌ |
| Create Order | ✅ | ✅ | ✅ |
| View Reports | ❌ | ✅ | ❌ |

---

## Order Flow

### Customer Order Process

```
1. Browse Menu
   └─ GET /api/inventory (fetch all items)

2. Select Items & Add to Cart
   └─ Client-side cart management (stateService)

3. Enter Customer Details
   └─ Name, email, phone, address

4. Select Payment Method
   └─ GCash or Maya

5. Upload Payment Proof
   └─ POST /api/upload (upload screenshot)

6. Submit Order
   └─ POST /api/orders (create order with proof)

7. Receive Confirmation
   └─ Redirect to receipt page with orderId
   └─ Display order summary and reference number
```

### Admin/Owner Order Management

```
1. View Active Orders
   └─ GET /api/orders (view all pending orders)

2. Update Order Status
   └─ PATCH /api/orders/:id { status: "preparing" }

3. Track Progress
   └─ pending → preparing → ready → complete

4. Monitor Inventory
   └─ GET /api/inventory (view stock levels)

5. Update Stock
   └─ PATCH /api/inventory/:id { quantity: newQty }

6. View Reports
   └─ GET /api/reports/* (analytics)
```

---

## Key Features

### 1. Dynamic Category Management
- **Predefined**: burger, pizza, others, drinks, rice, pasta, coffee, bundle
- **Custom**: Users can create custom categories (e.g., desserts)
- Categories dynamically populated in filters across all pages
- Normalized to lowercase for consistency

### 2. Inventory System
- Real-time stock tracking
- Low stock alerts (configurable threshold)
- Item availability toggle (Admin/Owner)
- Out of stock items disabled from ordering

### 3. Order Management
- Auto-generated order IDs (#QO000001 format)
- Status tracking with visual indicators
- Payment screenshot verification
- Order history and statistics

### 4. Payment Processing
- **GCash**: Number 0917-123-4567 (sample)
- **Maya**: Number 0920-987-6543 (sample)
- Screenshot-based verification (manual approval workflow)
- File upload with validation
- Progress tracking for uploads

### 5. Dark Mode
- Toggle dark/light mode on all pages
- Preference saved in localStorage
- Comprehensive dark mode styling
- Better readability in low-light environments

### 6. Reports & Analytics
- Popular items tracking (most ordered)
- Daily revenue calculation
- Order count by status
- Visual report dashboard

### 7. Responsive Design
- Mobile-first approach
- Works on all screen sizes
- Touch-friendly interface
- Optimized for fast loading

---

## Setup & Installation

### Prerequisites
- Node.js v14+
- MongoDB (local or cloud)
- npm or yarn

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/quickorder-system/QuickOrder.git
   cd QuickOrder
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file (or use default settings):
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/quickorder
   JWT_SECRET=your_secret_key_here
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Start Server**
   ```bash
   npm run dev    # Development with hot reload
   npm start      # Production
   ```

6. **Access Application**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/Admin.html
   - Owner Panel: http://localhost:3000/Owner.html

### Default Login Credentials

**Admin Account:**
- Username: admin
- Password: admin123

**Owner Account:**
- Username: owner
- Password: owner123

### Seed Data

On first startup, the server automatically seeds:
- 2 user accounts (admin, owner)
- 15+ menu items across 7 categories
- Sample orders for testing

---

## Common Workflows

### Adding a New Menu Item (Owner)

1. Login to Owner Panel
2. Go to Inventory tab
3. Click "Add New Item"
4. Fill in details:
   - Item Name
   - Category (or create new custom category like "desserts")
   - Price
   - Stock Quantity
   - Description (optional)
   - Image (optional)
5. Click "Save Item"
6. Item appears in menu immediately

### Processing an Order (Admin/Owner)

1. View "Active Orders" tab
2. See pending orders with customer details
3. Update status:
   - pending → preparing (start cooking)
   - preparing → ready (order ready for pickup)
   - ready → complete (customer picked up)
4. Update inventory quantities if needed
5. View order summary and payment proof

### Viewing Reports (Owner)

1. Go to "Reports" tab
2. Check:
   - Daily revenue (by date)
   - Popular items (most ordered)
   - Order statistics
3. Export or print reports if needed

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| MongoDB connection failed | Ensure MongoDB is running, check connection string |
| JWT token expired | Login again, token lasts 24 hours |
| Image upload fails | Check file size (<5MB), format (PNG/JPG) |
| Category filter not updating | Clear browser cache (Ctrl+Shift+R) |
| Orders not showing | Check order status filter, verify user role |

### Debug Mode

Enable debug logging:
```bash
NODE_DEBUG=* npm run dev
```

---

## Performance Optimization

### Database Queries
- Indexed collections on frequently queried fields
- Pagination support for large datasets
- Aggregation pipelines for reports

### Frontend
- Lazy loading of images
- CSS/JS minification
- Service worker for offline caching
- Debounced search and filter operations

### Backend
- Response caching for frequently accessed endpoints
- Compression of JSON responses
- Connection pooling for MongoDB
- Rate limiting on sensitive endpoints

---

## Security Best Practices

1. **Password Security**: Bcrypt hashing with salt rounds
2. **JWT Tokens**: Signed with secret, 24-hour expiry
3. **Input Validation**: All user inputs sanitized
4. **CORS**: Restricted to trusted origins
5. **File Upload**: Type and size validation
6. **SQL Injection**: N/A (using MongoDB)
7. **XSS Protection**: Input escaping in templates

---

## Contributing Guidelines

1. Follow existing code structure
2. Use meaningful commit messages
3. Test changes thoroughly
4. Update documentation
5. Submit pull requests with clear descriptions

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues or questions:
- Email: system.quickorder@gmail.com
- GitHub Issues: [quickorder-system/QuickOrder](https://github.com/quickorder-system/QuickOrder/issues)

---

**Last Updated**: November 20, 2025
**Version**: 1.0.0
