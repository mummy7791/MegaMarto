const Product = require("../models/Product");

/* ================= ADD PRODUCT ================= */
exports.addProduct = async (req, res) => {
  try {
    const { name, price, image, category, stock, description } = req.body;

    // validation
    if (!name || !price || !image || !category) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const product = await Product.create({
      name,
      price,
      image,
      category,
      stock: stock || 0,
      description: description || "",
    });

    res.status(201).json(product);
  } catch (err) {
    console.log("ADD PRODUCT ERROR:", err.message);
    res.status(500).json({ message: "Failed to add product" });
  }
};

/* ================= GET ALL PRODUCTS ================= */
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.log("GET PRODUCTS ERROR:", err.message);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/* ================= GET SINGLE PRODUCT ================= */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.log("GET PRODUCT ERROR:", err.message);
    res.status(500).json({ message: "Failed to get product" });
  }
};

/* ================= UPDATE PRODUCT ================= */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.log("UPDATE PRODUCT ERROR:", err.message);
    res.status(500).json({ message: "Failed to update product" });
  }
};

/* ================= DELETE PRODUCT ================= */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.log("DELETE PRODUCT ERROR:", err.message);
    res.status(500).json({ message: "Failed to delete product" });
  }
};