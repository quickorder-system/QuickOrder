const mongoose = require('mongoose');

async function generateOrderId() {
  const Order = mongoose.model('Order');
  const count = await Order.countDocuments();
  return `QO${String(count + 1).padStart(6, '0')}`;
}

module.exports = { generateOrderId };
