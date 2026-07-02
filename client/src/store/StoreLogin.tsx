import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/Auth.css";

const API = "https://megamarto-backend.onrender.com";

export default function StoreLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const loginStore = async () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/store/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Login failed");
        return;
      }

      localStorage.setItem("storeToken", data.token);
      localStorage.setItem("storeUser", JSON.stringify(data.store));

      toast.success(`Welcome ${data.store.storeName} 🏪`);

      navigate("/store-dashboard", {
        replace: true,
      });
    } catch (err) {
      console.log(err);
      toast.error("Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div
        className="auth-left"
        style={{
          background:
            "linear-gradient(135deg,#059669,#16a34a,#22c55e)",
        }}
      >
        <div className="brand-badge">🏪 MegaMarto Store</div>

        <h1>
          Store
          <br />
          Partner Portal
        </h1>

        <p>
          Manage your store, products, inventory and customer orders from one
          dashboard.
        </p>

        <div className="auth-features">
          <div>📦 Products</div>
          <div>🛒 Orders</div>
          <div>📈 Analytics</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">

          <div className="auth-logo">🏪</div>

          <h2>Store Login</h2>

          <p className="auth-subtitle">
            Login to your store account
          </p>

          <label>Email</label>

          <div className="auth-input">
            <span>📧</span>

            <input
              placeholder="Store Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label>Password</label>

          <div className="auth-input">
            <span>🔒</span>

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            className="auth-main-btn"
            onClick={loginStore}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Store Login"}
          </button>

          <p className="auth-link">
            <span onClick={() => navigate("/")}>
              ← Back to Shop
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}