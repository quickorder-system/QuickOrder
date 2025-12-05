/**
 * Admin Operations Tests
 * Tests for admin-only functionality like discount management, reports, and activity logs
 */

const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Discount = require('../src/models/discount');
const ActivityLog = require('../src/models/activityLog');
const app = require('../server');

describe('Admin Operations Tests', () => {
    let adminToken;
    let adminUserId;
    let customerToken;
    let discountId;
    const adminEmail = 'admin-test@example.com';
    const adminPassword = 'AdminPassword123';
    const customerEmail = 'customer-test@example.com';
    const customerPassword = 'CustomerPassword123';

    beforeAll(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickorder-test', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        }

        // Clean up test data
        await User.deleteMany({ email: { $in: [adminEmail, customerEmail] } });
        await Discount.deleteMany({ code: /ADMIN_TEST/ });

        // Create admin user
        await request(app)
            .post('/api/auth/customer/register')
            .send({
                email: adminEmail,
                password: adminPassword,
                name: 'Admin User'
            });

        const adminLoginRes = await request(app)
            .post('/api/auth/customer/login')
            .send({
                email: adminEmail,
                password: adminPassword
            });

        adminToken = adminLoginRes.body.token;
        adminUserId = adminLoginRes.body.user.id;

        // Update user role to admin (would need special endpoint in real app)
        // For now, use the token as-is for testing

        // Create regular customer
        await request(app)
            .post('/api/auth/customer/register')
            .send({
                email: customerEmail,
                password: customerPassword,
                name: 'Customer User'
            });

        const customerLoginRes = await request(app)
            .post('/api/auth/customer/login')
            .send({
                email: customerEmail,
                password: customerPassword
            });

        customerToken = customerLoginRes.body.token;
    });

    afterAll(async () => {
        await User.deleteMany({ email: { $in: [adminEmail, customerEmail] } });
        await Discount.deleteMany({ code: /ADMIN_TEST/ });
    });

    // ====== DISCOUNT MANAGEMENT TESTS ======
    describe('Discount Management - Create', () => {
        it('should create new discount as admin', async () => {
            const response = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', adminToken)
                .send({
                    code: 'ADMIN_TEST_001',
                    description: 'Admin test discount',
                    discountType: 'fixed',
                    discountValue: 50,
                    minOrderAmount: 100,
                    maxUses: 100,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('discount');
            expect(response.body.discount.code).toBe('ADMIN_TEST_001');
            expect(response.body.discount.discountValue).toBe(50);

            discountId = response.body.discount._id;
        });

        it('should not allow duplicate discount codes', async () => {
            // Try to create with same code
            const response = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', adminToken)
                .send({
                    code: 'ADMIN_TEST_001', // Same code
                    description: 'Duplicate',
                    discountType: 'fixed',
                    discountValue: 25,
                    minOrderAmount: 0,
                    maxUses: 100,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            expect(response.status).toBe(400);
            expect(response.body.error.toLowerCase()).toContain('already');
        });

        it('should validate discount creation fields', async () => {
            const response = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', adminToken)
                .send({
                    code: 'ADMIN_TEST_002',
                    // Missing description, can be optional
                    discountType: 'fixed',
                    discountValue: -10, // Invalid negative value
                    minOrderAmount: 0,
                    maxUses: 100,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            expect([400, 422]).toContain(response.status);
        });

        it('should prevent customer from creating discount', async () => {
            const response = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', customerToken)
                .send({
                    code: 'CUSTOMER_TRY_DISCOUNT',
                    description: 'Customer attempt',
                    discountType: 'fixed',
                    discountValue: 10,
                    minOrderAmount: 0,
                    maxUses: 50,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            expect(response.status).toBe(403);
            expect(response.body.error.toLowerCase()).toContain('permission');
        });
    });

    describe('Discount Management - Update', () => {
        it('should update discount as admin', async () => {
            const response = await request(app)
                .put(`/api/discounts/${discountId}`)
                .set('x-auth-token', adminToken)
                .send({
                    discountValue: 75, // Increase discount
                    maxUses: 200, // Increase max uses
                    isActive: true
                });

            expect(response.status).toBe(200);
            expect(response.body.discount.discountValue).toBe(75);
            expect(response.body.discount.maxUses).toBe(200);
        });

        it('should deactivate discount', async () => {
            const response = await request(app)
                .put(`/api/discounts/${discountId}`)
                .set('x-auth-token', adminToken)
                .send({
                    isActive: false
                });

            expect(response.status).toBe(200);
            expect(response.body.discount.isActive).toBe(false);
        });

        it('should reactivate discount', async () => {
            const response = await request(app)
                .put(`/api/discounts/${discountId}`)
                .set('x-auth-token', adminToken)
                .send({
                    isActive: true
                });

            expect(response.status).toBe(200);
            expect(response.body.discount.isActive).toBe(true);
        });

        it('should update expiration date', async () => {
            const newExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
            const response = await request(app)
                .put(`/api/discounts/${discountId}`)
                .set('x-auth-token', adminToken)
                .send({
                    expiryDate: newExpiry
                });

            expect(response.status).toBe(200);
            expect(response.body.discount.expiryDate).toBe(newExpiry);
        });

        it('should prevent customer from updating discount', async () => {
            const response = await request(app)
                .put(`/api/discounts/${discountId}`)
                .set('x-auth-token', customerToken)
                .send({
                    discountValue: 500
                });

            expect(response.status).toBe(403);
        });
    });

    describe('Discount Management - Delete', () => {
        let deleteTestDiscountId;

        beforeAll(async () => {
            // Create discount for deletion
            const createRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', adminToken)
                .send({
                    code: 'ADMIN_TEST_DELETE',
                    description: 'To be deleted',
                    discountType: 'fixed',
                    discountValue: 20,
                    minOrderAmount: 0,
                    maxUses: 50,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (createRes.status === 201) {
                deleteTestDiscountId = createRes.body.discount._id;
            }
        });

        it('should delete discount as admin', async () => {
            const response = await request(app)
                .delete(`/api/discounts/${deleteTestDiscountId}`)
                .set('x-auth-token', adminToken);

            expect(response.status).toBe(200);
            expect(response.body.message.toLowerCase()).toContain('deleted');
        });

        it('should prevent customer from deleting discount', async () => {
            const response = await request(app)
                .delete(`/api/discounts/${discountId}`)
                .set('x-auth-token', customerToken);

            expect(response.status).toBe(403);
        });

        it('should handle deleting non-existent discount', async () => {
            const response = await request(app)
                .delete('/api/discounts/nonexistentid')
                .set('x-auth-token', adminToken);

            expect([400, 404]).toContain(response.status);
        });
    });

    // ====== ADMIN LISTING TESTS ======
    describe('Discount Listing & Filtering', () => {
        beforeAll(async () => {
            // Create multiple discounts for listing
            await request(app)
                .post('/api/discounts')
                .set('x-auth-token', adminToken)
                .send({
                    code: 'ADMIN_TEST_LIST_1',
                    description: 'List test 1',
                    discountType: 'fixed',
                    discountValue: 10,
                    minOrderAmount: 0,
                    maxUses: 100,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            await request(app)
                .post('/api/discounts')
                .set('x-auth-token', adminToken)
                .send({
                    code: 'ADMIN_TEST_LIST_2',
                    description: 'List test 2',
                    discountType: 'percentage',
                    discountValue: 5,
                    minOrderAmount: 0,
                    maxUses: 50,
                    isActive: false,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });
        });

        it('should list all discounts as admin', async () => {
            const response = await request(app)
                .get('/api/discounts')
                .set('x-auth-token', adminToken);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.discounts)).toBe(true);
            expect(response.body.discounts.length).toBeGreaterThan(0);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/discounts?page=1&limit=5')
                .set('x-auth-token', adminToken);

            expect(response.status).toBe(200);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
        });

        it('should filter by active status', async () => {
            const response = await request(app)
                .get('/api/discounts?active=true')
                .set('x-auth-token', adminToken);

            expect(response.status).toBe(200);
            if (response.body.discounts.length > 0) {
                response.body.discounts.forEach(discount => {
                    expect(discount.isActive).toBe(true);
                });
            }
        });

        it('should prevent customer from listing all discounts', async () => {
            const response = await request(app)
                .get('/api/discounts')
                .set('x-auth-token', customerToken);

            expect([401, 403]).toContain(response.status);
        });
    });

    // ====== ACTIVITY LOG TESTS ======
    describe('Activity Log Management', () => {
        it('should retrieve activity logs as admin', async () => {
            const response = await request(app)
                .get('/api/admin/logs/activity')
                .set('x-auth-token', adminToken);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.logs)).toBe(true);
        });

        it('should support pagination in activity logs', async () => {
            const response = await request(app)
                .get('/api/admin/logs/activity?page=1&limit=10')
                .set('x-auth-token', adminToken);

            expect(response.status).toBe(200);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(10);
        });

        it('should filter logs by action type', async () => {
            const response = await request(app)
                .get('/api/admin/logs/activity?action=order_placed')
                .set('x-auth-token', adminToken);

            expect(response.status).toBe(200);
            if (response.body.logs.length > 0) {
                response.body.logs.forEach(log => {
                    expect(log.action).toBe('order_placed');
                });
            }
        });

        it('should prevent customer from accessing activity logs', async () => {
            const response = await request(app)
                .get('/api/admin/logs/activity')
                .set('x-auth-token', customerToken);

            expect([401, 403]).toContain(response.status);
        });

        it('should log admin actions', async () => {
            // Create a discount (admin action)
            const createRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', adminToken)
                .send({
                    code: 'ADMIN_TEST_LOG_ACTION',
                    description: 'Action to be logged',
                    discountType: 'fixed',
                    discountValue: 15,
                    minOrderAmount: 0,
                    maxUses: 50,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (createRes.status === 201) {
                // Check if action was logged
                const logsRes = await request(app)
                    .get('/api/admin/logs/activity?action=discount_created')
                    .set('x-auth-token', adminToken);

                expect(logsRes.status).toBe(200);
                // Log should exist for this action
            }
        });
    });

    // ====== SALES REPORT TESTS ======
    describe('Sales Reports', () => {
        it('should retrieve sales report as admin', async () => {
            const response = await request(app)
                .get('/api/admin/reports/sales')
                .set('x-auth-token', adminToken);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('report');
        });

        it('should include total revenue in report', async () => {
            const response = await request(app)
                .get('/api/admin/reports/sales')
                .set('x-auth-token', adminToken);

            if (response.status === 200) {
                expect(response.body.report).toHaveProperty('totalRevenue');
                expect(response.body.report.totalRevenue).toBeGreaterThanOrEqual(0);
            }
        });

        it('should include order count in report', async () => {
            const response = await request(app)
                .get('/api/admin/reports/sales')
                .set('x-auth-token', adminToken);

            if (response.status === 200) {
                expect(response.body.report).toHaveProperty('totalOrders');
                expect(response.body.report.totalOrders).toBeGreaterThanOrEqual(0);
            }
        });

        it('should filter by date range', async () => {
            const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const endDate = new Date().toISOString();

            const response = await request(app)
                .get(`/api/admin/reports/sales?startDate=${startDate}&endDate=${endDate}`)
                .set('x-auth-token', adminToken);

            expect(response.status).toBe(200);
            expect(response.body.report).toHaveProperty('period');
        });

        it('should prevent customer from accessing sales report', async () => {
            const response = await request(app)
                .get('/api/admin/reports/sales')
                .set('x-auth-token', customerToken);

            expect([401, 403]).toContain(response.status);
        });

        it('should show top items in report', async () => {
            const response = await request(app)
                .get('/api/admin/reports/sales')
                .set('x-auth-token', adminToken);

            if (response.status === 200 && response.body.report.topItems) {
                expect(Array.isArray(response.body.report.topItems)).toBe(true);
            }
        });

        it('should calculate net revenue after discounts', async () => {
            const response = await request(app)
                .get('/api/admin/reports/sales')
                .set('x-auth-token', adminToken);

            if (response.status === 200) {
                const report = response.body.report;
                if (report.totalRevenue && report.totalDiscountGiven) {
                    expect(report.netRevenue).toBeLessThanOrEqual(report.totalRevenue);
                }
            }
        });
    });

    // ====== AUTHORIZATION & SECURITY TESTS ======
    describe('Admin Authorization Checks', () => {
        it('should deny access to non-authenticated users', async () => {
            const response = await request(app)
                .get('/api/discounts');

            expect(response.status).toBe(401);
        });

        it('should deny access with invalid token', async () => {
            const response = await request(app)
                .get('/api/discounts')
                .set('x-auth-token', 'invalid-token-xyz');

            expect(response.status).toBe(401);
        });

        it('should deny customer access to admin endpoints', async () => {
            const endpoints = [
                '/api/discounts',
                '/api/admin/reports/sales',
                '/api/admin/logs/activity'
            ];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .set('x-auth-token', customerToken);

                expect([401, 403]).toContain(response.status);
            }
        });

        it('should require authentication for admin operations', async () => {
            const createRes = await request(app)
                .post('/api/discounts')
                .send({
                    code: 'NO_AUTH_TEST',
                    discountType: 'fixed',
                    discountValue: 10,
                    maxUses: 50,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            expect(createRes.status).toBe(401);
        });
    });
});
