const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password, role } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        message: "Name, email, mobile and password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    const exists = await User.findOne({
      $or: [{ email: cleanEmail }, { mobile: cleanMobile }],
    });

    if (exists) {
      return res.status(400).json({
        message:
          exists.email === cleanEmail
            ? "Email already exists"
            : "Mobile number already exists",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      mobile: cleanMobile,
      password: hash,
      role: role || "user",
    });

    res.status(201).json({
      message: "Registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ================= LOGIN WITH EMAIL OR MOBILE ================= */
exports.login = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    const loginId = (email || mobile || "").trim();

    if (!loginId || !password) {
      return res.status(400).json({
        message: "Email/Mobile and password are required",
      });
    }

    const user = await User.findOne({
      $or: [{ email: loginId.toLowerCase() }, { mobile: loginId }],
    });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY";

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { mobile, newPassword } = req.body;

    if (!mobile || !newPassword) {
      return res.status(400).json({
        message: "Mobile number and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({ mobile: mobile.trim() });

    if (!user) {
      return res.status(404).json({
        message: "Mobile number not registered",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      message: "Password reset successfully",
    });
  } catch (err) {
    console.log("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: "Password reset failed" });
  }
};