import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./DeliveryLogin.css";

type DeliveryBoy = {
  _id: string;
  name: string;
  phone?: string;
  username: string;
  role?: string;
};

export default function DeliveryLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const login = async () => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      toast.error("Username and password required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/delivery/delivery-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: cleanUsername,
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Login failed");
        return;
      }

      if (!data.token || !data.boy) {
        toast.error("Invalid server response");
        return;
      }

      const deliveryBoy: DeliveryBoy = {
        ...data.boy,
        role: "delivery",
      };

      localStorage.setItem("deliveryToken", data.token);
      localStorage.setItem("deliveryUser", JSON.stringify(deliveryBoy));

      toast.success(`Welcome ${deliveryBoy.name || deliveryBoy.username} 🚴`);
      navigate("/delivery-dashboard", { replace: true });
    } catch (err) {
      console.log("Delivery login error:", err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      login();
    }
  };

  return (
    <div className="delivery-login-page">
      <div className="delivery-login-left">
        <div className="brand-pill">⚡ MegaMarto Partner</div>

        <h1>
          Deliver faster.
          <br />
          Earn smarter.
        </h1>

        <p>
          Manage assigned orders, navigate to customers, and update delivery
          status in real time.
        </p>

        <div className="partner-stats">
          <div>
            <h3>10 min</h3>
            <span>Fast delivery</span>
          </div>

          <div>
            <h3>Live</h3>
            <span>Order updates</span>
          </div>

          <div>
            <h3>₹</h3>
            <span>Daily earnings</span>
          </div>
        </div>
      </div>

      <div className="delivery-login-right">
        <div className="delivery-login-card">
          <div className="bike-circle">🚴</div>

          <h2>Delivery Partner Login</h2>
          <p className="subtitle">Login to start delivering MegaMarto orders</p>

          <label>Username</label>
          <div className="input-box">
            <span>👤</span>
            <input
              placeholder="Enter username"
              value={username}
              autoFocus
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyPress}
            />
          </div>

          <label>Password</label>
          <div className="input-box">
            <span>🔒</span>
            <input
              placeholder="Enter password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button className="login-main-btn" onClick={login} disabled={loading}>
            {loading ? "Logging in..." : "Login & Go Online"}
          </button>

          <button
            className="home-back-btn"
            onClick={() => navigate("/")}
            disabled={loading}
          >
            ← Back to Home
          </button>

          <div className="safety-box">
            <b>🛡️ Safety Reminder</b>
            <p>Verify customer address before marking order delivered.</p>
          </div>
        </div>
      </div>
    </div>
  );
}