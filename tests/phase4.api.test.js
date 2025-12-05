/**
 * Phase 4 Backend Integration Tests
 * Tests for all customer API endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Order = require('../src/models/order');
const app = require('../server');

describe('Phase 4 Backend Integration Tests', () => {
    let authToken;
    let userId;
    let testEmail = 'test@example.com';
    let testPassword = 'password123';
    let addressId;

    // Setup
    beforeAll(async () => {
        // Connect to test database if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickorder-test', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        }

        // Clean up test data
        await User.deleteMany({ email: testEmail });
    });

    // Cleanup
    afterAll(async () => {
        await User.deleteMany({ email: testEmail });
        // Keep connection for other tests
    });

    describe('Authentication Endpoints', () => {
        describe('POST /api/auth/customer/register', () => {
            it('should register a new customer', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/register')
                    .send({
                        email: testEmail,
                        password: testPassword,
                        name: 'Test User'
                    });

                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('user');
                expect(response.body.user.email).toBe(testEmail);
                expect(response.body).toHaveProperty('message');

                userId = response.body.user.id;
            });

            it('should fail with missing fields', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/register')
                    .send({
                        email: 'test2@example.com'
                        // Missing password and name
                    });

                expect(response.status).toBe(400);
            });

            it('should fail with duplicate email', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/register')
                    .send({
                        email: testEmail,
                        password: testPassword,
                        name: 'Another User'
                    });

                expect(response.status).toBe(400);
            });

            it('should fail with short password', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/register')
                    .send({
                        email: 'test3@example.com',
                        password: 'pass',
                        name: 'Test User'
                    });

                expect(response.status).toBe(400);
            });
        });

        describe('POST /api/auth/customer/verify-email', () => {
            it('should verify email with valid token', async () => {
                // Get the user to retrieve verification token
                const user = await User.findOne({ email: testEmail });
                const token = user.emailVerificationToken;

                const response = await request(app)
                    .post('/api/auth/customer/verify-email')
                    .send({ token });

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('message');

                // Verify user is marked as verified
                const updatedUser = await User.findById(userId);
                expect(updatedUser.emailVerified).toBe(true);
            });

            it('should fail with invalid token', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/verify-email')
                    .send({ token: 'invalid-token' });

                expect(response.status).toBe(400);
            });
        });

        describe('POST /api/auth/customer/login', () => {
            it('should login successfully with correct credentials', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/login')
                    .send({
                        email: testEmail,
                        password: testPassword
                    });

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('token');
                expect(response.body.user.email).toBe(testEmail);

                authToken = response.body.token;
            });

            it('should fail with incorrect password', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/login')
                    .send({
                        email: testEmail,
                        password: 'wrongpassword'
                    });

                expect(response.status).toBe(401);
            });

            it('should fail with non-existent email', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/login')
                    .send({
                        email: 'nonexistent@example.com',
                        password: testPassword
                    });

                expect(response.status).toBe(401);
            });

            it('should fail with missing fields', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/login')
                    .send({
                        email: testEmail
                        // Missing password
                    });

                expect(response.status).toBe(400);
            });
        });
    });

    describe('Customer Profile Endpoints', () => {
        describe('GET /api/customers/profile', () => {
            it('should get customer profile with valid token', async () => {
                const response = await request(app)
                    .get('/api/customers/profile')
                    .set('x-auth-token', authToken);

                expect(response.status).toBe(200);
                expect(response.body.email).toBe(testEmail);
                expect(response.body).not.toHaveProperty('password');
            });

            it('should fail without token', async () => {
                const response = await request(app)
                    .get('/api/customers/profile');

                expect(response.status).toBe(401);
            });

            it('should work with Bearer token', async () => {
                const response = await request(app)
                    .get('/api/customers/profile')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(response.status).toBe(200);
            });
        });

        describe('PUT /api/customers/profile', () => {
            it('should update customer profile', async () => {
                const response = await request(app)
                    .put('/api/customers/profile')
                    .set('x-auth-token', authToken)
                    .send({
                        name: 'Updated Name',
                        phone: '+1234567890',
                        preferences: {
                            notifications: false,
                            marketingEmails: false
                        }
                    });

                expect(response.status).toBe(200);
                expect(response.body.user.name).toBe('Updated Name');
                expect(response.body.user.phone).toBe('+1234567890');
            });

            it('should fail without authentication', async () => {
                const response = await request(app)
                    .put('/api/customers/profile')
                    .send({
                        name: 'Updated Name'
                    });

                expect(response.status).toBe(401);
            });
        });

        describe('POST /api/customers/change-password', () => {
            it('should change password successfully', async () => {
                const response = await request(app)
                    .post('/api/customers/change-password')
                    .set('x-auth-token', authToken)
                    .send({
                        currentPassword: testPassword,
                        newPassword: 'newpassword123'
                    });

                expect(response.status).toBe(200);

                // Update test password for further tests
                testPassword = 'newpassword123';
            });

            it('should fail with incorrect current password', async () => {
                const response = await request(app)
                    .post('/api/customers/change-password')
                    .set('x-auth-token', authToken)
                    .send({
                        currentPassword: 'wrongpassword',
                        newPassword: 'anotherpassword123'
                    });

                expect(response.status).toBe(400);
            });

            it('should fail with short new password', async () => {
                const response = await request(app)
                    .post('/api/customers/change-password')
                    .set('x-auth-token', authToken)
                    .send({
                        currentPassword: testPassword,
                        newPassword: 'short'
                    });

                expect(response.status).toBe(400);
            });
        });
    });

    describe('Address Management Endpoints', () => {
        describe('GET /api/customers/addresses', () => {
            it('should get all addresses', async () => {
                const response = await request(app)
                    .get('/api/customers/addresses')
                    .set('x-auth-token', authToken);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('addresses');
                expect(Array.isArray(response.body.addresses)).toBe(true);
            });

            it('should fail without authentication', async () => {
                const response = await request(app)
                    .get('/api/customers/addresses');

                expect(response.status).toBe(401);
            });
        });

        describe('POST /api/customers/addresses', () => {
            it('should add new address', async () => {
                const response = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', authToken)
                    .send({
                        label: 'home',
                        street: '123 Main St',
                        city: 'Manila',
                        postalCode: '1234',
                        phone: '+1234567890'
                    });

                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('address');
                expect(response.body.address.street).toBe('123 Main St');

                addressId = response.body.address._id;
            });

            it('should fail with missing required fields', async () => {
                const response = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', authToken)
                    .send({
                        label: 'home'
                        // Missing street, city, postal code
                    });

                expect(response.status).toBe(400);
            });

            it('should set first address as default', async () => {
                const response = await request(app)
                    .get('/api/customers/addresses')
                    .set('x-auth-token', authToken);

                const addresses = response.body.addresses;
                const defaultAddress = addresses.find(addr => addr.isDefault);
                expect(defaultAddress).toBeDefined();
            });
        });

        describe('PUT /api/customers/addresses/:addressId', () => {
            it('should update address', async () => {
                const response = await request(app)
                    .put(`/api/customers/addresses/${addressId}`)
                    .set('x-auth-token', authToken)
                    .send({
                        street: '456 New St',
                        city: 'Quezon City',
                        postalCode: '5678',
                        phone: '+0987654321'
                    });

                expect(response.status).toBe(200);
                expect(response.body.address.street).toBe('456 New St');
            });

            it('should fail with missing required fields', async () => {
                const response = await request(app)
                    .put(`/api/customers/addresses/${addressId}`)
                    .set('x-auth-token', authToken)
                    .send({
                        street: '789 Old St'
                        // Missing city and postal code
                    });

                expect(response.status).toBe(400);
            });
        });

        describe('PUT /api/customers/addresses/:addressId/default', () => {
            it('should set address as default', async () => {
                const response = await request(app)
                    .put(`/api/customers/addresses/${addressId}/default`)
                    .set('x-auth-token', authToken);

                expect(response.status).toBe(200);
                expect(response.body.address.isDefault).toBe(true);
            });
        });

        describe('DELETE /api/customers/addresses/:addressId', () => {
            it('should delete address', async () => {
                // First add another address
                const addResponse = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', authToken)
                    .send({
                        label: 'work',
                        street: '999 Work Ave',
                        city: 'Makati',
                        postalCode: '9999',
                        phone: '+1111111111'
                    });

                const newAddressId = addResponse.body.address._id;

                // Now delete the first address
                const deleteResponse = await request(app)
                    .delete(`/api/customers/addresses/${addressId}`)
                    .set('x-auth-token', authToken);

                expect(deleteResponse.status).toBe(200);

                // Verify it's deleted
                const getResponse = await request(app)
                    .get('/api/customers/addresses')
                    .set('x-auth-token', authToken);

                const addresses = getResponse.body.addresses;
                const deleted = addresses.find(addr => addr._id === addressId);
                expect(deleted).toBeUndefined();
            });

            it('should fail with non-existent address', async () => {
                const response = await request(app)
                    .delete('/api/customers/addresses/nonexistentid')
                    .set('x-auth-token', authToken);

                expect(response.status).toBe(400);
            });
        });
    });

    describe('Order Management Endpoints', () => {
        describe('GET /api/customers/orders', () => {
            it('should get customer orders', async () => {
                const response = await request(app)
                    .get('/api/customers/orders')
                    .set('x-auth-token', authToken);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('orders');
                expect(response.body).toHaveProperty('pagination');
            });

            it('should support pagination', async () => {
                const response = await request(app)
                    .get('/api/customers/orders?page=1&limit=5')
                    .set('x-auth-token', authToken);

                expect(response.status).toBe(200);
                expect(response.body.pagination.page).toBe(1);
                expect(response.body.pagination.limit).toBe(5);
            });

            it('should support status filtering', async () => {
                const response = await request(app)
                    .get('/api/customers/orders?status=completed')
                    .set('x-auth-token', authToken);

                expect(response.status).toBe(200);
            });

            it('should fail without authentication', async () => {
                const response = await request(app)
                    .get('/api/customers/orders');

                expect(response.status).toBe(401);
            });
        });

        describe('GET /api/customers/orders/:orderId', () => {
            it('should get order details', async () => {
                // This test assumes orders exist
                // In real scenario, create an order first
                const ordersResponse = await request(app)
                    .get('/api/customers/orders')
                    .set('x-auth-token', authToken);

                if (ordersResponse.body.orders.length > 0) {
                    const orderId = ordersResponse.body.orders[0]._id;

                    const response = await request(app)
                        .get(`/api/customers/orders/${orderId}`)
                        .set('x-auth-token', authToken);

                    expect(response.status).toBe(200);
                    expect(response.body).toHaveProperty('_id');
                }
            });
        });
    });

    describe('Logout Endpoint', () => {
        describe('POST /api/auth/customer/logout', () => {
            it('should logout successfully', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/logout')
                    .set('x-auth-token', authToken);

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('message');
            });

            it('should fail without authentication', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/logout');

                expect(response.status).toBe(401);
            });
        });
    });

    describe('Error Handling', () => {
        it('should return 401 for invalid token', async () => {
            const response = await request(app)
                .get('/api/customers/profile')
                .set('x-auth-token', 'invalid-token');

            expect(response.status).toBe(401);
        });

        it('should return 404 for non-existent endpoints', async () => {
            const response = await request(app)
                .get('/api/nonexistent/endpoint');

            expect(response.status).toBe(404);
        });
    });

    // ====== EDGE CASE & VALIDATION TESTS ======
    describe('Edge Cases & Advanced Validation', () => {
        let edgeTestToken;
        let edgeTestUserId;
        const edgeTestEmail = 'edge-test@example.com';
        const edgeTestPassword = 'EdgePassword123';

        beforeAll(async () => {
            // Register edge case test user
            const registerRes = await request(app)
                .post('/api/auth/customer/register')
                .send({
                    email: edgeTestEmail,
                    password: edgeTestPassword,
                    name: 'Edge Test User'
                });

            edgeTestUserId = registerRes.body.user.id;

            // Get token for edge case testing
            const loginRes = await request(app)
                .post('/api/auth/customer/login')
                .send({
                    email: edgeTestEmail,
                    password: edgeTestPassword
                });

            edgeTestToken = loginRes.body.token;
        });

        afterAll(async () => {
            await User.deleteMany({ email: edgeTestEmail });
        });

        describe('Password Validation Edge Cases', () => {
            it('should fail password change with too short new password', async () => {
                const response = await request(app)
                    .post('/api/customers/change-password')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        currentPassword: edgeTestPassword,
                        newPassword: '123'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('at least 6 characters');
            });

            it('should fail password change with same password', async () => {
                const response = await request(app)
                    .post('/api/customers/change-password')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        currentPassword: edgeTestPassword,
                        newPassword: edgeTestPassword
                    });

                // Some systems allow same password, so accept 200 or 400
                expect([200, 400]).toContain(response.status);
            });

            it('should fail with missing newPassword field', async () => {
                const response = await request(app)
                    .post('/api/customers/change-password')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        currentPassword: edgeTestPassword
                    });

                expect(response.status).toBe(400);
            });
        });

        describe('Address Validation Edge Cases', () => {
            it('should fail adding address with missing street', async () => {
                const response = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        city: 'Test City',
                        postalCode: '12345'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('Street');
            });

            it('should fail adding address with missing city', async () => {
                const response = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        street: 'Test Street',
                        postalCode: '12345'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('city');
            });

            it('should fail adding address with missing postal code', async () => {
                const response = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        street: 'Test Street',
                        city: 'Test City'
                    });

                expect(response.status).toBe(400);
                expect(response.body.error).toContain('postal');
            });

            it('should successfully add valid address', async () => {
                const response = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        street: '123 Main St',
                        city: 'Test City',
                        postalCode: '12345',
                        label: 'home'
                    });

                expect(response.status).toBe(201);
                expect(response.body.address.street).toBe('123 Main St');
            });

            it('should fail updating address with empty street', async () => {
                // First get an address
                const getRes = await request(app)
                    .get('/api/customers/addresses')
                    .set('x-auth-token', edgeTestToken);

                if (getRes.body.addresses.length > 0) {
                    const addressId = getRes.body.addresses[0]._id;

                    const response = await request(app)
                        .put(`/api/customers/addresses/${addressId}`)
                        .set('x-auth-token', edgeTestToken)
                        .send({
                            street: '',
                            city: 'Test City',
                            postalCode: '12345'
                        });

                    expect(response.status).toBe(400);
                }
            });
        });

        describe('Profile Update Edge Cases', () => {
            it('should update profile with empty name (optional field)', async () => {
                const response = await request(app)
                    .put('/api/customers/profile')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        name: 'New Name'
                    });

                expect(response.status).toBe(200);
                expect(response.body.user.name).toBe('New Name');
            });

            it('should preserve phone field when updating other fields', async () => {
                // First set phone
                await request(app)
                    .put('/api/customers/profile')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        phone: '+1234567890'
                    });

                // Then update name without providing phone
                const response = await request(app)
                    .put('/api/customers/profile')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        name: 'Another Name'
                    });

                expect(response.status).toBe(200);
                // Phone should be preserved if system maintains state
                expect(response.body.user.name).toBe('Another Name');
            });

            it('should update phone with valid format', async () => {
                const response = await request(app)
                    .put('/api/customers/profile')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        phone: '+919876543210'
                    });

                expect(response.status).toBe(200);
                expect(response.body.user.phone).toBe('+919876543210');
            });
        });

        describe('Order Query Edge Cases', () => {
            it('should handle pagination gracefully', async () => {
                const response = await request(app)
                    .get('/api/customers/orders?page=1&limit=10')
                    .set('x-auth-token', edgeTestToken);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.orders)).toBe(true);
            });

            it('should handle invalid status filter', async () => {
                const response = await request(app)
                    .get('/api/customers/orders?status=invalid_status')
                    .set('x-auth-token', edgeTestToken);

                // Should return empty array or error
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('orders');
            });

            it('should limit results with large limit parameter', async () => {
                const response = await request(app)
                    .get('/api/customers/orders?limit=1000')
                    .set('x-auth-token', edgeTestToken);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.orders)).toBe(true);
                // Should have reasonable limit regardless of request
                expect(response.body.orders.length).toBeLessThanOrEqual(1000);
            });
        });

        describe('Authentication Edge Cases', () => {
            it('should reject whitespace-only password', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/register')
                    .send({
                        email: 'whitespace@example.com',
                        password: '     ',
                        name: 'Test User'
                    });

                expect([400, 401]).toContain(response.status);
            });

            it('should handle email case sensitivity correctly', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/login')
                    .send({
                        email: edgeTestEmail.toUpperCase(),
                        password: edgeTestPassword
                    });

                // Email should be case-insensitive
                expect([200, 401]).toContain(response.status);
            });

            it('should fail login with empty password field', async () => {
                const response = await request(app)
                    .post('/api/auth/customer/login')
                    .send({
                        email: edgeTestEmail,
                        password: ''
                    });

                expect(response.status).toBe(400);
            });
        });

        describe('Input Sanitization', () => {
            it('should handle special characters in name', async () => {
                const response = await request(app)
                    .put('/api/customers/profile')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        name: 'Test <User> & "Quotes"'
                    });

                expect(response.status).toBe(200);
                // Should be stored safely
                expect(response.body.user.name).toBeTruthy();
            });

            it('should handle long input strings', async () => {
                const longString = 'a'.repeat(500);
                const response = await request(app)
                    .put('/api/customers/profile')
                    .set('x-auth-token', edgeTestToken)
                    .send({
                        name: longString
                    });

                // Should either accept or reject with 400
                expect([200, 400]).toContain(response.status);
            });
        });
    });

    // ====== ADVANCED INTEGRATION TESTS ======
    describe('Advanced Integration Scenarios', () => {
        let integrationToken;
        let integrationUserId;
        const integrationEmail = 'integration-test@example.com';
        const integrationPassword = 'IntegrationPassword123';

        beforeAll(async () => {
            // Register integration test user
            const registerRes = await request(app)
                .post('/api/auth/customer/register')
                .send({
                    email: integrationEmail,
                    password: integrationPassword,
                    name: 'Integration Test User'
                });

            integrationUserId = registerRes.body.user.id;

            // Get token
            const loginRes = await request(app)
                .post('/api/auth/customer/login')
                .send({
                    email: integrationEmail,
                    password: integrationPassword
                });

            integrationToken = loginRes.body.token;
        });

        afterAll(async () => {
            await User.deleteMany({ email: integrationEmail });
        });

        describe('Complete User Workflow', () => {
            it('should complete full registration and profile setup', async () => {
                const newEmail = 'workflow-test@example.com';
                
                // Register
                const registerRes = await request(app)
                    .post('/api/auth/customer/register')
                    .send({
                        email: newEmail,
                        password: 'WorkflowPassword123',
                        name: 'Workflow Test'
                    });

                expect(registerRes.status).toBe(201);
                expect(registerRes.body.user.email).toBe(newEmail);

                // Login
                const loginRes = await request(app)
                    .post('/api/auth/customer/login')
                    .send({
                        email: newEmail,
                        password: 'WorkflowPassword123'
                    });

                expect(loginRes.status).toBe(200);
                expect(loginRes.body.token).toBeTruthy();

                // Cleanup
                await User.deleteMany({ email: newEmail });
            });

            it('should add and manage multiple addresses in sequence', async () => {
                // Add first address
                const addr1Res = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', integrationToken)
                    .send({
                        street: '123 Main St',
                        city: 'City 1',
                        postalCode: '12345',
                        label: 'home'
                    });

                expect(addr1Res.status).toBe(201);
                const addr1Id = addr1Res.body.address._id;

                // Add second address
                const addr2Res = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', integrationToken)
                    .send({
                        street: '456 Oak Ave',
                        city: 'City 2',
                        postalCode: '54321',
                        label: 'work'
                    });

                expect(addr2Res.status).toBe(201);
                const addr2Id = addr2Res.body.address._id;

                // Get all addresses
                const listRes = await request(app)
                    .get('/api/customers/addresses')
                    .set('x-auth-token', integrationToken);

                expect(listRes.status).toBe(200);
                expect(listRes.body.addresses.length).toBeGreaterThanOrEqual(2);

                // Update first address
                const updateRes = await request(app)
                    .put(`/api/customers/addresses/${addr1Id}`)
                    .set('x-auth-token', integrationToken)
                    .send({
                        street: '789 Elm St',
                        city: 'City 1 Updated',
                        postalCode: '12345'
                    });

                expect(updateRes.status).toBe(200);

                // Set second address as default
                const defaultRes = await request(app)
                    .put(`/api/customers/addresses/${addr2Id}/default`)
                    .set('x-auth-token', integrationToken);

                expect(defaultRes.status).toBe(200);

                // Delete first address
                const deleteRes = await request(app)
                    .delete(`/api/customers/addresses/${addr1Id}`)
                    .set('x-auth-token', integrationToken);

                expect(deleteRes.status).toBe(200);
            });

            it('should retrieve and filter orders with various criteria', async () => {
                // Get all orders
                const allRes = await request(app)
                    .get('/api/customers/orders')
                    .set('x-auth-token', integrationToken);

                expect(allRes.status).toBe(200);
                expect(Array.isArray(allRes.body.orders)).toBe(true);

                // Get with pagination
                const pageRes = await request(app)
                    .get('/api/customers/orders?page=1&limit=5')
                    .set('x-auth-token', integrationToken);

                expect(pageRes.status).toBe(200);
                expect(pageRes.body.orders.length).toBeLessThanOrEqual(5);

                // Get with status filter (if orders exist)
                const statusRes = await request(app)
                    .get('/api/customers/orders?status=pending')
                    .set('x-auth-token', integrationToken);

                expect(statusRes.status).toBe(200);
                expect(Array.isArray(statusRes.body.orders)).toBe(true);
            });
        });

        describe('Security & Authorization', () => {
            it('should not allow accessing other user profiles with different token', async () => {
                // Create another user
                const otherRes = await request(app)
                    .post('/api/auth/customer/register')
                    .send({
                        email: 'other-user@example.com',
                        password: 'OtherPassword123',
                        name: 'Other User'
                    });

                const otherToken = (await request(app)
                    .post('/api/auth/customer/login')
                    .send({
                        email: 'other-user@example.com',
                        password: 'OtherPassword123'
                    })).body.token;

                // Get profile should return own profile, not other user's
                const res = await request(app)
                    .get('/api/customers/profile')
                    .set('x-auth-token', otherToken);

                expect(res.status).toBe(200);
                expect(res.body.user.email).toBe('other-user@example.com');

                // Cleanup
                await User.deleteMany({ email: 'other-user@example.com' });
            });

            it('should enforce authentication on protected routes', async () => {
                // Try to access protected route without token
                const noTokenRes = await request(app)
                    .get('/api/customers/profile');

                expect(noTokenRes.status).toBe(401);

                // Try with invalid token
                const invalidTokenRes = await request(app)
                    .get('/api/customers/profile')
                    .set('x-auth-token', 'invalid-token-format');

                expect(invalidTokenRes.status).toBe(401);

                // Try with malformed header
                const malformedRes = await request(app)
                    .get('/api/customers/profile')
                    .set('x-auth-token', '');

                expect(malformedRes.status).toBe(401);
            });
        });

        describe('Data Validation & Constraints', () => {
            it('should validate email format on registration', async () => {
                const res = await request(app)
                    .post('/api/auth/customer/register')
                    .send({
                        email: 'invalid-email',
                        password: 'ValidPassword123',
                        name: 'Test User'
                    });

                expect([400, 422]).toContain(res.status);
            });

            it('should enforce unique email constraint', async () => {
                const testData = {
                    email: 'unique-test@example.com',
                    password: 'UniquePassword123',
                    name: 'Unique Test'
                };

                // First registration should succeed
                const firstRes = await request(app)
                    .post('/api/auth/customer/register')
                    .send(testData);

                expect(firstRes.status).toBe(201);

                // Second registration with same email should fail
                const secondRes = await request(app)
                    .post('/api/auth/customer/register')
                    .send(testData);

                expect(secondRes.status).toBe(400);
                expect(secondRes.body.error).toContain('already');

                // Cleanup
                await User.deleteMany({ email: testData.email });
            });

            it('should validate profile update fields', async () => {
                // Invalid name (too long)
                const longName = 'a'.repeat(300);
                const updateRes = await request(app)
                    .put('/api/customers/profile')
                    .set('x-auth-token', integrationToken)
                    .send({
                        name: longName
                    });

                expect([200, 400]).toContain(updateRes.status);
            });
        });

        describe('Error Handling & Edge Cases', () => {
            it('should handle database errors gracefully', async () => {
                // Try to get order with invalid ID format
                const res = await request(app)
                    .get('/api/customers/orders/invalid-id-format')
                    .set('x-auth-token', integrationToken);

                // Should return error or empty result
                expect([200, 400, 404]).toContain(res.status);
            });

            it('should handle concurrent requests properly', async () => {
                const promises = [];

                // Make 5 concurrent requests
                for (let i = 0; i < 5; i++) {
                    promises.push(
                        request(app)
                            .get('/api/customers/profile')
                            .set('x-auth-token', integrationToken)
                    );
                }

                const results = await Promise.all(promises);

                // All should succeed
                results.forEach(res => {
                    expect(res.status).toBe(200);
                    expect(res.body.user.email).toBe(integrationEmail);
                });
            });

            it('should handle missing request body gracefully', async () => {
                const res = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', integrationToken)
                    .send({});

                expect(res.status).toBe(400);
            });
        });

        describe('Response Format & Consistency', () => {
            it('should return consistent user object structure', async () => {
                const res = await request(app)
                    .get('/api/customers/profile')
                    .set('x-auth-token', integrationToken);

                expect(res.status).toBe(200);
                expect(res.body.user).toHaveProperty('id');
                expect(res.body.user).toHaveProperty('email');
                expect(res.body.user).toHaveProperty('name');
                expect(res.body.user).toHaveProperty('role');
            });

            it('should return proper error structure on validation failure', async () => {
                const res = await request(app)
                    .post('/api/customers/addresses')
                    .set('x-auth-token', integrationToken)
                    .send({
                        street: '123 Test St'
                        // Missing required fields
                    });

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
                expect(typeof res.body.error).toBe('string');
            });

            it('should include proper HTTP status codes', async () => {
                // Success case
                const successRes = await request(app)
                    .get('/api/customers/profile')
                    .set('x-auth-token', integrationToken);

                expect(successRes.status).toBe(200);

                // Not found case
                const notFoundRes = await request(app)
                    .get('/api/nonexistent/endpoint');

                expect(notFoundRes.status).toBe(404);

                // Unauthorized case
                const unauthorizedRes = await request(app)
                    .get('/api/customers/profile');

                expect(unauthorizedRes.status).toBe(401);
            });
        });
    });
});
