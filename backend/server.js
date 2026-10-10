const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

/* ================= ROUTES ================= */
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const storeRoutes = require("./routes/storeRoutes");

/* ================= MODELS ================= */
const Product = require("./models/Product");
const User = require("./models/User");

const app = express();

/* ================= CORS ================= */
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "3mb" }));

/* ================= HTTP + SOCKET ================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});

/* ================= GLOBAL SOCKET ACCESS ================= */
global.io = io;

/* ================= RAZORPAY ================= */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ================= SOCKET CONNECTION ================= */
let activeUsers = 0;

io.on("connection", (socket) => {
  activeUsers++;

  console.log(`🟢 Socket connected | Active users: ${activeUsers}`);

  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`👤 User joined room: ${userId}`);
    }
  });

  socket.on("joinStore", (storeId) => {
    if (storeId) {
      socket.join(`store_${storeId}`);
      console.log(`🏪 Store joined room: store_${storeId}`);
    }
  });

  socket.on("joinDelivery", (deliveryBoyId) => {
    if (deliveryBoyId) {
      socket.join(`delivery_${deliveryBoyId}`);
      console.log(`🚴 Delivery boy joined room: delivery_${deliveryBoyId}`);
    }
  });

  socket.on("disconnect", () => {
    activeUsers = Math.max(activeUsers - 1, 0);
    console.log(`🔴 Socket disconnected | Active users: ${activeUsers}`);
  });
});

/* Admin bootstrap removed: provision admins securely outside the public API. */
/* ================= ROUTES ================= */
app.use("/", authRoutes);
app.use("/orders", orderRoutes);
app.use("/admin", adminRoutes);
app.use("/delivery", deliveryRoutes);
app.use("/store", storeRoutes);

/* ================= RAZORPAY PAYMENT ROUTES ================= */

// CREATE RAZORPAY ORDER
app.post("/payment/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    res.json(order);
  } catch (err) {
    console.log("RAZORPAY ORDER ERROR:", err);
    res.status(500).json({ message: "Payment order failed" });
  }
});

// VERIFY RAZORPAY PAYMENT
app.post("/payment/verify", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment details missing",
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
      });
    }

    res.status(400).json({
      success: false,
      message: "Payment verification failed",
    });
  } catch (err) {
    console.log("PAYMENT VERIFY ERROR:", err);
    res.status(500).json({ message: "Payment verification error" });
  }
});

/* ================= PRODUCTS ================= */

// GET PRODUCTS FOR USER WEBSITE
app.get("/products", async (req, res) => {
  try {
    const { search = "", category = "", featured = "" } = req.query;
    const filter = { isAvailable: true, stock: { $gt: 0 } };

    if (search) {
      const safeSearch = String(search)
        .slice(0, 80)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .populate("storeId", "storeName address phone")
      .sort({ featured: -1, createdAt: -1 })
      .limit(100);

    res.json(products);
  } catch (err) {
    console.log("PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isAvailable: true })
      .populate("storeId", "storeName address phone");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Invalid product" });
  }
});

// ADMIN DIRECT ADD PRODUCT
app.post("/products", auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.create({
      ...Object.fromEntries(Object.entries(req.body).filter(([key]) => ["name","price","mrp","unit","image","category","stock","description","isAvailable","featured","tags"].includes(key))),
      storeName: "Admin Store",
      storeId: null,
    });

    if (global.io) {
      global.io.emit("productAdded", product);
    }

    res.status(201).json(product);
  } catch (err) {
    console.log("ADD PRODUCT ERROR:", err);
    res.status(500).json({ message: "Failed to add product" });
  }
});

/* ================= HEALTH CHECK ================= */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "MegaMarto backend running",
    server: `http://localhost:${PORT}`,
    network: `http://YOUR_IPV4:${PORT}`,
  });
});

/* ================= ROOT ================= */
app.get("/api", (req, res) => {
  res.json({
    message: "MegaMarto API is running",
  });
});

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/megamarto")
  .then(() => console.log("✅ DB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💻 Local:   http://localhost:${PORT}`);
  console.log(`📱 Mobile:  http://10.132.250.130:${PORT}`);
});