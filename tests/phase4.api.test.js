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
});
