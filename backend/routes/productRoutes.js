const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

/* ================= GET ALL PRODUCTS ================= */
router.get("/", getProducts);

/* ================= GET SINGLE PRODUCT ================= */
router.get("/:id", getProductById);

/* ================= ADD PRODUCT (ADMIN ONLY) ================= */
router.post("/", auth, admin, addProduct);

/* ================= UPDATE PRODUCT (ADMIN ONLY) ================= */
router.put("/:id", auth, admin, updateProduct);

/* ================= DELETE PRODUCT (ADMIN ONLY) ================= */
router.delete("/:id", auth, admin, deleteProduct);

module.exports = router;