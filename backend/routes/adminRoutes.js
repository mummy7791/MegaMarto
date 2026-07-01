const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const bcrypt = require("bcryptjs");

const {
  getAllOrders,
  updateOrder,
} = require("../controllers/adminController");

const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const DeliveryBoy = require("../models/DeliveryBoy");
const Store = require("../models/Store");

/* =======================================================
   📦 ORDERS
======================================================= */
router.get("/orders", auth, adminOnly, getAllOrders);
router.put("/orders/:id", auth, adminOnly, updateOrder);

/* =======================================================
   📊 STATS
======================================================= */
router.get("/stats", auth, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find();
    const users = await User.find();
    const products = await Product.find();
    const stores = await Store.find();
    const deliveryBoys = await DeliveryBoy.find();

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    res.json({
      orders: orders.length,
      users: users.length,
      products: products.length,
      stores: stores.length,
      deliveryBoys: deliveryBoys.length,
      totalRevenue,
    });
  } catch (err) {
    console.log("STATS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🏪 CREATE STORE
======================================================= */
router.post("/stores", auth, adminOnly, async (req, res) => {
  try {
    const { storeName, ownerName, email, password, phone, address } = req.body;

    if (!storeName || !ownerName || !email || !password || !phone || !address) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await Store.findOne({ email });

    if (exists) {
      return res.status(400).json({ message: "Store email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const store = await Store.create({
      storeName,
      ownerName,
      email,
      password: hashed,
      phone,
      address,
      role: "store",
      status: "active",
    });

    res.status(201).json({
      message: "Store created successfully",
      store: {
        _id: store._id,
        storeName: store.storeName,
        ownerName: store.ownerName,
        email: store.email,
        phone: store.phone,
        address: store.address,
        status: store.status,
        role: store.role,
      },
    });
  } catch (err) {
    console.log("CREATE STORE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🏪 GET ALL STORES
======================================================= */
router.get("/stores", auth, adminOnly, async (req, res) => {
  try {
    const stores = await Store.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(stores);
  } catch (err) {
    console.log("GET STORES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🏪 UPDATE STORE
======================================================= */
router.put("/stores/:id", auth, adminOnly, async (req, res) => {
  try {
    const { storeName, ownerName, email, password, phone, address, status } =
      req.body;

    const updateData = {
      storeName,
      ownerName,
      email,
      phone,
      address,
      status,
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined || updateData[key] === "") {
        delete updateData[key];
      }
    });

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const store = await Store.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select("-password");

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({
      message: "Store updated successfully",
      store,
    });
  } catch (err) {
    console.log("UPDATE STORE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🏪 DELETE STORE
======================================================= */
router.delete("/stores/:id", auth, adminOnly, async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    await Product.deleteMany({ storeId: req.params.id });

    res.json({ message: "Store and store products deleted successfully" });
  } catch (err) {
    console.log("DELETE STORE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🏪 GET STORE PRODUCTS FOR ADMIN
======================================================= */
router.get("/stores/:id/products", auth, adminOnly, async (req, res) => {
  try {
    const products = await Product.find({ storeId: req.params.id }).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (err) {
    console.log("STORE PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   📦 ADMIN UPDATE ANY PRODUCT
======================================================= */
router.put("/products/:id", auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (global.io) {
      global.io.emit("productUpdated", product);
    }

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    console.log("ADMIN PRODUCT UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   📦 ADMIN DELETE ANY PRODUCT
======================================================= */
router.delete("/products/:id", auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (global.io) {
      global.io.emit("productDeleted", product);
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.log("ADMIN PRODUCT DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🚴 CREATE DELIVERY BOY
======================================================= */
router.post("/delivery-boys", auth, adminOnly, async (req, res) => {
  try {
    const { name, phone, address, bikeNumber, username, password } = req.body;

    if (!name || !phone || !username || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await DeliveryBoy.findOne({ username });

    if (exists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const boy = await DeliveryBoy.create({
      name,
      phone,
      address,
      bikeNumber,
      username,
      password: hashed,
      status: "active",
    });

    res.status(201).json({
      message: "Delivery boy created successfully",
      boy,
    });
  } catch (err) {
    console.log("CREATE DELIVERY BOY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🚴 GET ALL DELIVERY BOYS
======================================================= */
router.get("/delivery-boys", auth, adminOnly, async (req, res) => {
  try {
    const boys = await DeliveryBoy.find().select("-password");
    res.json(boys);
  } catch (err) {
    console.log("GET DELIVERY BOYS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   ✏️ UPDATE DELIVERY BOY
======================================================= */
router.put("/delivery-boys/:id", auth, adminOnly, async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const boy = await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select("-password");

    if (!boy) {
      return res.status(404).json({ message: "Delivery boy not found" });
    }

    res.json({ message: "Updated successfully", boy });
  } catch (err) {
    console.log("UPDATE DELIVERY BOY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   ❌ DELETE DELIVERY BOY
======================================================= */
router.delete("/delivery-boys/:id", auth, adminOnly, async (req, res) => {
  try {
    const boy = await DeliveryBoy.findByIdAndDelete(req.params.id);

    if (!boy) {
      return res.status(404).json({ message: "Delivery boy not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.log("DELETE DELIVERY BOY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🚚 ASSIGN ORDER
======================================================= */
router.put("/assign-order/:orderId", auth, adminOnly, async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.deliveryBoy = deliveryBoyId;
    order.status = "ASSIGNED";

    await order.save();

    if (global.io) {
      global.io.emit("orderAssigned", order);
    }

    res.json({ message: "Order assigned successfully", order });
  } catch (err) {
    console.log("ASSIGN ORDER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🚴 DELIVERY BOY ORDERS
======================================================= */
router.get("/delivery/my-orders", auth, async (req, res) => {
  try {
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const orders = await Order.find({
      deliveryBoy: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.log("DELIVERY ORDERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🚴 UPDATE DELIVERY STATUS
======================================================= */
router.put("/delivery-status/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "ASSIGNED",
      "DELIVERY_ACCEPTED",
      "PICKED_UP",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid delivery status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    if (global.io) {
      global.io.emit("orderUpdated", order);
    }

    res.json({ message: "Updated successfully", order });
  } catch (err) {
    console.log("DELIVERY STATUS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;