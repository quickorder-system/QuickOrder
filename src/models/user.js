const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    role: {
        type: String,
        enum: ['admin', 'owner', 'customer'],
        default: 'customer'
    },
    // Email verification fields
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationTokenExpiry: {
        type: Date,
        default: null
    },
    // Password reset fields
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetTokenExpiry: {
        type: Date,
        default: null
    },
    // Customer profile fields
    phone: {
        type: String,
        default: null
    },
    // Primary address (legacy support)
    address: {
        street: String,
        city: String,
        postalCode: String,
        phone: String
    },
    // Multiple delivery addresses
    addresses: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new mongoose.Types.ObjectId()
        },
        label: {
            type: String,
            enum: ['home', 'work', 'other'],
            default: 'home'
        },
        street: String,
        city: String,
        postalCode: String,
        phone: String,
        isDefault: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    preferences: {
        notifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        marketingEmails: {
            type: Boolean,
            default: true
        }
    },
    // Customer eligibility for automatic discounts
    customerProfile: {
        isSeniorCitizen: {
            type: Boolean,
            default: false
        },
        isPWD: {
            type: Boolean,
            default: false
        },
        scId: {
            type: String,
            default: null
        },
        pwdId: {
            type: String,
            default: null
        },
        scVerified: {
            type: Boolean,
            default: false
        },
        pwdVerified: {
            type: Boolean,
            default: false
        },
        verifiedAt: {
            type: Date,
            default: null
        }
    },
    // Customer preferences for discount usage
    discountPreferences: {
        useSCDiscount: {
            type: Boolean,
            default: true
        },
        usePWDDiscount: {
            type: Boolean,
            default: true
        }
    },
    lastLogin: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
