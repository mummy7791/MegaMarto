const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const Order = require("../models/Order");
const Product = require("../models/Product");

const Store = require("../models/Store");
const MAX_KM = 30;
const validGPS = p => p && p.lat != null && p.lng != null && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) && Math.abs(Number(p.lat)) <= 90 && Math.abs(Number(p.lng)) <= 180;
function kilometers(a,b) {
 const rad = Math.PI/180, dLat = (b.lat-a.lat)*rad, dLng = (b.lng-a.lng)*rad;
 const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLng/2)**2;
 return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));
}
function calculateDelivery(store,location,amount) {
 if(!validGPS(location)) throw Object.assign(new Error("Allow accurate customer GPS before ordering"),{status:400});
 if(!validGPS(store?.location)) throw Object.assign(new Error("Store pickup GPS not configured"),{status:409});
 const km=kilometers(store.location,location);
 if(km>Math.min(MAX_KM,Number(store.deliveryRadiusKm)||MAX_KM)) throw Object.assign(new Error("Delivery unavailable beyond 30 km. Shop distance: "+km.toFixed(1)+" km"),{status:422});
 return {distanceKm:Math.round(km*10)/10,etaMinutes:Math.ceil(15+km/18*60),deliveryFee:amount>=499?0:25+5*Math.ceil(km/2)};
}


/* ================= CONTROLLERS ================= */
const orderController = require("../controllers/orderController");

const getUserOrders = orderController.getUserOrders;
const getOrderById = orderController.getOrderById;

/* =====================================================
   AUTHORITATIVE CART QUOTE
   URL: POST /orders/quote
===================================================== */
router.post("/quote", auth, async (req, res) => {
  try {
    const { items, location } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Cart items required" });
    }

    const requested = new Map();
    for (const item of items) {
      const id = String(item.productId || "");
      const qty = Number(item.qty);
      if (!/^[a-f0-9]{24}$/i.test(id) || !Number.isSafeInteger(qty) || qty < 1 || qty > 100) return res.status(400).json({ message: "Invalid product or quantity" });
      requested.set(id, (requested.get(id) || 0) + qty);
      if (requested.get(id) > 100) return res.status(400).json({ message: "Maximum 100 units per product" });
    }
    const ids = [...requested.keys()];
    const products = await Product.find({ _id: { $in: ids }, isAvailable: true })
      .populate("storeId", "storeName location deliveryRadiusKm");

    if (products.length !== ids.length) {
      return res.status(400).json({ message: "One or more products are unavailable" });
    }

    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const groups = new Map();

    for (const [id, qty] of requested) {
      const product = productMap.get(id);

      if (!product || product.stock < qty) {
        return res.status(409).json({
          message: (product?.name || "Product") + " has only " + (product?.stock || 0) + " left",
        });
      }

      const storeId = product.storeId?._id || product.storeId || null;
      const key = storeId ? String(storeId) : "admin";
      if (!groups.has(key)) {
        groups.set(key, {
          storeId,
          storeName: product.storeId?.storeName || product.storeName || "MegaMarto",
          itemTotal: 0,
        });
      }
      groups.get(key).itemTotal += Number(product.price) * qty;
    }

    const shops = [...groups.values()].map((group) => {
      const store = group.storeId ? products.find(p=>String(p.storeId?._id || p.storeId)===String(group.storeId))?.storeId : null;
      const {deliveryFee,distanceKm,etaMinutes}=calculateDelivery(store,location,group.itemTotal);
      const handlingFee = 5;
      const commissionPercent = group.storeId ? 10 : 0;
      const adminCommission = Math.round((group.itemTotal * commissionPercent) / 100);
      const storeAmount = group.itemTotal - adminCommission;
      return {
        storeId: group.storeId,
        storeName: group.storeName,
        itemTotal: group.itemTotal,
        deliveryFee,
        distanceKm,
        etaMinutes,
        handlingFee,
        commissionPercent,
        adminCommission,
        storeAmount,
        total: group.itemTotal + deliveryFee + handlingFee,
      };
    });

    const pricing = shops.reduce(
      (acc, shop) => ({
        itemTotal: acc.itemTotal + shop.itemTotal,
        deliveryFee: acc.deliveryFee + shop.deliveryFee,
        handlingFee: acc.handlingFee + shop.handlingFee,
        total: acc.total + shop.total,
      }),
      { itemTotal: 0, deliveryFee: 0, handlingFee: 0, total: 0 }
    );

    res.json({ shopCount: shops.length, shops, pricing });
  } catch (err) {
    console.log("ORDER QUOTE ERROR:", err);
    res.status(err.status || 500).json({ message: err.status ? err.message : "Unable to calculate checkout total" });
  }
});

/* =====================================================
   ✅ PLACE ORDER
   URL: POST /orders
===================================================== */
router.post("/", auth, async (req, res) => {
  try {
    const { items, address, location, paymentMethod, paymentStatus, paymentId } = req.body;
    if (!["COD", "RAZORPAY"].includes(paymentMethod)) return res.status(400).json({ message: "Invalid payment method" });
    if (paymentMethod === "COD" && (paymentStatus === "PAID" || paymentId)) return res.status(400).json({ message: "COD cannot be marked paid in checkout" });
    
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Cart items required" });
    if (!address?.name || !address?.phone || !address?.street || !address?.city || !address?.pincode) return res.status(400).json({ message: "Complete delivery address required" });

    const requested = new Map();
    for (const item of items) {
      const id = String(item.productId || "");
      const qty = Number(item.qty);
      if (!/^[a-f0-9]{24}$/i.test(id) || !Number.isSafeInteger(qty) || qty < 1 || qty > 100) return res.status(400).json({ message: "Invalid product or quantity" });
      requested.set(id, (requested.get(id) || 0) + qty);
      if (requested.get(id) > 100) return res.status(400).json({ message: "Maximum 100 units per product" });
    }
    const ids = [...requested.keys()];
    const products = await Product.find({ _id: { $in: ids }, isAvailable: true }).populate("storeId", "storeName location deliveryRadiusKm");
    if (products.length !== ids.length) return res.status(400).json({ message: "One or more products are unavailable" });

    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const groups = new Map();

    for (const [id, qty] of requested) {
      const product = productMap.get(id);
      if (!product || product.stock < qty) return res.status(409).json({ message: (product?.name || "Product") + " has only " + (product?.stock || 0) + " left" });

      const storeId = product.storeId?._id || product.storeId || null;
      const storeKey = storeId ? String(storeId) : "admin";
      const storeName = product.storeId?.storeName || product.storeName || "MegaMarto";
      if (!groups.has(storeKey)) groups.set(storeKey, { storeId, storeName, items: [], itemTotal: 0 });

      const group = groups.get(storeKey);
      group.items.push({ productId: String(product._id), name: product.name, price: product.price, qty, image: product.image, storeId });
      group.itemTotal += product.price * qty;
    }

    for(const group of groups.values()) {
      const store = group.storeId ? await Store.findById(group.storeId).select("location deliveryRadiusKm") : null;
      group.delivery = calculateDelivery(store,location,group.itemTotal);
    }
    const reserved = [];
    try {
      for (const [id, qty] of requested) {
        const updated = await Product.findOneAndUpdate({ _id: id, isAvailable: true, stock: { $gte: qty } }, { $inc: { stock: -qty } }, { new: true });
        if (!updated) throw Object.assign(new Error("Product stock changed. Refresh cart and try again."), { status: 409 });
        reserved.push({ id, qty });
      }
    } catch (error) {
      for (const item of reserved) await Product.updateOne({ _id: item.id }, { $inc: { stock: item.qty } });
      return res.status(error.status || 500).json({ message: error.message || "Stock reservation failed" });
    }
    const createdOrders = [];
    try {
    for (const group of groups.values()) {
      const {deliveryFee,distanceKm,etaMinutes}=group.delivery;
      const handlingFee = 5;
      const calculatedTotal = group.itemTotal + deliveryFee + handlingFee;
      const commissionPercent = group.storeId ? 10 : 0;
      const adminCommission = Math.round((group.itemTotal * commissionPercent) / 100);
      const storeAmount = group.itemTotal - adminCommission;
      const order = await Order.create({
        items: group.items, total: calculatedTotal, address, location, userId: req.user.id,
        distanceKm, etaMinutes, deliveryFee, handlingFee,
        storeId: group.storeId, storeName: group.storeName, storeStatus: "PENDING",
        commissionPercent, adminCommission, storeAmount, settlementStatus: "PENDING",
        status: group.storeId ? "STORE_PENDING" : "PLACED",
        paymentMethod, paymentStatus: paymentMethod === "COD" ? "PENDING" : (paymentStatus || "PENDING"), paymentId: paymentMethod === "COD" ? "" : (paymentId || ""),
      });
      createdOrders.push(order);
    }

    } catch (error) {
      await Order.deleteMany({ _id: { $in: createdOrders.map(order => order._id) } });
      for (const item of reserved) await Product.updateOne({ _id: item.id }, { $inc: { stock: item.qty } });
      throw error;
    }

    if (global.io) {
      for (const order of createdOrders) {
        // Broadcast only order identifiers: clients fetch role-authorized details from API.
        global.io.emit("orderPlaced", { _id: order._id });
        global.io.emit("orderUpdated", { _id: order._id });
        if (order.storeId) global.io.to("store_" + order.storeId).emit("newStoreOrder", { _id: order._id });
      }
      global.io.emit("inventoryUpdated", { productIds: ids });
    }

    const pricing = createdOrders.reduce((acc, order) => {
      acc.total += order.total;
      return acc;
    }, { total: 0 });

    res.status(201).json({
      message: createdOrders.length > 1 ? `Order placed successfully across ${createdOrders.length} shops` : "Order placed successfully",
      order: createdOrders[0],
      orders: createdOrders,
      orderCount: createdOrders.length,
      pricing,
    });
  } catch (err) {
    console.log("PLACE ORDER ERROR:", err);
    res.status(err.status || 500).json({ message: err.status ? err.message : "Server error" });
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

    const allowedStatus = ["STORE_ACCEPTED", "STORE_CANCELLED"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "STORE_PENDING") return res.status(409).json({ message: "Only pending shop orders can be updated here" });

    order.status = status;

    if (status === "STORE_ACCEPTED") {
      order.storeStatus = "ACCEPTED";
    }

    if (status === "STORE_CANCELLED") {
      order.storeStatus = "CANCELLED";
    }

    await order.save();
    if (status === "STORE_CANCELLED") {
      for (const item of order.items) await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.qty } });
      if (global.io) global.io.emit("inventoryUpdated", { productIds: order.items.map(item => item.productId) });
    }

    if (global.io) {
      global.io.emit("orderUpdated", { _id: order._id });

      if (status === "STORE_ACCEPTED") {
        global.io.emit("storeAcceptedOrder", { _id: order._id });
      }

      if (status === "OUT_FOR_DELIVERY") {
        global.io.emit("outForDelivery", { _id: order._id });
      }

      if (status === "DELIVERED") {
        global.io.emit("orderDelivered", { _id: order._id });
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