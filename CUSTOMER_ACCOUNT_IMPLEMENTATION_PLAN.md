# Customer Account, Email Verification & Discount Module Implementation Plan

**Date:** December 5, 2025  
**Status:** Planning Phase  
**Scope:** Customer authentication system, email verification, discount management

---

## EXECUTIVE SUMMARY

This document outlines the implementation strategy for adding customer accounts with email verification and a comprehensive discount module to the QuickOrder system. The project spans 6-7 weeks with 135+ hours of development effort.

### Key Decisions
-  **No pages removed** - All existing pages serve a purpose
-  **QuickOrder.html becomes customer landing page** with login/register options
-  **Discount module integrates into Admin/Owner panels** as new "Discounts" tab
-  **Email verification required** for account security
-  **7 new pages** for auth and customer dashboard
-  **3 modified pages** to support discount application

---

## CUSTOMER JOURNEY FLOW

Customer Flow:
1. Visit QuickOrder.html Landing Page
2. Click Register  register.html
3. Verify Email  Click link in email
4. Account activated  Redirect to menu
5. Browse Menu (menu.html)
6. Review Order with discount (orderedList.html)
7. Checkout
8. Receipt and Order History

---

## NEW PAGES TO CREATE (7 Pages)

### Authentication Pages
1. **register.html** - Customer registration form
2. **customerLogin.html** - Customer login form
3. **verifyEmail.html** - Email verification page
4. **resetPassword.html** - Password reset page

### Customer Dashboard Pages
5. **customerDashboard.html** - Welcome dashboard with quick stats
6. **customerProfile.html** - Edit profile and preferences
7. **orderHistory.html** - View all past orders

---

## PAGES TO MODIFY (3 Pages)

1. **QuickOrder.html** - Add login/register navigation
2. **orderedList.html** - Add discount code section
3. **checkout.html** - Display discount summary

---

## DATABASE MODELS

### Updated User Model
`
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: "customer" | "admin" | "owner",
  emailVerified: Boolean,
  emailVerificationToken: String,
  createdAt: Date,
  lastLogin: Date
}
`

### New Discount Model
`
{
  _id: ObjectId,
  code: String (unique, uppercase),
  discountType: "percentage" | "fixed",
  discountValue: Number,
  minOrderAmount: Number,
  maxUsagePerCustomer: Number,
  maxTotalUsage: Number,
  currentUsage: Number,
  isActive: Boolean,
  startDate: Date,
  endDate: Date,
  createdBy: ObjectId,
  createdAt: Date
}
`

---

## BACKEND API ENDPOINTS (14 Total)

### Authentication (8 endpoints)
- POST /api/auth/register - Register new customer
- POST /api/auth/login - Customer login
- POST /api/auth/verify-email - Verify email token
- POST /api/auth/resend-verification - Resend verification email
- POST /api/auth/forgot-password - Request password reset
- POST /api/auth/reset-password - Reset password
- GET /api/auth/me - Get current user
- POST /api/auth/logout - Customer logout

### Customers (3 endpoints)
- GET /api/customers/profile - Get profile
- PUT /api/customers/profile - Update profile
- GET /api/customers/orders - Get order history

### Discounts (3 endpoints)
- GET /api/discounts/validate/:code - Validate discount
- POST /api/discounts - Create (admin only)
- PUT /api/discounts/:id - Update (admin only)

---

## IMPLEMENTATION PHASES

**Phase 1: Backend Foundation (Weeks 1-2)** - 40 hours
- Update User model with email verification fields
- Create Discount model
- Implement authentication middleware
- Create all 14 API endpoints
- Set up email service

**Phase 2: Frontend Authentication (Weeks 2-3)** - 20 hours
- Create register.html & login.html
- Implement registration/login logic
- Create verifyEmail.html flow
- Add password reset page

**Phase 3: Customer Dashboard (Weeks 3-4)** - 20 hours
- Create customerDashboard.html
- Create customerProfile.html
- Create orderHistory.html

**Phase 4: Discount Module (Weeks 4-5)** - 20 hours
- Add discount admin panel
- Implement discount validation logic
- Add discount input to orderedList.html
- Update checkout with discount display

**Phase 5: Integration (Weeks 5-6)** - 20 hours
- Modify QuickOrder.html for login flow
- Update all navigation
- Add authentication guards
- Test complete flow

**Phase 6: Testing & Deployment (Week 6-7)** - 15 hours
- Full system testing
- Security testing
- Email delivery verification
- Production deployment

---

## DISCOUNT APPLICATION FLOW

In orderedList.html:
- Items subtotal: 2,000
- Discount Section: [NEW]
  - Input: "Enter discount code"
  - Button: "Apply"
- Display (if applied):
  - Code: WELCOME10
  - Discount: -200 (10%)
- Final Total: 1,800

---

## EMAIL VERIFICATION

### Verification Email Template
Subject: Verify Your QuickOrder Email Address

Hi [Name],
Please click below to verify your email:
[Verification Link - expires 24 hours]

### Password Reset Email Template
Subject: Reset Your QuickOrder Password

Hi [Name],
Click below to reset your password:
[Reset Link - expires 1 hour]

---

## TIMELINE & EFFORT

| Phase | Duration | Effort | Status |
|-------|----------|--------|--------|
| Phase 1: Backend | 2 weeks | 40 hrs | PLANNED |
| Phase 2: Auth UI | 1 week | 20 hrs | PLANNED |
| Phase 3: Dashboard | 1 week | 20 hrs | PLANNED |
| Phase 4: Discounts | 1 week | 20 hrs | PLANNED |
| Phase 5: Integration | 1 week | 20 hrs | PLANNED |
| Phase 6: Testing | 1 week | 15 hrs | PLANNED |
| TOTAL | 6-7 weeks | ~135 hrs | MVP |

---

## PAGES SUMMARY

### Existing Pages (KEEP)
- menu.html, checkout.html, receipt.html, orderedList.html
- Admin.html, Owner.html, AddItem.html
- Login.html (admin/owner login)

### Pages to MODIFY
- QuickOrder.html  Add login/register navigation
- orderedList.html  Add discount input section
- checkout.html  Show discount summary

### Pages to CREATE
- register.html, customerLogin.html, verifyEmail.html
- resetPassword.html, customerDashboard.html
- customerProfile.html, orderHistory.html

### Pages to REMOVE
- NONE - All existing pages serve a purpose

---

**Version:** 1.0  
**Status:** Ready for Phase 1 Backend Development  
**Last Updated:** December 5, 2025
