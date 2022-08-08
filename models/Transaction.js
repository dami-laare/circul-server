const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  dateInitialized: {
    type: Date,
    default: new Date(Date.now()),
  },
  status: {
    type: String,
    default: "processing",
    enum: ["processing", "success", "failed"],
  },
  ref: String,
  fan: {
    nickname: {
      type: String,
      default: "anonymous",
    },
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: "creator",
  },
});

module.exports = mongoose.model("transaction", transactionSchema);
