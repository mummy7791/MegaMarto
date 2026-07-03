const mongoose = require("mongoose");

/* ================= ORDER ITEM ================= */
const orderItemSchema = new mongoose.Schema(
  {
    productId: String,

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    qty: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      type: String,
      default: "",
    },

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },
  },
  { _id: false }
);

/* ================= ADDRESS ================= */
const addressSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    city: String,
    street: String,
    pincode: String,
  },
  { _id: false }
);

/* ================= LOCATION ================= */
const locationSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    accuracy: Number,
  },
  { _id: false }
);

/* ================= ORDER ================= */
const orderSchema = new mongoose.Schema(
  {
    items: {
      type: [orderItemSchema],
      default: [],
    },

    total: {
      type: Number,
      required: true,
    },

    address: {
      type: addressSchema,
      required: true,
    },

    userId: {
      type: String,
      required: true,
    },

    /* 🏪 STORE DETAILS */
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },

    storeName: {
      type: String,
      default: "",
    },

    storeStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "CANCELLED"],
      default: "PENDING",
    },

    /* 💰 SETTLEMENT */
    commissionPercent: {
      type: Number,
      default: 10,
    },

    adminCommission: {
      type: Number,
      default: 0,
    },

    storeAmount: {
      type: Number,
      default: 0,
    },

    settlementStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },

    settledAt: {
      type: Date,
      default: null,
    },

    /* 🌍 USER LOCATION */
    location: {
      type: locationSchema,
      default: null,
    },

    /* 🚴 DELIVERY BOY */
    deliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null,
    },

    /* 💳 PAYMENT */
    paymentMethod: {
      type: String,
      enum: ["COD", "RAZORPAY"],
      default: "COD",
    },

    paymentId: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    /* 📦 COMPLETE ORDER FLOW */
    status: {
      type: String,
      enum: [
        "PLACED",
        "STORE_PENDING",
        "STORE_ACCEPTED",
        "STORE_CANCELLED",
        "ASSIGNED",
        "DELIVERY_ACCEPTED",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ],
      default: "PLACED",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);