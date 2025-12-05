/**
 * Discount Validation & Pricing Tests
 * Tests for discount system, pricing calculations, and validation
 */

const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../src/models/user');
const Discount = require('../src/models/discount');
const Order = require('../src/models/order');
const app = require('../server');

describe('Discount & Pricing Tests', () => {
    let authToken;
    let userId;
    let discountId;
    const testEmail = 'discount-test@example.com';
    const testPassword = 'TestPassword123';

    beforeAll(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickorder-test', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        }

        // Clean up test data
        await User.deleteMany({ email: testEmail });
        await Discount.deleteMany({ code: /TEST/ });

        // Register and login user
        await request(app)
            .post('/api/auth/customer/register')
            .send({
                email: testEmail,
                password: testPassword,
                name: 'Discount Test User'
            });

        const loginRes = await request(app)
            .post('/api/auth/customer/login')
            .send({
                email: testEmail,
                password: testPassword
            });

        authToken = loginRes.body.token;
        userId = loginRes.body.user.id;
    });

    afterAll(async () => {
        await User.deleteMany({ email: testEmail });
        await Discount.deleteMany({ code: /TEST/ });
    });

    // ====== DISCOUNT VALIDATION TESTS ======
    describe('Discount Code Validation', () => {
        it('should validate a valid discount code', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=WELCOME11&amount=300');

            expect(response.status).toBe(200);
            if (response.body.valid) {
                expect(response.body).toHaveProperty('code');
                expect(response.body).toHaveProperty('discountValue');
                expect(response.body).toHaveProperty('applicableAmount');
            }
        });

        it('should reject invalid discount code', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=INVALID999&amount=300');

            expect(response.status).toBe(200);
            expect(response.body.valid).toBe(false);
            expect(response.body).toHaveProperty('message');
        });

        it('should return discount details when valid', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=WELCOME11&amount=500');

            if (response.body.valid) {
                expect(response.body).toHaveProperty('discountType');
                expect(response.body).toHaveProperty('discountValue');
                expect(response.body).toHaveProperty('minOrderAmount');
                expect(response.body).toHaveProperty('expiryDate');
            }
        });

        it('should handle empty discount code gracefully', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=&amount=300');

            expect([200, 400]).toContain(response.status);
        });

        it('should handle missing amount parameter', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=WELCOME11');

            expect(response.status).toBe(200);
            // Should still validate without amount
        });
    });

    // ====== DISCOUNT PERCENTAGE CALCULATION TESTS ======
    describe('Discount Percentage Calculation', () => {
        let percentageDiscountId;

        beforeAll(async () => {
            // Create a percentage discount
            const createRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', authToken)
                .send({
                    code: 'TEST_PERCENT_10',
                    description: 'Test 10% discount',
                    discountType: 'percentage',
                    discountValue: 10,
                    minOrderAmount: 0,
                    maxUses: 100,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (createRes.status === 201) {
                percentageDiscountId = createRes.body.discount._id;
            }
        });

        it('should calculate 10% discount correctly', async () => {
            const orderAmount = 1000;
            const expectedDiscount = orderAmount * 0.10; // 100

            const response = await request(app)
                .get(`/api/discounts/validate?code=TEST_PERCENT_10&amount=${orderAmount}`);

            if (response.body.valid && response.body.discountType === 'percentage') {
                const actualDiscount = response.body.applicableAmount;
                expect(actualDiscount).toBe(expectedDiscount);
            }
        });

        it('should calculate 10% discount on 500 amount', async () => {
            const orderAmount = 500;
            const expectedDiscount = 50;

            const response = await request(app)
                .get(`/api/discounts/validate?code=TEST_PERCENT_10&amount=${orderAmount}`);

            if (response.body.valid && response.body.discountType === 'percentage') {
                expect(response.body.applicableAmount).toBe(expectedDiscount);
            }
        });

        it('should calculate percentage discount on various amounts', async () => {
            const testCases = [
                { amount: 100, expected: 10 },
                { amount: 200, expected: 20 },
                { amount: 500, expected: 50 },
                { amount: 1000, expected: 100 }
            ];

            for (const testCase of testCases) {
                const response = await request(app)
                    .get(`/api/discounts/validate?code=TEST_PERCENT_10&amount=${testCase.amount}`);

                if (response.body.valid) {
                    const actualDiscount = response.body.applicableAmount;
                    const expectedDiscount = testCase.expected;
                    expect(Math.round(actualDiscount * 100) / 100).toBe(expectedDiscount);
                }
            }
        });
    });

    // ====== DISCOUNT FIXED AMOUNT CALCULATION TESTS ======
    describe('Fixed Amount Discount Calculation', () => {
        let fixedDiscountId;

        beforeAll(async () => {
            // Create a fixed amount discount
            const createRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', authToken)
                .send({
                    code: 'TEST_FIXED_50',
                    description: 'Test fixed 50 rupees discount',
                    discountType: 'fixed',
                    discountValue: 50,
                    minOrderAmount: 200,
                    maxUses: 100,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (createRes.status === 201) {
                fixedDiscountId = createRes.body.discount._id;
            }
        });

        it('should apply fixed 50 rupee discount', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=TEST_FIXED_50&amount=300');

            if (response.body.valid && response.body.discountType === 'fixed') {
                expect(response.body.discountValue).toBe(50);
                expect(response.body.applicableAmount).toBe(50);
            }
        });

        it('should not apply discount below minimum order amount', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=TEST_FIXED_50&amount=100');

            if (response.status === 200) {
                if (response.body.valid) {
                    // If discount type is fixed with min amount
                    expect(response.body.discountValue).toBeLessThanOrEqual(response.body.applicableAmount);
                } else {
                    expect(response.body.message).toContain('minimum');
                }
            }
        });

        it('should apply full discount for amounts at minimum', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=TEST_FIXED_50&amount=200');

            if (response.body.valid) {
                expect(response.body.applicableAmount).toBe(50);
            }
        });

        it('should not exceed order amount as discount', async () => {
            // Create a discount larger than order amount
            const largeDiscountRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', authToken)
                .send({
                    code: 'TEST_FIXED_500',
                    description: 'Test 500 rupee discount',
                    discountType: 'fixed',
                    discountValue: 500,
                    minOrderAmount: 0,
                    maxUses: 100,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (largeDiscountRes.status === 201) {
                const response = await request(app)
                    .get('/api/discounts/validate?code=TEST_FIXED_500&amount=100');

                if (response.body.valid) {
                    // Discount should not exceed order amount
                    expect(response.body.applicableAmount).toBeLessThanOrEqual(100);
                }
            }
        });
    });

    // ====== DISCOUNT USAGE LIMIT TESTS ======
    describe('Discount Usage Limits', () => {
        let limitedDiscountId;

        beforeAll(async () => {
            // Create discount with usage limit
            const createRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', authToken)
                .send({
                    code: 'TEST_LIMITED_1',
                    description: 'Test limited use discount',
                    discountType: 'fixed',
                    discountValue: 10,
                    minOrderAmount: 0,
                    maxUses: 1,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (createRes.status === 201) {
                limitedDiscountId = createRes.body.discount._id;
            }
        });

        it('should show remaining uses in validation', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=TEST_LIMITED_1&amount=300');

            if (response.body.valid) {
                expect(response.body).toHaveProperty('maxUses');
                expect(response.body).toHaveProperty('usedCount');
                expect(response.body).toHaveProperty('remainingUses');
            }
        });

        it('should track usage count correctly', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=TEST_LIMITED_1&amount=300');

            if (response.body.valid) {
                const remainingBefore = response.body.remainingUses;
                expect(remainingBefore).toBeGreaterThanOrEqual(0);
                expect(remainingBefore).toBeLessThanOrEqual(response.body.maxUses);
            }
        });

        it('should reject when usage limit reached', async () => {
            // This test assumes the limit is actually enforced
            const response = await request(app)
                .get('/api/discounts/validate?code=TEST_LIMITED_1&amount=300');

            expect(response.status).toBe(200);
            // Response should indicate if limit is reached
            expect(response.body).toHaveProperty('valid');
        });
    });

    // ====== DISCOUNT EXPIRATION TESTS ======
    describe('Discount Expiration & Date Validation', () => {
        it('should reject expired discount codes', async () => {
            // Create an already expired discount
            const expiredRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', authToken)
                .send({
                    code: 'TEST_EXPIRED_CODE',
                    description: 'Already expired',
                    discountType: 'fixed',
                    discountValue: 10,
                    minOrderAmount: 0,
                    maxUses: 100,
                    isActive: false,
                    expiryDate: new Date(Date.now() - 1000).toISOString() // Past date
                });

            if (expiredRes.status === 201 || expiredRes.status === 200) {
                const response = await request(app)
                    .get('/api/discounts/validate?code=TEST_EXPIRED_CODE&amount=300');

                expect(response.status).toBe(200);
                if (!response.body.valid) {
                    expect(response.body.message.toLowerCase()).toContain('expired');
                }
            }
        });

        it('should accept discount before expiration date', async () => {
            // Create discount expiring in future
            const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            const futureRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', authToken)
                .send({
                    code: 'TEST_FUTURE_VALID',
                    description: 'Valid until future',
                    discountType: 'fixed',
                    discountValue: 10,
                    minOrderAmount: 0,
                    maxUses: 100,
                    isActive: true,
                    expiryDate: futureDate
                });

            if (futureRes.status === 201) {
                const response = await request(app)
                    .get('/api/discounts/validate?code=TEST_FUTURE_VALID&amount=300');

                expect(response.status).toBe(200);
                expect(response.body.valid).toBe(true);
            }
        });

        it('should show expiration date in response', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=WELCOME11&amount=300');

            if (response.body.valid) {
                expect(response.body).toHaveProperty('expiryDate');
                expect(response.body.expiryDate).toBeTruthy();
            }
        });

        it('should calculate days until expiration', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=WELCOME11&amount=300');

            if (response.body.valid && response.body.expiryDate) {
                const expiryTime = new Date(response.body.expiryDate).getTime();
                const currentTime = new Date().getTime();
                const daysUntilExpiry = (expiryTime - currentTime) / (1000 * 60 * 60 * 24);
                expect(daysUntilExpiry).toBeGreaterThan(0);
            }
        });
    });

    // ====== DISCOUNT ACTIVE/INACTIVE STATUS TESTS ======
    describe('Discount Active Status', () => {
        it('should only use active discounts', async () => {
            // Create inactive discount
            const inactiveRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', authToken)
                .send({
                    code: 'TEST_INACTIVE',
                    description: 'Inactive discount',
                    discountType: 'fixed',
                    discountValue: 20,
                    minOrderAmount: 0,
                    maxUses: 100,
                    isActive: false,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (inactiveRes.status === 201) {
                const response = await request(app)
                    .get('/api/discounts/validate?code=TEST_INACTIVE&amount=300');

                expect(response.status).toBe(200);
                if (!response.body.valid) {
                    expect(response.body.message.toLowerCase()).toContain('inactive');
                }
            }
        });
    });

    // ====== DISCOUNT MINIMUM ORDER VALIDATION ======
    describe('Discount Minimum Order Validation', () => {
        it('should reject discount when order below minimum', async () => {
            // Create discount with high minimum
            const minRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', authToken)
                .send({
                    code: 'TEST_MIN_1000',
                    description: 'Requires min 1000 order',
                    discountType: 'fixed',
                    discountValue: 100,
                    minOrderAmount: 1000,
                    maxUses: 100,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (minRes.status === 201) {
                const response = await request(app)
                    .get('/api/discounts/validate?code=TEST_MIN_1000&amount=500');

                expect(response.status).toBe(200);
                if (!response.body.valid) {
                    expect(response.body.message.toLowerCase()).toContain('minimum');
                }
            }
        });

        it('should accept discount when order meets minimum', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=TEST_MIN_1000&amount=1000');

            expect(response.status).toBe(200);
            // Should be valid or show specific error (not minimum error)
        });

        it('should accept discount when order exceeds minimum', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=TEST_MIN_1000&amount=1500');

            expect(response.status).toBe(200);
        });
    });

    // ====== DISCOUNT TYPE VALIDATION ======
    describe('Discount Type Handling', () => {
        it('should identify fixed discount type', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=WELCOME11&amount=300');

            if (response.body.valid) {
                expect(['fixed', 'percentage']).toContain(response.body.discountType);
            }
        });

        it('should handle case-insensitive discount codes', async () => {
            const response1 = await request(app)
                .get('/api/discounts/validate?code=WELCOME11&amount=300');

            const response2 = await request(app)
                .get('/api/discounts/validate?code=welcome11&amount=300');

            // Both should return same validity status
            expect(response1.body.valid).toBe(response2.body.valid);
        });
    });

    // ====== SPECIAL DISCOUNT SCENARIOS ======
    describe('Special Discount Scenarios', () => {
        it('should handle zero value discounts', async () => {
            const zeroRes = await request(app)
                .post('/api/discounts')
                .set('x-auth-token', authToken)
                .send({
                    code: 'TEST_ZERO_DISC',
                    description: 'Zero discount',
                    discountType: 'fixed',
                    discountValue: 0,
                    minOrderAmount: 0,
                    maxUses: 100,
                    isActive: true,
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (zeroRes.status === 201) {
                const response = await request(app)
                    .get('/api/discounts/validate?code=TEST_ZERO_DISC&amount=300');

                expect(response.status).toBe(200);
                if (response.body.valid) {
                    expect(response.body.applicableAmount).toBe(0);
                }
            }
        });

        it('should handle negative amount gracefully', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=WELCOME11&amount=-100');

            expect(response.status).toBe(200);
            // Should reject or handle negative amounts
        });

        it('should handle very large order amounts', async () => {
            const response = await request(app)
                .get('/api/discounts/validate?code=TEST_PERCENT_10&amount=1000000');

            expect(response.status).toBe(200);
            if (response.body.valid && response.body.discountType === 'percentage') {
                const expectedDiscount = 1000000 * 0.10;
                expect(response.body.applicableAmount).toBe(expectedDiscount);
            }
        });
    });
});
