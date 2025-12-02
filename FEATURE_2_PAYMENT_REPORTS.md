# Feature 2: Sales Reports with Payment Method Breakdown & PDF Export

## Overview
Successfully implemented comprehensive sales reporting with payment method filtering and PDF export functionality. Owners can now view sales data broken down by payment method (GCash, Maya, Cash) and export reports in both Excel and PDF formats.

---

## Changes Made

### 1. Backend - New API Endpoints (`src/routes/reports.js`)

#### Added pdfkit Library
```javascript
const PDFDocument = require('pdfkit');
```
- Installed `pdfkit` npm package for PDF generation

#### New Endpoint: `/api/reports/payment-breakdown`
**Purpose**: Get sales breakdown by payment method within a date range

**Query Parameters**:
- `startDate` (required): ISO format YYYY-MM-DD
- `endDate` (required): ISO format YYYY-MM-DD

**Response Format**:
```json
{
  "paymentMethods": {
    "GCash": {
      "sales": 5000.00,
      "orders": 25,
      "percentage": 50.00,
      "averageOrderValue": 200.00
    },
    "Maya": {
      "sales": 3000.00,
      "orders": 15,
      "percentage": 30.00,
      "averageOrderValue": 200.00
    },
    "Cash": {
      "sales": 2000.00,
      "orders": 10,
      "percentage": 20.00,
      "averageOrderValue": 200.00
    }
  },
  "summary": {
    "totalRevenue": 10000.00,
    "totalOrders": 50,
    "dateRange": {
      "startDate": "2025-12-01",
      "endDate": "2025-12-02"
    }
  }
}
```

**Features**:
- Aggregates sales data by payment method
- Calculates percentages automatically
- Shows order count and average order value per method
- Initializes all payment methods with zero if no data

#### New Endpoint: `/api/reports/export-pdf`
**Purpose**: Export sales report as PDF file

**Query Parameters**:
- `startDate` (required): ISO format YYYY-MM-DD
- `endDate` (required): ISO format YYYY-MM-DD
- `paymentMethod` (optional): GCash, Maya, or Cash for filtered reports

**Returns**: PDF file attachment

**PDF Contents**:
- Company header (Quick Order)
- Report period (date range and payment filter if applied)
- Summary metrics:
  - Total Revenue
  - Total Orders
  - Average Order Value
- Payment Method Breakdown (if not filtered)
  - Each method with percentage
- Daily Sales Breakdown table:
  - Date, Daily Sales, Order Count
- Footer with generation timestamp

**Implementation**:
```javascript
router.get('/export-pdf', async (req, res) => {
    // PDF generation logic using pdfkit
    // - Parse and validate dates
    // - Query database for sales data
    // - Query payment breakdown data
    // - Create PDF document
    // - Add header, metrics, breakdown, daily data
    // - Stream PDF to client
});
```

---

### 2. Frontend - Owner Panel Updates (`public/Owner.html`)

#### Updated Report Controls Section
Added new elements:

1. **Payment Method Filter Dropdown**
   ```html
   <select class="filter-select" id="paymentMethodFilter">
     <option value="">All Payment Methods</option>
     <option value="GCash">GCash</option>
     <option value="Maya">Maya</option>
     <option value="Cash">Cash</option>
   </select>
   ```
   - Allows filtering reports by payment method
   - Affects both chart and PDF export

2. **PDF Export Button**
   ```html
   <button class="btn-primary" onclick="exportReportToPDF()">
     <i class="fas fa-file-pdf"></i>
     Export to PDF
   </button>
   ```
   - New button to export reports in PDF format
   - Shows loading state and confirmation

#### New Payment Method Breakdown Section
Added after the sales chart:

```html
<div class="chart-container">
  <div class="chart-header">
    <h3 class="chart-title">Payment Method Breakdown</h3>
  </div>
  
  <div class="payment-breakdown-grid">
    <!-- GCash Card -->
    <div class="payment-method-card">
      <div class="payment-method-icon gcash">
        <i class="fas fa-mobile-alt"></i>
      </div>
      <div class="payment-method-info">
        <h4>GCash</h4>
        <p class="amount">₱0.00</p>
        <p class="percentage">0%</p>
        <p class="order-count">0 orders</p>
      </div>
    </div>

    <!-- Maya Card -->
    <div class="payment-method-card">
      <div class="payment-method-icon maya">
        <i class="fas fa-credit-card"></i>
      </div>
      <div class="payment-method-info">
        <h4>Maya</h4>
        <p class="amount">₱0.00</p>
        <p class="percentage">0%</p>
        <p class="order-count">0 orders</p>
      </div>
    </div>

    <!-- Cash Card -->
    <div class="payment-method-card">
      <div class="payment-method-icon cash">
        <i class="fas fa-money-bill-wave"></i>
      </div>
      <div class="payment-method-info">
        <h4>Cash</h4>
        <p class="amount">₱0.00</p>
        <p class="percentage">0%</p>
        <p class="order-count">0 orders</p>
      </div>
    </div>
  </div>

  <!-- Payment Method Pie Chart -->
  <canvas id="paymentChart"></canvas>
</div>
```

---

### 3. Frontend - Styling (`public/css/pages/owner.css`)

#### Payment Breakdown Grid
```css
.payment-breakdown-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}
```
- Responsive 3-column layout
- Adapts to smaller screens

#### Payment Method Cards
```css
.payment-method-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    gap: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border-left: 4px solid #667eea;
}

.payment-method-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
}
```
- Hover effects for interactivity
- Left border indicates payment method
- Smooth transitions

#### Payment Method Icons
```css
.payment-method-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.payment-method-icon.gcash {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.payment-method-icon.maya {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.payment-method-icon.cash {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
```
- Distinct colors for each method
- Gradient backgrounds for visual appeal

#### Dark Mode Support
```css
body.dark-mode .payment-method-card {
    background: #1e293b;
    border-left-color: #4299e1;
}

body.dark-mode .payment-method-info h4 {
    color: #e2e8f0;
}

body.dark-mode .payment-method-info .amount {
    color: #63b3ed;
}
```

---

### 4. Frontend - JavaScript Logic (`public/js/owner.js`)

#### New Function: `exportReportToPDF()`
```javascript
function exportReportToPDF() {
    // Validates date range and report data
    // Gets selected payment method filter
    // Shows loading state
    // Fetches PDF from /api/reports/export-pdf
    // Triggers download with proper filename
    // Shows success confirmation
}
```

**Workflow**:
1. Validates start/end dates
2. Gets selected payment method filter (optional)
3. Shows loading spinner with "Generating PDF..." text
4. Calls `/api/reports/export-pdf` endpoint with parameters
5. Converts blob response to downloadable file
6. Auto-downloads PDF with filename: `Sales_Report_YYYY-MM-DD_to_YYYY-MM-DD.pdf`
7. Shows "Downloaded!" confirmation for 2 seconds

#### New Function: `fetchAndRenderPaymentBreakdown()`
```javascript
async function fetchAndRenderPaymentBreakdown() {
    // Fetches payment breakdown data from API
    // Calls renderPaymentBreakdown()
    // Calls renderPaymentChart()
}
```

**Called When**:
- User generates a report (automatically)
- Date range or filters change

#### New Function: `renderPaymentBreakdown(data)`
```javascript
function renderPaymentBreakdown(data) {
    // Updates payment method cards with real data
    // Sets: sales amount, percentage, order count
    // For each: GCash, Maya, Cash
}
```

**Updates**:
- Sales amount (formatted as currency)
- Percentage of total revenue
- Number of orders

#### New Function: `renderPaymentChart(data)`
```javascript
function renderPaymentChart(data) {
    // Creates doughnut chart showing payment method distribution
    // Colors: #667eea (GCash), #f5576c (Maya), #00f2fe (Cash)
    // Includes legend at bottom
}
```

**Chart Features**:
- Type: Doughnut chart
- Responsive design
- Bottom legend with method names
- Auto-destroys previous chart instance

#### Updated Function: `fetchAndRenderSalesReport()`
Added at end of function:
```javascript
// Fetch and render payment breakdown
fetchAndRenderPaymentBreakdown();
```

Now automatically fetches and displays payment breakdown after generating sales report.

---

## User Workflow

### Viewing Payment Method Breakdown

1. **Generate Report**
   - Select start date and end date
   - Optionally select a payment method filter
   - Click "Generate Report"

2. **View Results**
   - Sales chart displays (existing functionality)
   - Payment Method Breakdown cards appear with:
     - GCash: sales, %, orders (purple gradient)
     - Maya: sales, %, orders (pink/red gradient)
     - Cash: sales, %, orders (cyan gradient)
   - Doughnut chart shows visual distribution

3. **Export Options**
   - **Excel**: Existing CSV export
   - **PDF**: New PDF export with full report
   - Payment method filter applies to PDF export

### Example Report Output

**Payment Breakdown (12/01/2025 - 12/02/2025)**:
- GCash: ₱5,000.00 (50%) - 25 orders
- Maya: ₱3,000.00 (30%) - 15 orders
- Cash: ₱2,000.00 (20%) - 10 orders
- **Total**: ₱10,000.00 - 50 orders

---

## Files Modified

1. `src/routes/reports.js` - Added payment-breakdown and export-pdf endpoints
2. `public/Owner.html` - Added payment filter and PDF button, added breakdown section
3. `public/css/pages/owner.css` - Added payment breakdown card styles
4. `public/js/owner.js` - Added PDF export and payment breakdown rendering functions
5. `package.json` - Added pdfkit dependency (auto-updated)

---

## API Endpoints Summary

| Endpoint | Method | Query Params | Purpose |
|----------|--------|--------------|---------|
| `/api/reports/sales` | GET | startDate, endDate | Sales data by date |
| `/api/reports/payment-breakdown` | GET | startDate, endDate | Sales breakdown by payment method |
| `/api/reports/export-pdf` | GET | startDate, endDate, paymentMethod (opt) | Generate and download PDF report |
| `/api/reports/daily` | GET | none | Today's sales |
| `/api/reports/weekly` | GET | none | This week's sales |
| `/api/reports/monthly` | GET | none | This month's sales |
| `/api/reports/yearly` | GET | none | This year's sales |

---

## Features

✅ **Payment Method Filtering**
- Filter reports by GCash, Maya, or Cash
- Affects both chart display and PDF export
- Optional filter (defaults to all methods)

✅ **Payment Breakdown Visualization**
- Three cards showing each payment method
- Displays sales, percentage, order count
- Distinct icons and colors for each method
- Responsive grid layout

✅ **Payment Distribution Chart**
- Doughnut chart showing sales distribution
- Color-coded by payment method
- Legend at bottom for clarity

✅ **PDF Export**
- Professional PDF format
- Includes header, summary, breakdown
- Daily sales table
- Company branding
- Respects payment method filter

✅ **Excel Export** (Existing)
- Still available and working
- CSV format

✅ **Dark Mode Support**
- All new elements support dark mode
- Payment cards styled appropriately

---

## Testing Checklist

- [x] Payment breakdown endpoint returns correct data
- [x] PDF export generates valid PDF file
- [x] PDF contains all required sections
- [x] Payment filter dropdown works
- [x] Payment cards update with correct data
- [x] Payment chart renders correctly
- [x] PDF respects payment method filter
- [x] Excel export still works
- [x] Dark mode styling applied correctly
- [x] Responsive design on mobile/tablet

---

## Git Commit

**Commit Hash**: `01ab160`
**Message**: "Add sales reports with payment method breakdown and PDF export - Feature #2"

---

## Next Steps

Ready for Feature 3: Menu customization with variations (small, medium, large, etc.)
