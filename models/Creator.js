const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const creatorSchema = new mongoose.Schema({
  email: {
    type: String,
    // required: true,
    // unique: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    // required: true,
    select: false,
  },
  username: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  bio: String,
  location: {
    type: String,
    default: "",
  },
  website: {
    type: String,
    default: "",
    trim: true,
  },
  bank_details: {},
  profileComplete: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  token: String,
  firstSignUp: {
    type: Boolean,
    default: true,
  },
  twitterData: {},
  messages: [
    {
      text: String,
      dateCreated: {
        type: Date,
        default: new Date(Date.now()),
      },
      read: {
        type: Boolean,
        default: false,
      },
      transaction: {
        type: mongoose.Schema.ObjectId,
        ref: "transaction",
      },
    },
  ],
  transactions: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "transaction",
    },
  ],
  analytics: {
    page_views: [
      {
        user_agent: String,
        date: {
          type: Date,
          default: new Date(Date.now()),
        },
      },
    ],
    shares: [
      {
        user_agent: String,
        date: {
          type: Date,
          default: new Date(Date.now()),
        },
      },
    ],
  },
  total_earnings: {
    type: Number,
    default: 0,
  },
});

creatorSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 15);
  }
});

creatorSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

creatorSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  });
};

// Generate reset password token
creatorSchema.methods.getResetPasswordToken = async function () {
  // Generate token
  const resetToken = await crypto.randomBytes(20).toString("hex");

  // Hash and set to resetPasswordToken
  this.resetPasswordToken = await crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set resetPasswordExpire
  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("creator", creatorSchema);
