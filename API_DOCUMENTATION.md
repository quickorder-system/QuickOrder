# QuickOrder API Documentation

**Version:** 1.0.0  
**Last Updated:** December 5, 2025  
**Base URL:** `https://quickorder.railway.app` (Production)  
**Local URL:** `http://localhost:5001` (Development)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [Auth Endpoints](#auth-endpoints)
   - [Customer Profile](#customer-profile)
   - [Address Management](#address-management)
   - [Orders](#orders)
   - [Discounts](#discounts)
   - [Admin Operations](#admin-operations)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Code Examples](#code-examples)

---

## Overview

The QuickOrder API is a RESTful API for managing customer orders, discounts, and administrative operations. The API requires authentication for most endpoints using JWT tokens.

### Key Features
- **Customer Management:** Registration, login, profile management
- **Order Management:** Create, view, track, and cancel orders
- **Discount System:** Apply discounts, validate codes, manage expiration
- **Address Management:** Multiple delivery addresses per customer
- **Admin Operations:** Manage discounts, view reports, track activities

### Technology Stack
- **Framework:** Express.js (Node.js)
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **Email:** SendGrid
- **Deployment:** Railway.app

---

## Authentication

### JWT Token Format
All authenticated endpoints require a JWT token in the request header:

```
Headers:
- x-auth-token: <jwt-token>
OR
- Authorization: Bearer <jwt-token>
```

### Token Structure
```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1701795600,
  "exp": 1701882000
}
```

**Token Expiration:** 24 hours  
**Refresh:** Login again to get new token

### Roles & Permissions
```
customer:
  - Browse menu
  - Place orders
  - Manage own addresses
  - Apply discounts

admin:
  - Manage discounts
  - View reports
  - View activity logs
  - Manage inventory

owner:
  - Full access to admin functions
  - Manage other admins
```

---

## API Endpoints

### Auth Endpoints

#### 1. Register Customer

**Endpoint:** `POST /api/auth/customer/register`

**Authentication:** No

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123",
  "name": "John Doe",
  "phone": "+919876543210"
}
```

**Field Validation:**
- `email`: Required, valid email format, unique
- `password`: Required, minimum 6 characters
- `name`: Required, string
- `phone`: Optional, valid phone format

**Success Response (201):**
```json
{
  "message": "Customer registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "+919876543210",
    "role": "customer",
    "emailVerified": false,
    "createdAt": "2025-12-05T10:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Email already registered"
}
```

**Error Codes:**
- `400` - Missing fields, invalid format, email exists
- `422` - Validation error

**Examples:**

```bash
# cURL
curl -X POST http://localhost:5001/api/auth/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123",
    "name": "John Doe"
  }'
```

```javascript
// JavaScript (Fetch)
const response = await fetch('http://localhost:5001/api/auth/customer/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePassword123',
    name: 'John Doe'
  })
});
const data = await response.json();
console.log(data);
```

```python
# Python (Requests)
import requests

response = requests.post(
  'http://localhost:5001/api/auth/customer/register',
  json={
    'email': 'john@example.com',
    'password': 'SecurePassword123',
    'name': 'John Doe'
  }
)
print(response.json())
```

---

#### 2. Verify Email

**Endpoint:** `POST /api/auth/customer/verify-email`

**Authentication:** No

**Rate Limit:** 3 requests per 15 minutes per IP

**Description:** Verify email address using token sent to email

**Request Body:**
```json
{
  "token": "email-verification-token-from-email"
}
```

**Success Response (200):**
```json
{
  "message": "Email verified successfully",
  "verified": true
}
```

**Error Response (400):**
```json
{
  "error": "Invalid or expired verification token"
}
```

---

#### 3. Login Customer

**Endpoint:** `POST /api/auth/customer/login`

**Authentication:** No

**Rate Limit:** 10 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "customer",
    "emailVerified": true
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

**Error Codes:**
- `400` - Missing fields
- `401` - Invalid credentials

---

#### 4. Logout Customer

**Endpoint:** `POST /api/auth/customer/logout`

**Authentication:** Yes (JWT Token)

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### 5. Forgot Password

**Endpoint:** `POST /api/auth/customer/forgot-password`

**Authentication:** No

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset email sent",
  "note": "Check your email for reset instructions"
}
```

---

#### 6. Reset Password

**Endpoint:** `POST /api/auth/customer/reset-password`

**Authentication:** No

**Request Body:**
```json
{
  "token": "password-reset-token",
  "newPassword": "NewSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### Customer Profile

#### Get Profile

**Endpoint:** `GET /api/customers/profile`

**Authentication:** Yes

**Success Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "name": "John Doe",
  "phone": "+919876543210",
  "role": "customer",
  "emailVerified": true,
  "preferences": {
    "notifications": true,
    "smsNotifications": false,
    "marketingEmails": true
  },
  "createdAt": "2025-12-05T10:30:00Z",
  "lastLogin": "2025-12-05T14:45:00Z"
}
```

---

#### Update Profile

**Endpoint:** `PUT /api/customers/profile`

**Authentication:** Yes

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+919876543210",
  "preferences": {
    "notifications": true,
    "marketingEmails": false
  }
}
```

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Smith",
    "phone": "+919876543210",
    "preferences": {
      "notifications": true,
      "marketingEmails": false
    }
  }
}
```

---

#### Change Password

**Endpoint:** `POST /api/customers/change-password`

**Authentication:** Yes

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

**Validation:**
- New password must be different from current
- New password minimum 6 characters

**Success Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Current password is incorrect"
}
```

---

### Address Management

#### Get All Addresses

**Endpoint:** `GET /api/customers/addresses`

**Authentication:** Yes

**Query Parameters:**
- `label` (optional): Filter by label (home, work, other)

**Success Response (200):**
```json
{
  "addresses": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "label": "home",
      "street": "123 Main St",
      "city": "Manila",
      "postalCode": "1234",
      "phone": "+919876543210",
      "isDefault": true,
      "createdAt": "2025-12-05T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "label": "work",
      "street": "456 Business Ave",
      "city": "Quezon City",
      "postalCode": "5678",
      "phone": "+919876543211",
      "isDefault": false,
      "createdAt": "2025-12-05T11:30:00Z"
    }
  ]
}
```

---

#### Add Address

**Endpoint:** `POST /api/customers/addresses`

**Authentication:** Yes

**Request Body:**
```json
{
  "label": "home",
  "street": "123 Main St",
  "city": "Manila",
  "postalCode": "1234",
  "phone": "+919876543210"
}
```

**Validation:**
- `label`: Must be 'home', 'work', or 'other'
- `street`: Required, max 100 chars
- `city`: Required, max 50 chars
- `postalCode`: Required, max 10 chars
- `phone`: Optional, valid format

**Success Response (201):**
```json
{
  "message": "Address added successfully",
  "address": {
    "_id": "507f1f77bcf86cd799439014",
    "label": "home",
    "street": "123 Main St",
    "city": "Manila",
    "postalCode": "1234",
    "phone": "+919876543210",
    "isDefault": true
  }
}
```

---

#### Update Address

**Endpoint:** `PUT /api/customers/addresses/:addressId`

**Authentication:** Yes

**URL Parameters:**
- `addressId`: Address ID to update

**Request Body:**
```json
{
  "street": "789 New St",
  "city": "Makati",
  "postalCode": "9999",
  "phone": "+919876543212"
}
```

**Success Response (200):**
```json
{
  "message": "Address updated successfully",
  "address": {
    "_id": "507f1f77bcf86cd799439014",
    "label": "home",
    "street": "789 New St",
    "city": "Makati",
    "postalCode": "9999",
    "phone": "+919876543212",
    "isDefault": true
  }
}
```

---

#### Set Default Address

**Endpoint:** `PUT /api/customers/addresses/:addressId/default`

**Authentication:** Yes

**Success Response (200):**
```json
{
  "message": "Default address updated",
  "address": {
    "_id": "507f1f77bcf86cd799439014",
    "label": "home",
    "isDefault": true
  }
}
```

---

#### Delete Address

**Endpoint:** `DELETE /api/customers/addresses/:addressId`

**Authentication:** Yes

**Success Response (200):**
```json
{
  "message": "Address deleted successfully"
}
```

**Error Response (400):**
```json
{
  "error": "Cannot delete last address"
}
```

---

### Orders

#### Get Customer Orders

**Endpoint:** `GET /api/customers/orders`

**Authentication:** Yes

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 10, max 50
- `status` (optional): Filter by status (pending, confirmed, preparing, ready, completed, cancelled)
- `sortBy` (optional): Sort field (createdAt, total, status)
- `sortOrder` (optional): asc or desc

**Success Response (200):**
```json
{
  "orders": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "orderNumber": "ORD-2025-0001",
      "customerId": "507f1f77bcf86cd799439011",
      "items": [
        {
          "itemId": "507f1f77bcf86cd799439030",
          "name": "Burger",
          "quantity": 2,
          "price": 150,
          "total": 300
        }
      ],
      "subtotal": 300,
      "discountCode": "WELCOME11",
      "discountAmount": 11,
      "total": 289,
      "status": "completed",
      "addressId": "507f1f77bcf86cd799439012",
      "paymentMethod": "cash",
      "createdAt": "2025-12-05T10:30:00Z",
      "completedAt": "2025-12-05T10:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

#### Get Order Details

**Endpoint:** `GET /api/customers/orders/:orderId`

**Authentication:** Yes

**Success Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "orderNumber": "ORD-2025-0001",
  "customerId": "507f1f77bcf86cd799439011",
  "items": [
    {
      "itemId": "507f1f77bcf86cd799439030",
      "name": "Burger",
      "quantity": 2,
      "price": 150,
      "total": 300
    }
  ],
  "address": {
    "_id": "507f1f77bcf86cd799439012",
    "street": "123 Main St",
    "city": "Manila",
    "postalCode": "1234"
  },
  "subtotal": 300,
  "discountCode": "WELCOME11",
  "discountAmount": 11,
  "total": 289,
  "status": "completed",
  "paymentMethod": "cash",
  "estimatedDelivery": "2025-12-05T10:45:00Z",
  "actualDelivery": "2025-12-05T10:40:00Z",
  "timeline": [
    {
      "status": "pending",
      "timestamp": "2025-12-05T10:30:00Z"
    },
    {
      "status": "confirmed",
      "timestamp": "2025-12-05T10:32:00Z"
    },
    {
      "status": "preparing",
      "timestamp": "2025-12-05T10:33:00Z"
    },
    {
      "status": "ready",
      "timestamp": "2025-12-05T10:38:00Z"
    },
    {
      "status": "completed",
      "timestamp": "2025-12-05T10:40:00Z"
    }
  ]
}
```

---

#### Place Order

**Endpoint:** `POST /api/customers/orders`

**Authentication:** Yes

**Request Body:**
```json
{
  "items": [
    {
      "itemId": "507f1f77bcf86cd799439030",
      "quantity": 2
    },
    {
      "itemId": "507f1f77bcf86cd799439031",
      "quantity": 1
    }
  ],
  "addressId": "507f1f77bcf86cd799439012",
  "discountCode": "WELCOME11",
  "paymentMethod": "cash",
  "specialInstructions": "No onions please"
}
```

**Validation:**
- `items`: Required, minimum 1 item
- `addressId`: Required, must be valid address
- `discountCode`: Optional, must be valid if provided
- `paymentMethod`: Required (cash, card, upi, etc.)

**Success Response (201):**
```json
{
  "message": "Order placed successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439021",
    "orderNumber": "ORD-2025-0002",
    "items": [
      {
        "itemId": "507f1f77bcf86cd799439030",
        "name": "Burger",
        "quantity": 2,
        "price": 150,
        "total": 300
      }
    ],
    "subtotal": 300,
    "discountCode": "WELCOME11",
    "discountAmount": 11,
    "total": 289,
    "status": "pending",
    "createdAt": "2025-12-05T15:00:00Z",
    "estimatedDelivery": "2025-12-05T15:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Discount code invalid or expired"
}
```

---

#### Cancel Order

**Endpoint:** `PUT /api/customers/orders/:orderId/cancel`

**Authentication:** Yes

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Validation:**
- Order must be in 'pending' or 'confirmed' status
- Cannot cancel preparing, ready, or completed orders

**Success Response (200):**
```json
{
  "message": "Order cancelled successfully",
  "order": {
    "_id": "507f1f77bcf86cd799439021",
    "status": "cancelled",
    "refundAmount": 289,
    "refundStatus": "initiated"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Cannot cancel order in preparing status"
}
```

---

### Discounts

#### Validate Discount Code

**Endpoint:** `GET /api/discounts/validate?code=WELCOME11&amount=300`

**Authentication:** No

**Query Parameters:**
- `code`: Discount code to validate
- `amount` (optional): Order amount to check if applicable

**Success Response (200):**
```json
{
  "valid": true,
  "code": "WELCOME11",
  "discountType": "fixed", // "fixed" or "percentage"
  "discountValue": 11,
  "minOrderAmount": 0,
  "maxUses": 100,
  "usedCount": 45,
  "remainingUses": 55,
  "expiryDate": "2025-12-31T23:59:59Z",
  "applicableAmount": 11,
  "message": "Discount applied successfully"
}
```

**Error Response (400):**
```json
{
  "valid": false,
  "message": "Discount code invalid or expired",
  "code": "DISCOUNT_INVALID"
}
```

**Error Codes:**
- `DISCOUNT_INVALID` - Code doesn't exist
- `DISCOUNT_EXPIRED` - Code expired
- `DISCOUNT_LIMIT_REACHED` - Usage limit exceeded
- `MINIMUM_AMOUNT_NOT_MET` - Order below minimum

---

#### List Discounts (Admin)

**Endpoint:** `GET /api/discounts`

**Authentication:** Yes (Admin only)

**Query Parameters:**
- `active` (optional): true/false
- `page` (optional): Page number
- `limit` (optional): Items per page

**Success Response (200):**
```json
{
  "discounts": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "code": "WELCOME11",
      "description": "Welcome discount for new customers",
      "discountType": "fixed",
      "discountValue": 11,
      "minOrderAmount": 0,
      "maxUses": 100,
      "usedCount": 45,
      "isActive": true,
      "startDate": "2025-12-01T00:00:00Z",
      "expiryDate": "2025-12-31T23:59:59Z",
      "createdBy": "507f1f77bcf86cd799439001",
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

#### Create Discount (Admin)

**Endpoint:** `POST /api/discounts`

**Authentication:** Yes (Admin only)

**Request Body:**
```json
{
  "code": "NEWYEAR50",
  "description": "New Year Special - 50 rupees off",
  "discountType": "fixed",
  "discountValue": 50,
  "minOrderAmount": 200,
  "maxUses": 200,
  "isActive": true,
  "startDate": "2025-12-25T00:00:00Z",
  "expiryDate": "2026-01-01T23:59:59Z"
}
```

**Validation:**
- `code`: Required, unique, alphanumeric, 3-20 chars
- `discountType`: 'fixed' or 'percentage'
- `discountValue`: Required, positive number
- `minOrderAmount`: Optional, >= 0

**Success Response (201):**
```json
{
  "message": "Discount created successfully",
  "discount": {
    "_id": "507f1f77bcf86cd799439041",
    "code": "NEWYEAR50",
    "discountValue": 50,
    "discountType": "fixed",
    "maxUses": 200,
    "usedCount": 0,
    "isActive": true,
    "expiryDate": "2026-01-01T23:59:59Z"
  }
}
```

---

#### Update Discount (Admin)

**Endpoint:** `PUT /api/discounts/:discountId`

**Authentication:** Yes (Admin only)

**Request Body:**
```json
{
  "discountValue": 60,
  "maxUses": 300,
  "isActive": false
}
```

**Success Response (200):**
```json
{
  "message": "Discount updated successfully",
  "discount": {
    "_id": "507f1f77bcf86cd799439041",
    "code": "NEWYEAR50",
    "discountValue": 60,
    "maxUses": 300,
    "isActive": false
  }
}
```

---

#### Delete Discount (Admin)

**Endpoint:** `DELETE /api/discounts/:discountId`

**Authentication:** Yes (Admin only)

**Success Response (200):**
```json
{
  "message": "Discount deleted successfully"
}
```

---

### Admin Operations

#### Get Sales Report

**Endpoint:** `GET /api/admin/reports/sales`

**Authentication:** Yes (Admin only)

**Query Parameters:**
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)
- `groupBy` (optional): day, week, month

**Success Response (200):**
```json
{
  "report": {
    "period": "2025-12-01 to 2025-12-05",
    "totalOrders": 150,
    "totalRevenue": 45000,
    "averageOrderValue": 300,
    "totalDiscountGiven": 500,
    "netRevenue": 44500,
    "topItems": [
      {
        "itemId": "507f1f77bcf86cd799439030",
        "name": "Burger",
        "quantity": 300,
        "revenue": 45000
      }
    ],
    "trends": [
      {
        "date": "2025-12-01",
        "orders": 30,
        "revenue": 9000
      }
    ]
  }
}
```

---

#### Get Activity Logs

**Endpoint:** `GET /api/admin/logs/activity`

**Authentication:** Yes (Admin only)

**Query Parameters:**
- `userId` (optional): Filter by user
- `action` (optional): Filter by action type
- `page` (optional): Page number
- `limit` (optional): Items per page

**Success Response (200):**
```json
{
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439050",
      "userId": "507f1f77bcf86cd799439011",
      "action": "order_placed",
      "details": {
        "orderId": "507f1f77bcf86cd799439021",
        "amount": 289
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2025-12-05T15:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

---

## Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details if available"
}
```

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Internal Server Error | Server error |

### Error Response Examples

**400 - Bad Request**
```json
{
  "error": "Email is required",
  "code": "VALIDATION_ERROR"
}
```

**401 - Unauthorized**
```json
{
  "error": "Invalid or missing authentication token",
  "code": "UNAUTHORIZED"
}
```

**404 - Not Found**
```json
{
  "error": "Order not found",
  "code": "NOT_FOUND"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

### Limits by Endpoint Category

| Category | Limit | Window |
|----------|-------|--------|
| Authentication | 10 req | 15 min |
| Public API | 100 req | 15 min |
| User API | 50 req | 15 min |
| Admin API | 100 req | 15 min |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701882000
```

### Rate Limit Exceeded (429)
```json
{
  "error": "Too many requests, please try again after 5 minutes",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 300
}
```

---

## Code Examples

### JavaScript (Fetch API)

**Register**
```javascript
const registerUser = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/auth/customer/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'john@example.com',
        password: 'SecurePassword123',
        name: 'John Doe'
      })
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    console.log('User registered:', data.user);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Login**
```javascript
const loginUser = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/auth/customer/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'john@example.com',
        password: 'SecurePassword123'
      })
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.token);
      console.log('Logged in successfully');
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

**Get Profile (Authenticated)**
```javascript
const getProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5001/api/customers/profile', {
      method: 'GET',
      headers: {
        'x-auth-token': token
      }
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Profile:', data);
      return data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
};
```

**Place Order**
```javascript
const placeOrder = async (items, addressId, discountCode) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5001/api/customers/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        items: items,
        addressId: addressId,
        discountCode: discountCode,
        paymentMethod: 'cash'
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Order placed:', data.order);
      return data.order;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Order error:', error);
  }
};
```

### Python (Requests Library)

**Register**
```python
import requests
import json

def register_user(email, password, name):
    url = 'http://localhost:5001/api/auth/customer/register'
    payload = {
        'email': email,
        'password': password,
        'name': name
    }
    headers = {
        'Content-Type': 'application/json'
    }
    
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 201:
        print('User registered successfully')
        return response.json()
    else:
        print(f'Error: {response.json()["error"]}')
        return None

register_user('john@example.com', 'SecurePassword123', 'John Doe')
```

**Login**
```python
def login_user(email, password):
    url = 'http://localhost:5001/api/auth/customer/login'
    payload = {
        'email': email,
        'password': password
    }
    
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        token = response.json()['token']
        print('Login successful')
        return token
    else:
        print(f'Login failed: {response.json()["error"]}')
        return None

token = login_user('john@example.com', 'SecurePassword123')
```

**Validate Discount**
```python
def validate_discount(code, amount):
    url = 'http://localhost:5001/api/discounts/validate'
    params = {
        'code': code,
        'amount': amount
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if data['valid']:
        print(f"Discount valid: {data['applicableAmount']} rupees off")
        return data
    else:
        print(f"Discount invalid: {data['message']}")
        return None

validate_discount('WELCOME11', 300)
```

### cURL

**Register**
```bash
curl -X POST http://localhost:5001/api/auth/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123",
    "name": "John Doe"
  }'
```

**Login**
```bash
curl -X POST http://localhost:5001/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

**Get Profile**
```bash
curl -X GET http://localhost:5001/api/customers/profile \
  -H "x-auth-token: YOUR_JWT_TOKEN"
```

**Validate Discount**
```bash
curl -X GET 'http://localhost:5001/api/discounts/validate?code=WELCOME11&amount=300'
```

---

## Webhooks

Currently not implemented. Planned for future releases.

---

## Changelog

### v1.0.0 (December 5, 2025)
- Initial release
- Customer authentication
- Profile management
- Address management
- Order management
- Discount system
- Admin operations

---

## Support

**Documentation Issues:** File an issue on GitHub  
**API Bugs:** contact support@quickorder.com  
**Security Issues:** security@quickorder.com  

**Response Time:**
- Critical: 1 hour
- High: 4 hours
- Medium: 24 hours
- Low: 1 week

---

**Last Updated:** December 5, 2025  
**API Version:** 1.0.0  
**Document Version:** 1.0.0

