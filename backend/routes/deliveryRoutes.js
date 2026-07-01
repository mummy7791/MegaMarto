const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const DeliveryBoy = require("../models/DeliveryBoy");
const Order = require("../models/Order");

const JWT_SECRET = process.env.JWT_SECRET || "megamarto_secret_123";

/* =========================================
   🚴 DELIVERY BOY LOGIN
========================================= */
router.post("/delivery-login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const boy = await DeliveryBoy.findOne({ username });

    if (!boy) {
      return res.status(400).json({ message: "Delivery boy not found" });
    }

    const match = await bcrypt.compare(password, boy.password);

    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: boy._id, role: "delivery" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      boy: {
        _id: boy._id,
        name: boy.name,
        phone: boy.phone,
        username: boy.username,
        bikeNumber: boy.bikeNumber,
      },
    });
  } catch (err) {
    console.log("DELIVERY LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   🚚 AVAILABLE ORDERS FOR ALL DELIVERY BOYS
   Store accepted but not taken yet
========================================= */
router.get("/available-orders", auth, async (req, res) => {
  try {
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Delivery only access" });
    }

    const orders = await Order.find({
      status: "STORE_ACCEPTED",
      deliveryBoy: null,
    })
      .populate("storeId", "storeName address phone location")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.log("AVAILABLE ORDERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   ✅ DELIVERY BOY ACCEPT ORDER
   First accepted delivery boy gets the order
========================================= */
router.put("/accept-order/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Delivery only access" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      status: "STORE_ACCEPTED",
      deliveryBoy: null,
    });

    if (!order) {
      return res.status(400).json({
        message: "Order already accepted by another delivery boy",
      });
    }

    order.deliveryBoy = req.user.id;
    order.status = "DELIVERY_ACCEPTED";

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("storeId", "storeName address phone location")
      .populate("deliveryBoy", "name phone bikeNumber");

    if (global.io) {
      global.io.emit("orderUpdated", updatedOrder);
      global.io.emit("deliveryAcceptedOrder", updatedOrder);
      global.io.emit("orderTaken", updatedOrder);
      global.io
        .to(`delivery_${req.user.id}`)
        .emit("myDeliveryOrder", updatedOrder);
    }

    res.json({
      message: "Order accepted successfully",
      order: updatedOrder,
    });
  } catch (err) {
    console.log("ACCEPT ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   🚚 DELIVERY BOY: MY ORDERS
========================================= */
router.get("/my-orders", auth, async (req, res) => {
  try {
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const orders = await Order.find({
      deliveryBoy: req.user.id,
    })
      .populate("storeId", "storeName address phone location")
      .populate("deliveryBoy", "name phone bikeNumber")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.log("MY ORDERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   📦 DELIVERY BOY: UPDATE STATUS
========================================= */
router.put("/delivery-status/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Delivery only access" });
    }

    const { status } = req.body;

    const allowedStatus = [
      "PICKED_UP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid delivery status" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      deliveryBoy: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("storeId", "storeName address phone location")
      .populate("deliveryBoy", "name phone bikeNumber");

    if (global.io) {
      global.io.emit("orderUpdated", updatedOrder);

      if (status === "PICKED_UP") {
        global.io.emit("orderPickedUp", updatedOrder);
      }

      if (status === "OUT_FOR_DELIVERY") {
        global.io.emit("outForDelivery", updatedOrder);
      }

      if (status === "DELIVERED") {
        global.io.emit("orderDelivered", updatedOrder);
      }
    }

    res.json({
      message: "Updated successfully",
      order: updatedOrder,
    });
  } catch (err) {
    console.log("DELIVERY STATUS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   👑 ADMIN: ASSIGN ORDER
========================================= */
router.put("/assign-order/:orderId", auth, adminOnly, async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.deliveryBoy = deliveryBoyId;
    order.status = "DELIVERY_ACCEPTED";

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("storeId", "storeName address phone location")
      .populate("deliveryBoy", "name phone bikeNumber");

    if (global.io) {
      global.io.emit("orderUpdated", updatedOrder);
      global.io.emit("deliveryAcceptedOrder", updatedOrder);
    }

    res.json({
      message: "Order assigned successfully",
      order: updatedOrder,
    });
  } catch (err) {
    console.log("ADMIN ASSIGN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================================
   👑 ADMIN: GET DELIVERY BOYS
========================================= */
router.get("/delivery-boys", auth, adminOnly, async (req, res) => {
  try {
    const boys = await DeliveryBoy.find().select("-password");
    res.json(boys);
  } catch (err) {
    console.log("GET DELIVERY BOYS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;