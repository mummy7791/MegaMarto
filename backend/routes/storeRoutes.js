const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Store = require("../models/Store");
const Product = require("../models/Product");
const Order = require("../models/Order");
const auth = require("../middleware/auth");

function storeOrderView(order) {
 const o=order.toObject ? order.toObject() : {...order};
 const itemTotal=(o.items||[]).reduce((sum,item)=>sum+Number(item.price||0)*Number(item.qty||0),0);
 // Store sees merchandise value only, not customer delivery fees or platform charges.
 delete o.total; delete o.deliveryFee; delete o.handlingFee; delete o.adminCommission;
 delete o.commissionPercent; delete o.storeAmount; delete o.settlementStatus; delete o.settledAt;
 return {...o, merchandiseTotal:itemTotal};
}



router.get("/nearby", async (req,res) => {
 try {
  const lat=Number(req.query.lat), lng=Number(req.query.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180) return res.status(400).json({message:"Valid customer GPS required"});
  const rad=Math.PI/180;
  const shops=await Store.find({status:"active"}).select("storeName address location deliveryRadiusKm").lean();
  const nearby=shops.flatMap(shop=>{
   const point=shop.location;
   if(!point||!Number.isFinite(point.lat)||!Number.isFinite(point.lng)) return [];
   const h=Math.sin((point.lat-lat)*rad/2)**2+Math.cos(lat*rad)*Math.cos(point.lat*rad)*Math.sin((point.lng-lng)*rad/2)**2;
   const distanceKm=6371*2*Math.asin(Math.min(1,Math.sqrt(h)));
   if(distanceKm>Math.min(30,shop.deliveryRadiusKm||30)) return [];
   return [{_id:shop._id,storeName:shop.storeName,address:shop.address,distanceKm:Math.round(distanceKm*10)/10,etaMinutes:Math.ceil(15+distanceKm/18*60)}];
  }).sort((a,b)=>a.distanceKm-b.distanceKm);
  return res.json(nearby);
 } catch(e) { return res.status(500).json({message:"Nearby stores unavailable"}); }
});

/* =======================================================
   🏪 STORE LOGIN
======================================================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const store = await Store.findOne({ email });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    if (store.status === "blocked") {
      return res.status(403).json({ message: "Store is blocked" });
    }

    const isMatch = await bcrypt.compare(password, store.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: store._id, role: "store" },
      process.env.JWT_SECRET || "megamarto_secret_123",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Store login success",
      token,
      store: {
        _id: store._id,
        storeName: store.storeName,
        ownerName: store.ownerName,
        email: store.email,
        phone: store.phone,
        address: store.address,
        role: "store",
      },
    });
  } catch (err) {
    console.log("STORE LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================================================
   🏪 STORE ADD PRODUCT
======================================================= */
router.post("/products", auth, async (req, res) => {
  try {
    if (req.user.role !== "store") {
      return res.status(403).json({ message: "Store only access" });
    }

    const store = await Store.findById(req.user.id);

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const product = await Product.create({
      ...Object.fromEntries(Object.entries(req.body).filter(([key]) => ["name","price","mrp","unit","image","category","stock","description","featured","tags"].includes(key))),
      storeId: store._id,
      storeName: store.storeName,
      isAvailable: true,
    });

    if (global.io) {
      global.io.emit("productAdded", product);
    }

    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (err) {
    console.log("STORE ADD PRODUCT ERROR:", err);
    res.status(500).json({ message: "Product add failed" });
  }
});

/* =======================================================
   🏪 STORE GET OWN PRODUCTS
======================================================= */
router.get("/products", auth, async (req, res) => {
  try {
    if (req.user.role !== "store") {
      return res.status(403).json({ message: "Store only access" });
    }

    const products = await Product.find({ storeId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (err) {
    console.log("STORE PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Products fetch failed" });
  }
});

/* =======================================================
   🏪 STORE UPDATE OWN PRODUCT
======================================================= */
router.put("/products/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "store") {
      return res.status(403).json({ message: "Store only access" });
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        storeId: req.user.id,
      },
      { $set: Object.fromEntries(Object.entries(req.body).filter(([key]) => ["name","price","mrp","unit","image","category","stock","description","isAvailable","featured","tags"].includes(key))) },
      { new: true, runValidators: true }
    );

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
    console.log("STORE UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Product update failed" });
  }
});

/* =======================================================
   🏪 STORE DELETE OWN PRODUCT
======================================================= */
router.delete("/products/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "store") {
      return res.status(403).json({ message: "Store only access" });
    }

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      storeId: req.user.id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (global.io) {
      global.io.emit("productDeleted", product);
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.log("STORE DELETE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Product delete failed" });
  }
});

/* =======================================================
   🏪 STORE GET ORDERS
======================================================= */
router.get("/orders", auth, async (req, res) => {
  try {
    if (req.user.role !== "store") {
      return res.status(403).json({ message: "Store only access" });
    }

    const orders = await Order.find({ storeId: req.user.id })
      .populate("storeId", "storeName address phone location")
      .populate("deliveryBoy", "name phone bikeNumber")
      .sort({ createdAt: -1 });

    res.json(orders.map(storeOrderView));
  } catch (err) {
    console.log("STORE ORDERS ERROR:", err);
    res.status(500).json({ message: "Orders fetch failed" });
  }
});

/* =======================================================
   🏪 STORE ACCEPT / CANCEL ORDER
   Store accept -> all delivery boys notification
   Delivery boy first accept -> assign in deliveryRoutes
======================================================= */
router.put("/orders/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "store") {
      return res.status(403).json({ message: "Store only access" });
    }

    const { status } = req.body;

    const validStatuses = ["STORE_ACCEPTED", "STORE_CANCELLED"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      storeId: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "STORE_PENDING") {
      return res.status(400).json({ message: "Only pending orders can be accepted or cancelled" });
    }

    if (status === "STORE_CANCELLED") {
      order.status = "STORE_CANCELLED";
      order.storeStatus = "CANCELLED";
      order.deliveryBoy = null;
      await order.save();
      for (const item of order.items) await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.qty } });
      if (global.io) global.io.emit("inventoryUpdated", { productIds: order.items.map(item => item.productId) });

      const cancelledOrder = await Order.findById(order._id)
        .populate("storeId", "storeName address phone location")
        .populate("deliveryBoy", "name phone bikeNumber");

      if (global.io) {
        global.io.emit("orderUpdated", { _id: cancelledOrder._id });
        global.io.emit("storeCancelledOrder", { _id: cancelledOrder._id });
      }

      return res.json({
        message: "Order cancelled successfully",
        order: storeOrderView(cancelledOrder),
      });
    }

    order.status = "STORE_ACCEPTED";
    order.storeStatus = "ACCEPTED";
    order.deliveryBoy = null;

    await order.save();

    const acceptedOrder = await Order.findById(order._id)
      .populate("storeId", "storeName address phone location")
      .populate("deliveryBoy", "name phone bikeNumber");

    if (global.io) {
      global.io.emit("orderUpdated", { _id: acceptedOrder._id });
      global.io.emit("storeAcceptedOrder", { _id: acceptedOrder._id });
      global.io.emit("newDeliveryOrder", { _id: acceptedOrder._id });
    }

    res.json({
      message: "Order accepted. Waiting for delivery boy",
      order: storeOrderView(acceptedOrder),
    });
  } catch (err) {
    console.log("STORE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Order update failed" });
  }
});

module.exports = router;