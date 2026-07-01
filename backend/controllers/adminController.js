const Order = require("../models/Order");

/* ================= GET ALL ORDERS (ADMIN) ================= */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (err) {
    console.log("GET ORDERS ERROR:", err.message);

    return res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
};

/* ================= UPDATE ORDER STATUS (ADMIN) ================= */
exports.updateOrder = async (req, res) => {
  try {
    const { status } = req.body;

    /* ✅ VALID STATUS CHECK */
    const validStatuses = [
      "PLACED",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    /* ✅ FIND ORDER */
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    /* ✅ UPDATE */
    order.status = status;
    await order.save();

    /* 🔥 REAL-TIME UPDATE (Socket.io) */
    if (global.io) {
      global.io.emit("orderUpdated", order);
    }

    /* ✅ RESPONSE */
    return res.status(200).json({
      message: "Order updated successfully",
      order,
    });

  } catch (err) {
    console.log("UPDATE ORDER ERROR:", err.message);

    return res.status(500).json({
      message: "Server error",
    });
  }
};