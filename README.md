# QuickOrder - Restaurant Management System

QuickOrder is a full-stack web application designed to streamline restaurant operations. It provides a user-friendly interface for customers to browse the menu and place orders, and a comprehensive dashboard for administrators and owners to manage orders, inventory, and view sales reports.

## Features

*   **Customer Facing:**
    *   Modern and responsive landing page.
    *   Browse menu with search and filter functionality.
    *   Add items to a shopping cart.
    *   Place orders with customer details.
    *   Upload proof of payment.
    *   View order confirmation and status.
*   **Admin & Owner Dashboard:**
    *   Manage orders (view, update status, cancel).
    *   Manage inventory (add, edit, delete items).
    *   View sales reports and analytics (Owner only).
    *   User authentication for admin and owner roles.

## Technologies Used

*   **Backend:**
    *   Node.js
    *   Express.js
    *   MongoDB with Mongoose
    *   dotenv for environment variables
    *   CORS for cross-origin resource sharing
    *   Helmet for security headers
    *   express-rate-limit for rate limiting
    *   Multer for file uploads
*   **Frontend:**
    *   HTML5
    *   CSS3
    *   Vanilla JavaScript
    *   Font Awesome for icons
    *   Chart.js for charts

## Setup and Installation

### Prerequisites

*   Node.js (v14 or higher)
*   MongoDB (local or a cloud-based instance)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/QuickOrder.git
    cd QuickOrder
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add the following variables:
    ```
    MONGO_URI=your_mongodb_connection_string
    PORT=5501
    ```
    You can use the `.env.example` file as a template.

4.  **Run the application:**
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:5501`.

## API Documentation

The backend API provides the following endpoints:

*   `GET /api/orders`: Get all orders.
*   `GET /api/orders/:id`: Get a single order by ID.
*   `POST /api/orders`: Create a new order.
*   `PUT /api/orders/:id/status`: Update the status of an order.
*   `PUT /api/orders/:id/cancel`: Cancel an order.
*   `DELETE /api/orders/:id`: Delete an order.
*   `POST /api/upload`: Upload a payment screenshot.

## Folder Structure

```
/
├── public/             # Frontend assets (CSS, JS, images)
├── src/                # Backend source code
│   ├── models/         # Mongoose models
│   ├── routes/         # Express routes
│   └── utils/          # Utility functions
├── tests/              # Test files
├── uploads/            # Uploaded files
├── .env                # Environment variables
├── .eslintrc.json      # ESLint configuration
├── package.json        # Project dependencies and scripts
└── server.js           # Main server file
```
