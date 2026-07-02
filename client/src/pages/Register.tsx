import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/Auth.css";

const API_URL = "https://megamarto-backend.onrender.com";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanEmail || !cleanMobile || !cleanPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      toast.error("Enter valid email address");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      toast.error("Enter valid 10 digit mobile number");
      return;
    }

    if (cleanPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          mobile: cleanMobile,
          password: cleanPassword,
          role: "user",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Register failed");
        return;
      }

      toast.success("🎉 Account created successfully!");
      navigate("/login", { replace: true });
    } catch (err) {
      console.log("REGISTER ERROR:", err);
      toast.error("Server error. Try again");
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleRegister();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="brand-badge">⚡ MegaMarto</div>

        <h1>
          Groceries delivered
          <br />
          in minutes
        </h1>

        <p>
          Create your MegaMarto account and shop fresh groceries, snacks, dairy,
          beauty and home essentials with fast delivery.
        </p>

        <div className="auth-features">
          <div>🚀 10 min delivery</div>
          <div>🎁 Coupons & offers</div>
          <div>📍 Live tracking</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo">🛒</div>

          <h2>Create Account</h2>
          <p className="auth-subtitle">Join MegaMarto today</p>

          <label>Full Name</label>
          <div className="auth-input">
            <span>👤</span>
            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleEnter}
            />
          </div>

          <label>Email Address</label>
          <div className="auth-input">
            <span>📧</span>
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleEnter}
            />
          </div>

          <label>Mobile Number</label>
          <div className="auth-input">
            <span>📱</span>
            <input
              type="tel"
              placeholder="Enter 10 digit mobile number"
              value={mobile}
              maxLength={10}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              onKeyDown={handleEnter}
            />
          </div>

          <label>Password</label>
          <div className="auth-input">
            <span>🔒</span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleEnter}
            />

            <button
              type="button"
              className="show-btn"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            className="auth-main-btn"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Register"}
          </button>

          <p className="auth-link">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;