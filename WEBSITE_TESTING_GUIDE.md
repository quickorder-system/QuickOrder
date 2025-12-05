# QuickOrder - Website Testing Guide
**December 5, 2025 | Production Ready**

## 🌐 Access the Application

**Live URL:** https://quickorder-production.railway.app

Or **Local Development:**
```bash
npm start
# Server runs on http://localhost:5000
```

---

## 📋 Testing Scenarios

### 1️⃣ **NEW USER REGISTRATION** ✓
**Purpose:** Verify account creation and email verification

#### Steps:
1. Open: `/register.html` or click "Register" on Home
2. Enter Details:
   - **Name:** Test User
   - **Email:** testuser@example.com
   - **Password:** SecurePass@123
   - **Confirm Password:** SecurePass@123
3. Click "Register"
4. **Expected:** 
   - Account created
   - Verification email sent
   - Redirected to email verification page
5. Check Email:
   - Find verification link in inbox
   - Click link to verify account
   - **Expected:** "Email verified successfully"

---

### 2️⃣ **USER LOGIN** ✓
**Purpose:** Verify authentication system

#### Steps:
1. Open: `/customerLogin.html`
2. Enter Details:
   - **Email:** testuser@example.com (from registration)
   - **Password:** SecurePass@123
3. Click "Login"
4. **Expected:**
   - Login successful
   - Redirected to customer dashboard
   - JWT token stored in localStorage

#### Test Cases:
- ❌ **Invalid Password:** Should show "Invalid credentials"
- ❌ **Non-existent Email:** Should show "User not found"
- ❌ **Empty Fields:** Should show validation errors

---

### 3️⃣ **BROWSE MENU & ITEMS** ✓
**Purpose:** Verify product display and filtering

#### Steps:
1. Login or access `/menu.html`
2. **View All Items:**
   - Scroll through menu
   - See item names, descriptions, prices, images
   - Verify stock status
3. **Filter by Category:**
   - Click category buttons (if available)
   - Verify items update by category
4. **View Item Details:**
   - Click on item
   - See full description, price, availability
   - Check images load correctly

#### Test Cases:
- ✅ Verify all items display with correct prices
- ✅ Verify images load from `/uploads/` folder
- ✅ Verify out-of-stock items are marked
- ✅ Verify categories filter correctly

---

### 4️⃣ **ADD ITEMS TO CART** ✓
**Purpose:** Verify cart functionality and item variations

#### Steps:
1. From menu, click "Add to Cart" on an item
2. **If item has variations:**
   - Select size/flavor/type
   - Select quantity
   - Click "Add to Cart"
3. **Expected:**
   - Item added to cart
   - Cart count increases
   - Success notification shown
4. **Add Multiple Items:**
   - Add 3-5 different items
   - Verify cart displays all items
   - Verify subtotal updates

#### Test Cases:
- ✅ Verify item quantity increases if adding same item twice
- ✅ Verify price calculates correctly with variations
- ✅ Verify remove item from cart works
- ✅ Verify update quantity in cart works
- ✅ Verify cart persists on page refresh

---

### 5️⃣ **APPLY DISCOUNT CODES** ✓ **(NEW FEATURE)**
**Purpose:** Verify discount functionality

#### Pre-requisite:
Ask admin to create test discount code:
- **Code:** TESTDISCOUNT
- **Type:** Percentage (10%)
- **Status:** Active
- **Min Order:** PKR 500

#### Steps:
1. Add items totaling > PKR 500 to cart
2. Click "Apply Coupon" or "Apply Discount"
3. Enter code: `TESTDISCOUNT`
4. Click "Apply"
5. **Expected:**
   - Discount applied
   - Price reduced by 10%
   - Subtotal shows before/after discount
   - Total updates correctly

#### Test Cases:
- ✅ **Valid Code:** Discount applied correctly
- ✅ **Invalid Code:** Error message shown
- ✅ **Expired Code:** Error message shown
- ✅ **Min Order Not Met:** Cannot apply discount
- ✅ **Usage Limit Exceeded:** Cannot apply discount
- ✅ **Remove Discount:** Removes discount, updates total

---

### 6️⃣ **CHECKOUT & PAYMENT** ✓
**Purpose:** Verify order placement and payment methods

#### Steps:
1. Click "Proceed to Checkout"
2. **Review Order:**
   - Verify items, quantities, prices
   - Verify discount applied (if applicable)
   - Verify total correct
3. **Enter Delivery Address:**
   - Address (Street)
   - City
   - Phone Number
4. **Select Payment Method:**
   - Cash on Delivery (COD)
   - Credit/Debit Card (if integrated)
   - Mobile Wallet (if integrated)
5. **Review Summary:**
   - Verify all details
   - Click "Place Order"
6. **Expected:**
   - Order confirmation page
   - Order ID displayed
   - Receipt generated
   - Confirmation email sent

#### Test Cases:
- ✅ Verify validation on address fields
- ✅ Verify payment method selection works
- ✅ Verify order details email received
- ✅ Verify receipt downloads/displays

---

### 7️⃣ **ORDER HISTORY** ✓
**Purpose:** Verify order tracking

#### Steps:
1. Login to customer account
2. Navigate to "Order History" or `/orderHistory.html`
3. **View Orders:**
   - See all past orders
   - Click on order to view details
   - Verify order status, items, total
4. **Track Order:**
   - Check order status (Pending/Processing/Shipped/Delivered)
   - View delivery date/time estimate
   - View payment status

#### Test Cases:
- ✅ Verify all orders displayed
- ✅ Verify order details accurate
- ✅ Verify status updates in real-time
- ✅ Verify can reorder from history

---

### 8️⃣ **CUSTOMER PROFILE** ✓
**Purpose:** Verify account management

#### Steps:
1. Navigate to "Profile" or `/customerProfile.html`
2. **View Profile:**
   - Name, email, phone, address
   - Member since date
   - Total orders count
3. **Edit Profile:**
   - Click "Edit"
   - Update name or address
   - Click "Save"
   - **Expected:** Profile updated successfully
4. **Change Password:**
   - Click "Change Password"
   - Enter current password
   - Enter new password twice
   - Click "Update"
   - **Expected:** Password changed, logout and re-login required

#### Test Cases:
- ✅ Verify profile displays correct info
- ✅ Verify can edit name and address
- ✅ Verify password change works
- ✅ Verify can logout from profile

---

### 9️⃣ **ADMIN DASHBOARD** 👨‍💼
**Purpose:** Verify admin functionality

#### Access:
1. Login with admin credentials
2. Navigate to `/Admin.html` or click "Admin Panel"

#### Test Cases:

**A. Inventory Management:**
- ✅ View all items in inventory
- ✅ Add new item (name, description, price, category, image)
- ✅ Edit existing item
- ✅ Delete item (verify stock updates)
- ✅ View low stock items
- ✅ Update item quantity

**B. Discount Management:** (NEW)
- ✅ View all active discounts
- ✅ Create new discount:
  - Percentage discount (e.g., 10%)
  - Fixed amount discount (e.g., PKR 100)
  - Set expiration date
  - Set usage limit
- ✅ Edit discount details
- ✅ Activate/deactivate discount
- ✅ Delete discount
- ✅ View discount usage statistics

**C. Sales Reports:**
- ✅ View total revenue
- ✅ View orders by date range
- ✅ View top-selling items
- ✅ View discount usage report
- ✅ Export reports as PDF/CSV

**D. Activity Logs:** (NEW)
- ✅ View all admin activities
- ✅ Filter by action (create, update, delete)
- ✅ Filter by user
- ✅ View timestamp and details
- ✅ Search activity logs

**E. User Management:**
- ✅ View all registered customers
- ✅ View customer order count
- ✅ View customer details
- ✅ Verify/unverify customer email
- ✅ Disable/enable customer account

---

### 🔟 **PAYMENT METHODS** 💳 (NEW FEATURE)
**Purpose:** Verify payment method management

#### Steps:
1. Navigate to `/paymentMethods.html`
2. **View Payment Methods:**
   - See available payment options
   - See payment details (if saved)
3. **Add New Payment Method:**
   - Click "Add New"
   - Enter card/payment details
   - Click "Save"
   - **Expected:** Method saved securely
4. **Use in Checkout:**
   - Add items to cart
   - Proceed to checkout
   - Select saved payment method
   - Complete payment

#### Test Cases:
- ✅ Verify can add payment method
- ✅ Verify can delete payment method
- ✅ Verify can make purchase with saved method
- ✅ Verify payment details masked for security

---

## 🔐 **SECURITY TESTING** 🛡️

### Test Cases:
1. **SQL Injection Prevention:**
   - Try entering `'; DROP TABLE users; --` in form fields
   - **Expected:** No error, treated as normal text

2. **XSS Prevention:**
   - Try entering `<script>alert('XSS')</script>` in product name
   - **Expected:** No script execution

3. **CSRF Protection:**
   - All forms should have CSRF tokens
   - **Expected:** Token validated on submission

4. **Rate Limiting:**
   - Try login 10+ times with wrong password rapidly
   - **Expected:** Account temporarily locked after 5 attempts

5. **JWT Token Expiry:**
   - Login, wait 24+ hours (or simulate)
   - Try to perform action
   - **Expected:** Redirect to login

---

## 📊 **PERFORMANCE TESTING**

### Metrics to Check:
1. **Page Load Time:** < 3 seconds
2. **API Response Time:** < 500ms
3. **Image Load Time:** < 1 second
4. **Database Query Time:** < 100ms
5. **Memory Usage:** < 500MB
6. **CPU Usage:** < 50%

### Browser DevTools:
1. Open DevTools (F12)
2. Go to "Network" tab
3. Reload page
4. Check:
   - Total load time
   - Size of resources
   - Failed requests

---

## 🐛 **COMMON ISSUES & TROUBLESHOOTING**

| Issue | Solution |
|-------|----------|
| Emails not received | Check Spam folder, verify SendGrid API key |
| Images not loading | Check `/uploads/` folder exists and has images |
| Cart not persisting | Check localStorage enabled in browser |
| Payment fails | Verify payment gateway credentials |
| Discount not applying | Check discount code active and min order met |
| Login fails | Verify credentials, check database connection |
| Page blank | Check browser console for errors (F12) |

---

## ✅ **FINAL VERIFICATION CHECKLIST**

Before launching, verify:

- [ ] Registration works (email verification)
- [ ] Login works (JWT tokens)
- [ ] Menu displays all items
- [ ] Cart adds/removes items
- [ ] Discounts apply correctly
- [ ] Checkout completes order
- [ ] Order history shows orders
- [ ] Admin dashboard accessible
- [ ] Admin can create discounts
- [ ] Payment methods work
- [ ] No console errors (F12)
- [ ] All pages load < 3 seconds
- [ ] Emails send successfully
- [ ] Mobile responsive layout works
- [ ] Security tests pass

---

## 📞 **SUPPORT CONTACTS**

- **API Docs:** `/API_DOCUMENTATION.md`
- **Deployment:** Railway.app
- **Database:** MongoDB Atlas
- **Email:** SendGrid
- **Status:** https://quickorder-production.railway.app/health

---

**Status: ✅ READY FOR UAT & LAUNCH**
*December 5, 2025*
