const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    // 🔐 must come from auth middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized - no user" });
    }

    // 👤 find user in DB
    const user = await User.findById(req.user.id);

    // ❌ user not found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ❌ not admin
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin only access" });
    }

    // ✅ allow request
    next();
  } catch (err) {
    console.log("ADMIN MIDDLEWARE ERROR:", err.message);

    res.status(500).json({
      message: "Role check failed",
    });
  }
};