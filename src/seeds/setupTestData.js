/**
 * Phase 7 - E2E Testing: Test Data Setup Script
 * 
 * Purpose: Create test accounts and data for comprehensive E2E testing
 * Usage: npm run setup:test-data
 * 
 * Creates:
 * - 5 test customer accounts (SC, PWD, Both, Normal, Default)
 * - 1 admin account
 * - 1 owner account
 * - SC and PWD discounts
 * - Sample eligibility records
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load models
const User = require('../models/user');
const Discount = require('../models/discount');
const EligibilityVerification = require('../models/eligibilityVerification');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quickorder';

const testAccounts = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    username: 'Admin User',
    role: 'admin',
    phone: '09001234567'
  },
  owner: {
    email: 'owner@test.com',
    password: 'Owner123!',
    username: 'Owner User',
    role: 'owner',
    phone: '09002234567'
  },
  customerSC: {
    email: 'customer.sc@test.com',
    password: 'Pass123!',
    username: 'Senior Citizen Test',
    role: 'customer',
    phone: '09003234567',
    eligibility: {
      isSeniorCitizen: true,
      scId: 'SC-2025-001',
      verified: false
    }
  },
  customerPWD: {
    email: 'customer.pwd@test.com',
    password: 'Pass123!',
    username: 'PWD Test',
    role: 'customer',
    phone: '09004234567',
    eligibility: {
      isPWD: true,
      pwdId: 'PWD-2025-001',
      verified: false
    }
  },
  customerBoth: {
    email: 'customer.both@test.com',
    password: 'Pass123!',
    username: 'Both Eligible Test',
    role: 'customer',
    phone: '09005234567',
    eligibility: {
      isSeniorCitizen: true,
      scId: 'SC-2025-002',
      isPWD: true,
      pwdId: 'PWD-2025-002',
      verified: false
    }
  },
  customerNormal: {
    email: 'customer.normal@test.com',
    password: 'Pass123!',
    username: 'Normal Customer Test',
    role: 'customer',
    phone: '09006234567',
    eligibility: null
  }
};

const testDiscounts = [
  {
    code: 'SC-DISCOUNT-2026',
    description: 'Senior Citizen Discount - 25%',
    discountValue: 25,
    discountType: 'percentage',
    isEligibilityBased: true,
    eligibilityType: 'SC',
    requiresVerification: false,
    isActive: true,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    maxUses: null,
    minOrderAmount: 0
  },
  {
    code: 'PWD-DISCOUNT-2026',
    description: 'PWD Discount - 18%',
    discountValue: 18,
    discountType: 'percentage',
    isEligibilityBased: true,
    eligibilityType: 'PWD',
    requiresVerification: false,
    isActive: true,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    maxUses: null,
    minOrderAmount: 0
  },
  {
    code: 'MANUAL-TEST-10',
    description: 'Manual Test Discount - 10%',
    discountValue: 10,
    discountType: 'percentage',
    isEligibilityBased: false,
    eligibilityType: null,
    requiresVerification: false,
    isActive: true,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    maxUses: 100,
    minOrderAmount: 100
  }
];

async function setupTestData() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing test data
    console.log('\n🔄 Clearing existing test data...');
    await User.deleteMany({ email: /test/ });
    await Discount.deleteMany({ code: /TEST|SC-DISCOUNT|PWD-DISCOUNT|MANUAL-TEST/ });
    await EligibilityVerification.deleteMany({});
    console.log('✅ Cleared existing test data');

    // Create users
    console.log('\n🔄 Creating test user accounts...');
    const createdUsers = {};

    for (const [key, accountData] of Object.entries(testAccounts)) {
      const hashedPassword = await bcrypt.hash(accountData.password, 10);
      
      const userData = {
        email: accountData.email,
        password: hashedPassword,
        username: accountData.username,
        role: accountData.role,
        phone: accountData.phone,
        isVerified: true
      };

      // Add customer profile for eligible customers
      if (accountData.eligibility) {
        userData.customerProfile = {
          isSeniorCitizen: accountData.eligibility.isSeniorCitizen || false,
          isPWD: accountData.eligibility.isPWD || false,
          scId: accountData.eligibility.scId || null,
          pwdId: accountData.eligibility.pwdId || null,
          scVerified: accountData.eligibility.verified || false,
          pwdVerified: accountData.eligibility.verified || false,
          verifiedAt: accountData.eligibility.verified ? new Date() : null
        };
        userData.discountPreferences = {
          useSCDiscount: true,
          usePWDDiscount: true
        };
      }

      const user = await User.create(userData);
      createdUsers[key] = user;
      console.log(`  ✅ Created: ${accountData.email} (${accountData.role})`);
    }

    // Create discounts
    console.log('\n🔄 Creating test discounts...');
    const createdDiscounts = [];

    for (const discountData of testDiscounts) {
      const discount = await Discount.create(discountData);
      createdDiscounts.push(discount);
      console.log(`  ✅ Created: ${discount.code} (${discount.description})`);
    }

    // Create sample eligibility verification records
    console.log('\n🔄 Creating sample eligibility verification records...');
    
    const verificationData = [
      {
        userId: createdUsers.customerSC._id,
        discountId: createdDiscounts[0]._id, // SC discount
        eligibilityType: 'SC',
        verificationStatus: 'pending',
        verificationMethod: 'manual',
        documentProof: null,
        notes: 'Awaiting admin verification',
        createdAt: new Date()
      },
      {
        userId: createdUsers.customerPWD._id,
        discountId: createdDiscounts[1]._id, // PWD discount
        eligibilityType: 'PWD',
        verificationStatus: 'pending',
        verificationMethod: 'manual',
        documentProof: null,
        notes: 'Awaiting admin verification',
        createdAt: new Date()
      },
      {
        userId: createdUsers.customerBoth._id,
        discountId: createdDiscounts[0]._id, // SC discount
        eligibilityType: 'SC',
        verificationStatus: 'pending',
        verificationMethod: 'manual',
        documentProof: null,
        notes: 'Awaiting admin verification',
        createdAt: new Date()
      }
    ];

    for (const verif of verificationData) {
      if (EligibilityVerification) {
        const verification = await EligibilityVerification.create(verif);
        console.log(`  ✅ Created verification record for ${verif.eligibilityType}`);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA SETUP COMPLETE');
    console.log('='.repeat(60));

    console.log('\n📋 TEST ACCOUNTS CREATED:');
    console.log('\nAdmin Account:');
    console.log(`  Email: ${testAccounts.admin.email}`);
    console.log(`  Password: ${testAccounts.admin.password}`);

    console.log('\nOwner Account:');
    console.log(`  Email: ${testAccounts.owner.email}`);
    console.log(`  Password: ${testAccounts.owner.password}`);

    console.log('\nCustomer Accounts:');
    console.log(`  SC: ${testAccounts.customerSC.email} / ${testAccounts.customerSC.password}`);
    console.log(`  PWD: ${testAccounts.customerPWD.email} / ${testAccounts.customerPWD.password}`);
    console.log(`  Both SC & PWD: ${testAccounts.customerBoth.email} / ${testAccounts.customerBoth.password}`);
    console.log(`  Normal: ${testAccounts.customerNormal.email} / ${testAccounts.customerNormal.password}`);

    console.log('\n💳 TEST DISCOUNTS CREATED:');
    for (const discount of createdDiscounts) {
      console.log(`  ${discount.code}: ${discount.description}`);
    }

    console.log('\n🚀 Ready for E2E Testing!');
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    process.exit(1);
  }
}

// Run setup
setupTestData();
