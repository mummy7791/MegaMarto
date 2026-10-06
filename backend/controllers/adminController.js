const Order = require("../models/Order");

/* ================= GET ALL ORDERS (ADMIN) ================= */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()\n      .populate("storeId", "storeName ownerName phone address")\n      .populate("deliveryBoy", "name phone bikeNumber")\n      .sort({ createdAt: -1 });

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
      "STORE_PENDING",\n      "STORE_ACCEPTED",\n      "STORE_CANCELLED",\n      "ASSIGNED",\n      "DELIVERY_ACCEPTED",\n      "PICKED_UP",\n      "OUT_FOR_DELIVERY",\n      "DELIVERED",
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
    order.status = status;\n    if (status === "STORE_ACCEPTED") order.storeStatus = "ACCEPTED";\n    if (status === "STORE_CANCELLED") order.storeStatus = "CANCELLED";\n    if (status === "DELIVERED" && order.paymentMethod === "COD") order.paymentStatus = "PAID";\n    await order.save();

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