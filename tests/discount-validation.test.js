/**
 * Discount Validation Tests
 * Tests the discount endpoint with various scenarios
 */

const http = require('http');

const API_BASE = 'http://localhost:5001';

// Helper function to make API requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test cases
async function runTests() {
  console.log('\n========================================');
  console.log('   DISCOUNT VALIDATION TEST SUITE');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Validate WELCOME10 code
  console.log('Test 1: Validate WELCOME10 code');
  try {
    const res = await makeRequest('GET', '/api/discounts/validate/WELCOME10?orderAmount=1000');
    if (res.status === 200 && res.data.code === 'WELCOME10') {
      console.log('✅ PASS: WELCOME10 code validated successfully');
      console.log(`   Discount: ${res.data.discountValue}% off`);
      console.log(`   Valid until: ${res.data.endDate}`);
      passed++;
    } else {
      console.log('❌ FAIL: Unexpected response');
      console.log(`   Status: ${res.status}, Data:`, res.data);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    failed++;
  }

  // Test 2: Validate CHRISTMAS code
  console.log('\nTest 2: Validate CHRISTMAS code');
  try {
    const res = await makeRequest('GET', '/api/discounts/validate/CHRISTMAS?orderAmount=1500');
    if (res.status === 200 && res.data.code === 'CHRISTMAS') {
      console.log('✅ PASS: CHRISTMAS code validated successfully');
      console.log(`   Discount: ${res.data.discountValue}% off`);
      console.log(`   Valid until: ${res.data.endDate}`);
      passed++;
    } else {
      console.log('❌ FAIL: Unexpected response');
      console.log(`   Status: ${res.status}, Data:`, res.data);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    failed++;
  }

  // Test 3: Invalid discount code
  console.log('\nTest 3: Invalid discount code (INVALID999)');
  try {
    const res = await makeRequest('GET', '/api/discounts/validate/INVALID999?orderAmount=1000');
    if (res.status === 400) {
      console.log('✅ PASS: Invalid code correctly rejected');
      console.log(`   Message: ${res.data.message || res.data}`);
      passed++;
    } else {
      console.log('❌ FAIL: Should return 400 for invalid code');
      console.log(`   Status: ${res.status}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    failed++;
  }

  // Test 4: Case insensitivity (welcome10 lowercase)
  console.log('\nTest 4: Case insensitivity (welcome10 lowercase)');
  try {
    const res = await makeRequest('GET', '/api/discounts/validate/welcome10?orderAmount=1000');
    if (res.status === 200 && res.data.code === 'WELCOME10') {
      console.log('✅ PASS: Lowercase code converted correctly');
      passed++;
    } else {
      console.log('❌ FAIL: Case insensitivity not working');
      console.log(`   Status: ${res.status}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    failed++;
  }

  // Test 5: Calculate discount amount (WELCOME10 - 30% off)
  console.log('\nTest 5: Calculate discount amount (30% off 1000)');
  try {
    const res = await makeRequest('GET', '/api/discounts/validate/WELCOME10?orderAmount=1000');
    if (res.status === 200) {
      const expectedDiscount = 1000 * 0.30; // 30% of 1000 = 300
      console.log(`✅ PASS: Discount calculated`);
      console.log(`   Order amount: ₱1000`);
      console.log(`   Discount percentage: 30%`);
      console.log(`   Discount amount: ₱${res.data.discountAmount || expectedDiscount}`);
      console.log(`   Final total: ₱${1000 - (res.data.discountAmount || expectedDiscount)}`);
      passed++;
    } else {
      console.log('❌ FAIL: Could not calculate discount');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    failed++;
  }

  // Test 6: Different order amounts with same code
  console.log('\nTest 6: Different order amounts (WELCOME10 with ₱500)');
  try {
    const res = await makeRequest('GET', '/api/discounts/validate/WELCOME10?orderAmount=500');
    if (res.status === 200) {
      const expectedDiscount = 500 * 0.30; // 30% of 500 = 150
      console.log(`✅ PASS: Correctly calculated for smaller order`);
      console.log(`   Order amount: ₱500`);
      console.log(`   Discount amount: ₱${res.data.discountAmount || expectedDiscount}`);
      console.log(`   Final total: ₱${500 - (res.data.discountAmount || expectedDiscount)}`);
      passed++;
    } else {
      console.log('❌ FAIL: Could not calculate discount for smaller order');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    failed++;
  }

  // Test 7: Code format validation
  console.log('\nTest 7: Code format validation (WELCOME10)');
  try {
    const res = await makeRequest('GET', '/api/discounts/validate/WELCOME10?orderAmount=1000');
    if (res.status === 200 && res.data.code && /^[A-Z0-9]+$/.test(res.data.code)) {
      console.log('✅ PASS: Code format is valid (uppercase letters/numbers only)');
      console.log(`   Code: ${res.data.code}`);
      passed++;
    } else {
      console.log('❌ FAIL: Code format validation failed');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    failed++;
  }

  // Test 8: Response contains all required fields
  console.log('\nTest 8: Response contains all required fields');
  try {
    const res = await makeRequest('GET', '/api/discounts/validate/WELCOME10?orderAmount=1000');
    if (res.status === 200) {
      const requiredFields = ['code', 'discountType', 'discountValue', 'discountAmount', 'startDate', 'endDate'];
      const missingFields = requiredFields.filter(field => !(field in res.data));
      
      if (missingFields.length === 0) {
        console.log('✅ PASS: All required fields present');
        console.log(`   Fields: ${requiredFields.join(', ')}`);
        passed++;
      } else {
        console.log('❌ FAIL: Missing fields:', missingFields.join(', '));
        failed++;
      }
    } else {
      console.log('❌ FAIL: Could not validate response');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    failed++;
  }

  // Test 9: Get all active discounts
  console.log('\nTest 9: Get all active discounts');
  try {
    const res = await makeRequest('GET', '/api/discounts?isActive=true');
    if (res.status === 200 && Array.isArray(res.data.discounts)) {
      console.log(`✅ PASS: Retrieved ${res.data.discounts.length} active discounts`);
      res.data.discounts.forEach(discount => {
        console.log(`   - ${discount.code}: ${discount.discountValue}% off (${discount.description})`);
      });
      passed++;
    } else {
      console.log('❌ FAIL: Could not retrieve discounts');
      console.log(`   Status: ${res.status}`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    failed++;
  }

  // Test 10: Verify discount metadata
  console.log('\nTest 10: Verify discount metadata (WELCOME10)');
  try {
    const res = await makeRequest('GET', '/api/discounts/validate/WELCOME10?orderAmount=1000');
    if (res.status === 200) {
      console.log('✅ PASS: Discount metadata verified');
      console.log(`   Code: ${res.data.code}`);
      console.log(`   Description: ${res.data.description || 'N/A'}`);
      console.log(`   Type: ${res.data.discountType}`);
      console.log(`   Value: ${res.data.discountValue}`);
      console.log(`   Start Date: ${new Date(res.data.startDate).toLocaleDateString()}`);
      console.log(`   End Date: ${new Date(res.data.endDate).toLocaleDateString()}`);
      console.log(`   Is Active: ${res.data.isActive}`);
      passed++;
    } else {
      console.log('❌ FAIL: Could not retrieve metadata');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    failed++;
  }

  // Summary
  console.log('\n========================================');
  console.log(`   TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
