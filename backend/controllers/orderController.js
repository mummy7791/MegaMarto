const Order = require("../models/Order");

/* ================= PLACE ORDER ================= */
exports.placeOrder = async (req, res) => {
  try {
    const { items, total, address, location } = req.body; // ✅ ADDED

    if (!items || !total || !address) {
      return res.status(400).json({
        message: "Missing order data",
      });
    }

    const order = await Order.create({
      items,
      total,
      address,
      location, // ✅ SAVE LOCATION
      userId: req.user.id,
      status: "PLACED",
    });

    res.status(201).json(order);
  } catch (err) {
    console.log("PLACE ORDER ERROR:", err);
    res.status(500).json({ message: "Order failed" });
  }
};

/* ================= GET USER ORDERS ================= */
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (err) {
    console.log("GET ORDERS ERROR:", err);
    res.status(500).json({ message: "Error fetching orders" });
  }
};

/* ================= GET SINGLE ORDER (TRACK ORDER) ================= */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔐 SECURITY
    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    console.log("TRACK ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};