const express = require("express");
const router = express.Router();

// 🔐 Controllers
const {
  login,
  register,
} = require("../controllers/authController");

/* ================= REGISTER ROUTE ================= */
router.post("/register", async (req, res, next) => {
  try {
    await register(req, res);
  } catch (err) {
    next(err);
  }
});

/* ================= LOGIN ROUTE ================= */
router.post("/login", async (req, res, next) => {
  try {
    await login(req, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;