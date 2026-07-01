const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      type: String,
      default: "https://via.placeholder.com/150",
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Fruits",
        "Dairy",
        "Snacks",
        "Grocery",
        "Cafe",
        "Home",
        "Toys",
        "Fresh",
        "Electronics",
        "Mobiles",
        "Beauty",
        "Fashion",
      ],
    },

    stock: {
      type: Number,
      default: 10,
    },

    description: {
      type: String,
      default: "",
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },

    storeName: {
      type: String,
      default: "Admin Store",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);