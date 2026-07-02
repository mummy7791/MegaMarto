import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/Auth.css";

type User = {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
};

const API_URL = "https://megamarto-backend.onrender.com";

function Login() {
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotMobile, setForgotMobile] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const clearOldAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerUser");
    localStorage.removeItem("deliveryToken");
    localStorage.removeItem("deliveryUser");
  };

  const handleLogin = async () => {
    const cleanLoginId = loginId.trim();
    const cleanPassword = password.trim();

    if (!cleanLoginId || !cleanPassword) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanLoginId,
          mobile: cleanLoginId,
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Login failed");
        return;
      }

      const user: User = data.user;
      const role = user.role?.toLowerCase() || "user";

      clearOldAuth();

      if (role === "admin") {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(user));
        toast.success(`Welcome Admin ${user.name} 👋`);
        navigate("/admin", { replace: true });
      } else {
        localStorage.setItem("customerToken", data.token);
        localStorage.setItem("customerUser", JSON.stringify(user));
        toast.success(`Welcome ${user.name} 👋`);
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      toast.error("Server error. Try again");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanMobile = forgotMobile.trim();
    const cleanPassword = newPassword.trim();

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      toast.error("Enter valid registered mobile number");
      return;
    }

    if (cleanPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: cleanMobile,
          newPassword: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Password reset failed");
        return;
      }

      toast.success("Password reset successfully");
      setForgotOpen(false);
      setForgotMobile("");
      setNewPassword("");
    } catch (err) {
      console.error("FORGOT ERROR:", err);
      toast.error("Server error. Try again");
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter" && !loading) {
    if (forgotOpen) {
      handleForgotPassword();
    } else {
      handleLogin();
    }
  }
};
  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="brand-badge">⚡ MegaMarto</div>
        <h1>
          Welcome back
          <br />
          to MegaMarto
        </h1>
        <p>Login with email or mobile number and continue shopping.</p>
        <div className="auth-features">
          <div>🚀 Fast delivery</div>
          <div>🛒 Easy checkout</div>
          <div>📍 Live tracking</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-logo">🛒</div>

          <h2>{forgotOpen ? "Reset Password" : "Login"}</h2>
          <p className="auth-subtitle">
            {forgotOpen
              ? "Enter registered mobile number"
              : "Use email or mobile number"}
          </p>

          {!forgotOpen ? (
            <>
              <label>Email or Mobile Number</label>
              <div className="auth-input">
                <span>👤</span>
                <input
                  type="text"
                  placeholder="Enter email or mobile number"
                  value={loginId}
                  autoFocus
                  onChange={(e) => setLoginId(e.target.value)}
                  onKeyDown={handleEnter}
                />
              </div>

              <label>Password</label>
              <div className="auth-input">
                <span>🔒</span>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleEnter}
                />
              </div>

              <p className="auth-link forgot-link">
                <span onClick={() => setForgotOpen(true)}>
                  Forgot password?
                </span>
              </p>

              <button
                className="auth-main-btn"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="auth-link">
                Don&apos;t have an account?{" "}
                <span onClick={() => navigate("/register")}>Register</span>
              </p>
            </>
          ) : (
            <>
              <label>Registered Mobile Number</label>
              <div className="auth-input">
                <span>📱</span>
                <input
                  type="tel"
                  placeholder="Enter registered mobile number"
                  value={forgotMobile}
                  maxLength={10}
                  onChange={(e) =>
                    setForgotMobile(e.target.value.replace(/\D/g, ""))
                  }
                  onKeyDown={handleEnter}
                />
              </div>

              <label>New Password</label>
              <div className="auth-input">
                <span>🔒</span>
                <input
                  type="password"
                  placeholder="Create new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={handleEnter}
                />
              </div>

              <button
                className="auth-main-btn"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                {loading ? "Updating..." : "Reset Password"}
              </button>

              <p className="auth-link">
                <span onClick={() => setForgotOpen(false)}>Back to login</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;