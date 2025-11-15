const request = require('supertest');
const Order = require('../src/models/order');
const User = require('../src/models/user');
const { app, mongoose } = require('../server');

describe('Server', () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should return 200 for the root path', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
  });
});

describe('Auth API', () => {
  let adminToken;
  let customerToken;
  let adminUser = { username: 'testadmin', password: 'password123', role: 'admin' };
  let customerUser = { username: 'testcustomer', password: 'password123' };

  beforeAll(async () => {
    // Register an admin user
    await request(app).post('/api/auth/register').send(adminUser);
    // Login as admin to get a token
    const adminRes = await request(app).post('/api/auth/login').send(adminUser);
    adminToken = adminRes.body.token;

    // Register a customer user
    await request(app).post('/api/auth/register').send(customerUser);
    // Login as customer to get a token
    const customerRes = await request(app).post('/api/auth/login').send(customerUser);
    customerToken = customerRes.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ username: { $in: [adminUser.username, customerUser.username] } });
  });

  it('should register a new customer', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'newcustomer', password: 'password123' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe('User created successfully');
  });

  it('should login an existing user and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: adminUser.username, password: adminUser.password });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: adminUser.username, password: 'wrongpassword' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should allow an admin to create a new user with a specified role', async () => {
    const res = await request(app)
      .post('/api/auth/create-user')
      .set('x-auth-token', adminToken)
      .send({ username: 'newadmin', password: 'password123', role: 'admin' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toBe('User created successfully');
  });

  it('should not allow a customer to create a new user with a specified role', async () => {
    const res = await request(app)
      .post('/api/auth/create-user')
      .set('x-auth-token', customerToken)
      .send({ username: 'anotheradmin', password: 'password123', role: 'admin' });
    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toBe('Forbidden: You do not have the necessary permissions');
  });
});

describe('Order API', () => {
  let testOrder;
  let authToken;

  beforeAll(async () => {
    // Register an admin user and get a token for protected routes
    const adminUser = { username: 'orderadmin', password: 'password123', role: 'admin' };
    await request(app).post('/api/auth/register').send(adminUser);
    const adminRes = await request(app).post('/api/auth/login').send(adminUser);
    authToken = adminRes.body.token;

    // Create a sample order to use for testing
    testOrder = new Order({
      customerName: 'Test User',
      customerPhone: '1234567890',
      address: '123 Test St',
      items: [{ name: 'Test Item', quantity: 1, price: 10 }],
      total: 10,
      status: 'pending'
    });
    await testOrder.save();
  });

  afterAll(async () => {
    // Clean up the test data
    await Order.findByIdAndDelete(testOrder._id);
    await User.deleteMany({ username: 'orderadmin' });
  });

  it('should fetch all orders (protected)', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('x-auth-token', authToken);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should not fetch all orders without a token', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('No token, authorization denied');
  });

  it('should create a new order (protected)', async () => {
    const newOrder = {
      customerName: 'New Customer',
      customerPhone: '0987654321',
      address: '456 New Ave',
      items: [{ name: 'New Item', quantity: 2, price: 15 }],
      total: 30
    };
    const res = await request(app)
      .post('/api/orders')
      .set('x-auth-token', authToken)
      .send(newOrder);
    expect(res.statusCode).toEqual(201);
    expect(res.body.customerName).toBe(newOrder.customerName);
    // Clean up the created order
    await Order.findByIdAndDelete(res.body._id);
  });

  it('should not create a new order without a token', async () => {
    const newOrder = {
      customerName: 'Unauthorized Customer',
      customerPhone: '0987654321',
      address: '456 New Ave',
      items: [{ name: 'New Item', quantity: 2, price: 15 }],
      total: 30
    };
    const res = await request(app)
      .post('/api/orders')
      .send(newOrder);
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('No token, authorization denied');
  });

  it('should update an order status to preparing (protected)', async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrder._id}/status`)
      .set('x-auth-token', authToken)
      .send({ status: 'preparing' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('preparing');
  });

  it('should not update an order status without a token', async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrder._id}/status`)
      .send({ status: 'ready' });
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('No token, authorization denied');
  });

  it('should return 400 for an invalid status update (protected)', async () => {
    const res = await request(app)
      .put(`/api/orders/${testOrder._id}/status`)
      .set('x-auth-token', authToken)
      .send({ status: 'delivered' }); // 'delivered' is not in the allowed list
    expect(res.statusCode).toEqual(400);
  });

  it('should delete an order (protected)', async () => {
    const orderToDelete = new Order({
      customerName: 'Delete Me',
      customerPhone: '1112223333',
      address: 'Delete St',
      items: [{ name: 'Item to Delete', quantity: 1, price: 5 }],
      total: 5
    });
    await orderToDelete.save();

    const res = await request(app)
      .delete(`/api/orders/${orderToDelete._id}`)
      .set('x-auth-token', authToken);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe('Order deleted');
  });

  it('should not delete an order without a token', async () => {
    const orderToDelete = new Order({
      customerName: 'Delete Me Unauthorized',
      customerPhone: '1112223333',
      address: 'Delete St',
      items: [{ name: 'Item to Delete', quantity: 1, price: 5 }],
      total: 5
    });
    await orderToDelete.save();

    const res = await request(app)
      .delete(`/api/orders/${orderToDelete._id}`);
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toBe('No token, authorization denied');
    // Clean up
    await Order.findByIdAndDelete(orderToDelete._id);
  });
});
