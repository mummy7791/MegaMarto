const mongoose = require("mongoose");

const deliveryBoySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  phone: {
    type: String,
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

  bikeNumber: {
    type: String,
    required: true,
  },

  username: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true, // hashed password
  },

  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("DeliveryBoy", deliveryBoySchema);