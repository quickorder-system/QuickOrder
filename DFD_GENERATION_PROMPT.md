# Data Flow Diagram Generation Prompt for Gemini Pro

## System Context

You are a technical system architect tasked with analyzing and generating a **Data Flow Diagram (DFD)** for the QuickOrder application. This is a full-stack web application built with Node.js, Express, and MongoDB.

---

## Application Architecture Overview

### Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6 modules)
- **Backend:** Node.js with Express.js framework
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **Security:** Helmet.js, CORS, Rate limiting, Express validator

### Project Structure
```
QuickOrder/
├── server.js                          # Main Express application entry point
├── public/                            # Frontend - static files
│   ├── HTML files (Login, Menu, Orders, etc.)
│   ├── css/                          # Stylesheets
│   └── js/                           # Client-side JavaScript
│       ├── services/                 # API service layer
│       │   ├── api.service.js       # HTTP client wrapper
│       │   └── state.service.js     # Client-side state management
│       └── components/              # Reusable UI components
├── src/                              # Backend source code
│   ├── models/                       # Mongoose data models
│   │   ├── user.js                  # User schema (username, password, role)
│   │   ├── order.js                 # Order schema
│   │   └── inventory.js             # Inventory/Menu items schema
│   ├── routes/                       # API endpoint definitions
│   │   ├── auth.js                  # POST /api/auth/login, /register
│   │   ├── orders.js                # GET/POST /api/orders
│   │   ├── inventory.js             # GET/PUT /api/inventory
│   │   ├── upload.js                # POST /api/upload (file handling)
│   │   ├── reports.js               # GET /api/reports/sales
│   │   └── health.js                # GET /api/health
│   ├── middleware/                   # Express middleware functions
│   │   ├── auth.js                  # JWT token verification
│   │   ├── authorization.js         # Role-based access control
│   │   ├── validation.js            # Input validation
│   │   └── errorHandler.js          # Error handling
│   └── utils/                        # Utility functions
│       ├── logger.js                # Logging utility
│       └── order.js                 # Order ID generation
└── uploads/                          # File storage directory
```

---

## Database Schema Details

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  password: String (bcrypt hashed, required),
  role: Enum['admin', 'owner', 'customer'] (default: 'customer')
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  orderId: String (unique, auto-generated),
  customerName: String (required),
  customerPhone: String (required),
  address: String (required),
  paymentMethod: String (required),
  paymentScreenshot: String (file path),
  specialInstructions: String,
  items: [
    {
      itemId: Number,
      name: String,
      quantity: Number (1-10),
      price: Number
    }
  ],
  total: Number,
  status: Enum['pending', 'preparing', 'ready', 'complete', 'cancelled'],
  createdAt: Date,
  updatedAt: Date
}
```

### Inventory Collection
```javascript
{
  _id: ObjectId,
  itemName: String (required),
  category: String (required),
  price: Number (required, min: 0),
  unit: String (default: 'pcs'),
  quantity: Number (required, min: 0),
  alertLevel: Number (min: 0),
  description: String,
  image: String (image file path),
  isAvailable: Boolean (default: true),
  createdAt: Date
}
```

---

## API Endpoints & Data Flow

### Authentication Flow
**POST /api/auth/login**
- Input: `{ username: string, password: string }`
- Process: 
  1. Query Users table by username
  2. Use bcrypt.compare() to validate password
  3. Generate JWT token containing user ID and role
  4. Set expiration: 1 hour (configurable)
- Output: `{ token: string, user: { id, role } }`
- Error: 401 Unauthorized if credentials invalid

**POST /api/auth/register**
- Input: `{ username: string, password: string }`
- Process:
  1. Hash password with bcrypt
  2. Create new User document
  3. Save to Users collection
- Output: `{ id, username, role: 'customer' }`

### Menu/Inventory Flow
**GET /api/inventory**
- Input: None (no auth required)
- Process: Query all InventoryItem documents from Inventory collection
- Output: `[{ _id, itemName, price, category, image, isAvailable, quantity, ... }]`
- Use Case: Customer browses menu on public-facing pages

**POST /api/inventory** (protected)
- Input: `{ itemName, category, price, quantity, alertLevel, description, image }`
- Process:
  1. Verify JWT token (admin/owner only)
  2. Create new InventoryItem document
  3. Save to Inventory collection
- Output: `{ _id, itemName, ... }` (complete saved object)

### Order Creation Flow
**POST /api/orders**
- Input: 
  ```javascript
  {
    customerName: string,
    customerPhone: string,
    address: string,
    paymentMethod: string,
    paymentScreenshot: string (file path from upload),
    specialInstructions: string,
    items: [{ itemId, name, quantity, price }],
    total: number
  }
  ```
- Process:
  1. Validate input data with express-validator
  2. Create new Order document
  3. Pre-save hook generates unique orderId
  4. Set initial status to 'pending'
  5. Save to Orders collection
- Output: `{ _id, orderId, customerName, items, total, status: 'pending', createdAt }`

**GET /api/orders**
- Input: None
- Process: Query all Order documents, sort by date descending
- Output: `[{ _id, orderId, customerName, total, status, createdAt, ... }]`

**GET /api/orders/:id**
- Input: Order document ID in URL parameter
- Process: Query single Order by _id
- Output: Complete Order document

**PUT /api/orders/:id** (implied - for status updates)
- Input: `{ status: 'preparing' | 'ready' | 'complete' | 'cancelled' }`
- Process: Update Order document status
- Output: Updated Order document

### File Upload Flow
**POST /api/upload**
- Input: Multipart form data with file (paymentScreenshot)
- Process:
  1. Use multer middleware to handle file upload
  2. Save file to `/uploads` directory
  3. Generate unique filename (timestamp-based or UUID)
  4. Return file path
- Output: `{ filename: string, path: string }`
- File Storage: Stored in filesystem at `/uploads/[filename]`

### Reports/Analytics Flow
**GET /api/reports/sales**
- Input: Query parameters
  - `startDate` (YYYY-MM-DD format)
  - `endDate` (YYYY-MM-DD format)
- Process:
  1. Validate date parameters
  2. MongoDB aggregation pipeline on Orders collection:
     - $match: Filter orders within date range
     - $match: Filter status = 'complete' (only completed orders)
     - $group: Group by day, sum totals
     - $sort: Sort by date ascending
  3. Calculate daily revenue
- Output: 
  ```javascript
  [
    { _id: '2024-01-01', total: 5000 },
    { _id: '2024-01-02', total: 8500 },
    ...
  ]
  ```
- Chart Format: Ready for Chart.js library rendering

---

## Primary User Workflows

### Workflow 1: Customer Places an Order

**Step-by-step data flow:**

1. **Menu Retrieval**
   - Actor: Customer browser
   - Trigger: Page load (menu.html)
   - Action: `GET /api/inventory`
   - Data Flow: Customer UI → Inventory Route → Inventory Collection → Customer UI
   - Data: Array of menu items with prices, categories, images

2. **Item Selection**
   - Actor: Customer
   - Trigger: Click "Add to Cart" button
   - Action: Local state management (state.service.js)
   - Data Flow: Item data → Client-side cart state
   - Data: `{ itemId, name, quantity, price }`

3. **Payment Screenshot Upload**
   - Actor: Customer
   - Trigger: Select file in payment form
   - Action: `POST /api/upload` with FormData
   - Data Flow: Customer browser → Upload Route → File System
   - Data: Binary file data → Stored as `/uploads/[filename].jpg`
   - Response: File path string

4. **Order Submission**
   - Actor: Customer
   - Trigger: Click "Place Order" button
   - Action: `POST /api/orders`
   - Data Flow: Order Form → Order Route → Order Collection
   - Data Validated: Customer info, items array, payment method, file reference
   - Response: Order ID, confirmation details

5. **Receipt Display**
   - Actor: Customer browser
   - Trigger: Order API response received
   - Action: Render receipt.html with order data
   - Data Flow: Order object → Receipt template
   - Display: Order ID, items, total, delivery address

---

### Workflow 2: Owner Views Sales Dashboard

**Step-by-step data flow:**

1. **Authentication**
   - Actor: Owner
   - Trigger: Login form submission
   - Action: `POST /api/auth/login`
   - Data Flow: Credentials → Auth Route → Users Collection → JWT generation → Client
   - Validation: Username lookup, password bcrypt verification
   - Response: JWT token with embedded role

2. **Authorization Check**
   - Actor: Client (browser with JWT)
   - Trigger: All subsequent requests
   - Middleware: auth.js JWT verification
   - Data Flow: JWT token (in header) → Auth middleware → Verified user object
   - Access Control: Role check (owner/admin required for reports)

3. **Date Range Selection**
   - Actor: Owner in dashboard
   - Trigger: Select dates in date picker
   - Action: User selects startDate and endDate
   - Data Flow: Form input → Query parameters
   - Data: startDate='2024-01-01', endDate='2024-01-31'

4. **Report Generation**
   - Actor: Backend service
   - Trigger: `GET /api/reports/sales?startDate=...&endDate=...`
   - Action: MongoDB aggregation pipeline
   - Data Flow: Reports Route → Orders Collection → Aggregation → Response
   - Pipeline Steps:
     * Match orders between dates
     * Match status = 'complete'
     * Group by day, sum totals
     * Sort by date
   - Response: Array of daily sales totals

5. **Chart Rendering**
   - Actor: Frontend JavaScript
   - Trigger: Receive report data from API
   - Action: Convert data to Chart.js format
   - Data Flow: JSON array → Chart.js dataset → SVG chart render
   - Display: Line/bar chart showing daily revenue trend

---

## Data Stores

| Store | Type | Primary Use | Key Fields |
|-------|------|-------------|-----------|
| Users Collection | MongoDB | Authentication, user management | username, password, role |
| Orders Collection | MongoDB | Order tracking, order history | orderId, customerName, items, total, status, createdAt |
| Inventory Collection | MongoDB | Menu management, availability | itemName, price, category, quantity, isAvailable |
| File System (/uploads) | Filesystem | Payment proof storage | Binary files, organized by upload date |
| Client Session (localStorage) | Browser Memory | Cart state, user token | JWT token, selected items |

---

## Security & Middleware Processing

### Request Processing Pipeline

```
Incoming Request
    ↓
CORS Middleware (cors)
    ↓
Helmet Security Headers
    ↓
Body Parser (JSON, URL-encoded)
    ↓
Request Logging (custom middleware)
    ↓
Rate Limiting (express-rate-limit - optional)
    ↓
Route Handler
    ├─ Auth Middleware (JWT verification) - if protected route
    ├─ Validation Middleware (express-validator)
    ├─ Authorization Middleware (role check)
    └─ Route Logic
         ├─ Query/Command to MongoDB
         ├─ File operations (if upload)
         └─ Response formatting
    ↓
Error Handling Middleware
    ↓
Response to Client
```

### Authentication Flow Details

1. **Password Storage:**
   - Input password hashed with bcrypt (salt rounds: 10)
   - Never stored in plaintext
   - Comparison uses bcrypt.compare() for security

2. **Token Generation:**
   - JWT payload: `{ user: { id, role } }`
   - Secret: process.env.JWT_SECRET
   - Expiration: 1 hour (configurable)

3. **Token Validation:**
   - Extracted from header: `x-auth-token`
   - Verified using jwt.verify()
   - User object attached to request for downstream middleware

4. **Role-Based Access:**
   - 'customer': Can place orders, view own orders
   - 'owner': Can manage inventory, view reports, process orders
   - 'admin': Full system access (superuser)

---

## External Integrations

### File System
- **Upload Directory:** `/uploads/`
- **File Types:** Images (JPG, PNG)
- **Naming Convention:** Timestamp-based or UUID
- **Data Reference:** File path stored in Order.paymentScreenshot field

### Payment Gateway (Planned/Reference Only)
- Not directly integrated in current code
- Customers manually complete payment on external gateway
- Proof uploaded as screenshot
- Manual verification by owner/admin

### Email Notifications (Not Implemented)
- Could send order confirmation to customer
- Could alert owner of new orders
- Would require email service integration

---

## Data Transformation & Processing

### Order Creation Process

```
Raw Form Data
    ↓
Input Validation (validateOrder middleware)
    ├─ Check required fields
    ├─ Validate phone format
    ├─ Validate price numbers
    └─ Verify file path exists
    ↓
Data Normalization
    ├─ Trim whitespace
    ├─ Calculate totals
    └─ Convert types
    ↓
Pre-save Processing (Mongoose pre-save hook)
    ├─ Generate unique orderId
    ├─ Set createdAt timestamp
    └─ Set initial status='pending'
    ↓
MongoDB Insert
    ↓
Response Formatting
    └─ Return created Order object with _id
```

### Report Aggregation Process

```
Query Parameters (startDate, endDate)
    ↓
Date Validation & Parsing
    ├─ Convert to Date objects
    ├─ Set time bounds (00:00 to 23:59)
    └─ Validate startDate < endDate
    ↓
MongoDB Aggregation Pipeline
    ├─ $match: { createdAt: { $gte, $lte }, status: 'complete' }
    ├─ $group: { _id: $dateToString, total: $sum }
    ├─ $sort: { _id: 1 }
    └─ Project: { date: $_id, revenue: $total }
    ↓
Data Formatting
    └─ Convert to Chart.js compatible format
    ↓
JSON Response
```

---

## Diagram Elements Reference

### Entities (Actors)
- **Customer:** Browses menu, places orders, uploads payment proofs
- **Owner/Admin:** Manages inventory, processes orders, views analytics
- **Payment Gateway:** External system for payment (future integration)
- **File System:** Server storage for uploaded files

### Processes (Functions/Transformations)
- **User Authentication:** Login/registration, password hashing, JWT generation
- **Inventory Management:** CRUD operations on menu items
- **Order Creation:** Form submission, validation, database insert
- **Payment Upload:** File handling, storage, reference linking
- **Order Processing:** Status updates, order workflow
- **Report Generation:** Data aggregation, analytics
- **Authorization:** Role-based access control

### Data Flows (Data Movement)
- User credentials → Auth service → JWT token
- Menu request → Inventory service → Item array
- Order form → Validation → Order service → Database
- File → Upload service → File system + Database reference
- Date range → Report service → Aggregated sales data
- JWT token → Auth middleware → User context

### Data Stores
- **Users DB:** Credentials and roles
- **Orders DB:** Order records with status tracking
- **Inventory DB:** Menu items and availability
- **File Storage:** Payment screenshots and images

---

## Key Technical Considerations for DFD

### Synchronous vs Asynchronous

- **Synchronous:** Authentication (JWT verification), validation, database queries with immediate response
- **Asynchronous:** File uploads, MongoDB saves, report aggregation (can be long-running)

### Error Handling Flows

- **Authentication Failure:** 401 Unauthorized, redirect to login
- **Validation Failure:** 400 Bad Request with error details
- **Database Error:** 500 Internal Server Error, logged for debugging
- **Authorization Failure:** 403 Forbidden, insufficient permissions

### Caching & Performance

- Inventory items fetched frequently (could be cached on client)
- Orders retrieved on-demand (no caching - real-time updates important)
- Reports generated fresh each request (computationally inexpensive due to aggregation)

---

## Instructions for Gemini Pro

Using the above information, generate a **comprehensive Data Flow Diagram (DFD)** that includes:

1. **DFD Level 0 (Context Diagram)**
   - Show QuickOrder system as a single bubble/process
   - Show all external entities
   - Show data flows between entities and system

2. **DFD Level 1 (Main Processes)**
   - Break down into 5-7 major processes
   - Show data flows between processes
   - Show interactions with data stores
   - Include external entities

3. **DFD Level 2 (Detailed - Optional)**
   - Focus on Order Processing or Report Generation
   - Show sub-processes
   - Show detailed data transformations

4. **Text Description for Each Diagram**
   - Clearly label all components
   - Use standard DFD notation:
     * **Circle** = Process
     * **Rectangular Box** = External Entity
     * **Parallel Lines** = Data Store
     * **Arrow** = Data Flow (label with data description)

5. **Data Dictionary Format**
   ```
   Data Flow Name:
   Source: [Process/Entity]
   Destination: [Process/Entity]
   Data Elements: [Fields included]
   Frequency: [How often]
   Volume: [Expected quantity]
   Format: [JSON, File, etc.]
   ```

6. **Process Specifications**
   For each major process, provide:
   - Input data requirements
   - Processing logic
   - Output data produced
   - Validation rules
   - Error handling

---

## Example Output Format

When generating the diagrams, use a format like:

```
DFD LEVEL 0: CONTEXT DIAGRAM
═══════════════════════════════

                    ┌──────────────┐
                    │  CUSTOMER    │
                    └──────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              Menu & │         Order &
              Orders │         Payment
                    │             │
      ┌─────────────┴────────────┐│
      │                          ││
      │   QuickOrder System      │└─────→ [PAYMENT GATEWAY]
      │                          │
      └─────────────┬────────────┘
                    │
              Reports│
                    │
                    ↓
              ┌──────────────┐
              │  OWNER/ADMIN │
              └──────────────┘
```

Generate ASCII or Mermaid diagram format (Mermaid is preferred for better rendering in Markdown).

---

## Summary

The QuickOrder application is a **3-tier web application** with the following key data flows:

1. **Customer Journey:** Browse Menu → Select Items → Upload Payment → Place Order → View Receipt
2. **Owner Journey:** Login → View Dashboard → Check Reports → Manage Inventory
3. **Data Persistence:** All user actions stored in MongoDB collections
4. **Security:** JWT authentication, bcrypt password hashing, role-based authorization

The DFD should clearly show how data moves through the system from initiation (customer/owner) through processing (API routes) to persistence (MongoDB) and back to users for consumption (UI rendering).

