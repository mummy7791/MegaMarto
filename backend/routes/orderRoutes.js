const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const Order = require("../models/Order");
const Product = require("../models/Product");

/* ================= CONTROLLERS ================= */
const orderController = require("../controllers/orderController");

const getUserOrders = orderController.getUserOrders;
const getOrderById = orderController.getOrderById;

/* =====================================================
   ✅ PLACE ORDER
   URL: POST /orders
===================================================== */
router.post("/", auth, async (req, res) => {
  try {
    const { items, address, location, paymentMethod, paymentStatus, paymentId } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Cart items required" });
    if (!address?.name || !address?.phone || !address?.street || !address?.city || !address?.pincode) return res.status(400).json({ message: "Complete delivery address required" });

    const ids = [...new Set(items.map((item) => String(item.productId || "")).filter(Boolean))];
    const products = await Product.find({ _id: { $in: ids }, isAvailable: true }).populate("storeId", "storeName");
    if (products.length !== ids.length) return res.status(400).json({ message: "One or more products are unavailable" });

    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const safeItems = [];
    let itemTotal = 0;
    for (const item of items) {
      const product = productMap.get(String(item.productId));
      const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
      if (!product || product.stock < qty) return res.status(409).json({ message: (product?.name || "Product") + " has only " + (product?.stock || 0) + " left" });
      safeItems.push({ productId: String(product._id), name: product.name, price: product.price, qty, image: product.image, storeId: product.storeId?._id || product.storeId || null });
      itemTotal += product.price * qty;
    }

    const firstProduct = productMap.get(String(items[0].productId));
    const storeId = firstProduct?.storeId?._id || firstProduct?.storeId || null;
    const storeName = firstProduct?.storeId?.storeName || firstProduct?.storeName || "";
    const deliveryFee = itemTotal >= 499 ? 0 : 35;
    const handlingFee = 5;
    const calculatedTotal = itemTotal + deliveryFee + handlingFee;

    const order = await Order.create({
      items: safeItems, total: calculatedTotal, address, location, userId: req.user.id,
      storeId, storeName, storeStatus: "PENDING", status: storeId ? "STORE_PENDING" : "PLACED",
      paymentMethod: paymentMethod || "COD", paymentStatus: paymentStatus || "PENDING", paymentId: paymentId || "",
    });

    for (const item of safeItems) await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });

    if (global.io) {
      global.io.emit("orderPlaced", order);
      global.io.emit("orderUpdated", order);
      global.io.emit("inventoryUpdated", { productIds: safeItems.map((i) => i.productId) });
      if (storeId) global.io.to("store_" + storeId).emit("newStoreOrder", order);
    }
    res.status(201).json({ message: "Order placed successfully", order, pricing: { itemTotal, deliveryFee, handlingFee, total: calculatedTotal } });
  } catch (err) {
    console.log("PLACE ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   USER ORDERS
===================================================== */
router.get("/", auth, async (req, res, next) => {
  try {
    if (getUserOrders) {
      return getUserOrders(req, res, next);
    }

    const orders = await Order.find({ userId: req.user.id })
      .populate("storeId", "storeName address phone")
      .populate("deliveryBoy", "name phone bikeNumber")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.log("GET USER ORDERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   ✅ ADMIN GET ALL ORDERS
   URL: GET /orders/admin/all
===================================================== */
router.get("/admin/all", auth, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("storeId", "storeName address phone")
      .populate("deliveryBoy", "name phone bikeNumber")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.log("ADMIN GET ORDERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   ✅ ADMIN UPDATE ORDER STATUS
   URL: PUT /orders/:id/status
===================================================== */
router.put("/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatus = [
      "PLACED",
      "STORE_PENDING",
      "STORE_ACCEPTED",
      "STORE_CANCELLED",
      "ASSIGNED",
      "DELIVERY_ACCEPTED",
      "PICKED_UP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;

    if (status === "STORE_ACCEPTED") {
      order.storeStatus = "ACCEPTED";
    }

    if (status === "STORE_CANCELLED") {
      order.storeStatus = "CANCELLED";
    }

    await order.save();

    if (global.io) {
      global.io.emit("orderUpdated", order);

      if (status === "STORE_ACCEPTED") {
        global.io.emit("storeAcceptedOrder", order);
      }

      if (status === "OUT_FOR_DELIVERY") {
        global.io.emit("outForDelivery", order);
      }

      if (status === "DELIVERED") {
        global.io.emit("orderDelivered", order);
      }
    }

    res.json({
      message: "Status updated successfully",
      order,
    });
  } catch (err) {
    console.log("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =====================================================
   ✅ SINGLE ORDER
   URL: GET /orders/:id
   IMPORTANT: keep this at bottom
===================================================== */
router.get("/:id", auth, async (req, res, next) => {
  try {
    if (getOrderById) {
      return getOrderById(req, res, next);
    }

    const query = {
      _id: req.params.id,
    };

    if (req.user.role !== "admin") {
      query.userId = req.user.id;
    }

    const order = await Order.findOne(query)
      .populate("storeId", "storeName address phone")
      .populate("deliveryBoy", "name phone bikeNumber");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.log("GET ORDER BY ID ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;