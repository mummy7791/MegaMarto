const express = require("express");
const router = express.Router();

const {
  login,
  register,
  forgotPassword,
} = require("../controllers/authController");

/* ================= REGISTER ================= */
router.post("/register", register);

/* ================= LOGIN ================= */
router.post("/login", login);

/* ================= FORGOT PASSWORD ================= */
router.post("/forgot-password", forgotPassword);

module.exports = router;