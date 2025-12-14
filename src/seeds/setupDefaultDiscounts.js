/**
 * Seed Script: Create Default SC/PWD Discounts
 * 
 * Usage:
 * node src/seeds/setupDefaultDiscounts.js
 * 
 * This script creates default Senior Citizen (SC) and Person with Disability (PWD)
 * discounts in the database for the current year.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Discount = require('../models/discount');
const User = require('../models/user');

async function setupDefaultDiscounts() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickorder');
        console.log('Connected to MongoDB');

        // Get the first admin user to use as creator
        const admin = await User.findOne({ role: 'admin' });
        
        if (!admin) {
            console.error('Error: No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        console.log(`Using admin user: ${admin.email} as creator`);

        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const startDate = new Date(`${currentYear}-01-01`);
        const endDate = new Date(`${nextYear}-12-31`);

        // SC Discount Data
        const scDiscountCode = `SC-DISCOUNT-${nextYear}`;
        const scDiscount = {
            code: scDiscountCode,
            description: 'Senior Citizen Discount - 20% off on all orders',
            discountType: 'percentage',
            discountValue: 20,
            minOrderAmount: 0,
            maxDiscountAmount: null,
            maxUsagePerCustomer: null,
            maxTotalUsage: null,
            currentUsage: 0,
            isActive: true,
            startDate,
            endDate,
            isEligibilityBased: true,
            eligibilityType: 'SC',
            requiresVerification: false,
            createdBy: admin._id
        };

        // PWD Discount Data
        const pwdDiscountCode = `PWD-DISCOUNT-${nextYear}`;
        const pwdDiscount = {
            code: pwdDiscountCode,
            description: 'PWD Discount - 15% off on all orders',
            discountType: 'percentage',
            discountValue: 15,
            minOrderAmount: 0,
            maxDiscountAmount: null,
            maxUsagePerCustomer: null,
            maxTotalUsage: null,
            currentUsage: 0,
            isActive: true,
            startDate,
            endDate,
            isEligibilityBased: true,
            eligibilityType: 'PWD',
            requiresVerification: false,
            createdBy: admin._id
        };

        // Check if discounts already exist
        const existingSC = await Discount.findOne({ code: scDiscountCode });
        const existingPWD = await Discount.findOne({ code: pwdDiscountCode });

        if (existingSC) {
            console.log(`SC Discount already exists: ${scDiscountCode}`);
        } else {
            await Discount.create(scDiscount);
            console.log(`✅ Created SC Discount: ${scDiscountCode}`);
        }

        if (existingPWD) {
            console.log(`PWD Discount already exists: ${pwdDiscountCode}`);
        } else {
            await Discount.create(pwdDiscount);
            console.log(`✅ Created PWD Discount: ${pwdDiscountCode}`);
        }

        console.log('\n✅ Default SC/PWD discounts setup completed!');
        console.log(`SC Discount: ${scDiscount.discountValue}% off`);
        console.log(`PWD Discount: ${pwdDiscount.discountValue}% off`);
        console.log(`Valid from: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);

        process.exit(0);
    } catch (error) {
        console.error('Error setting up discounts:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

// Run the script
setupDefaultDiscounts();
