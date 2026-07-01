import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/Auth.css";

type User = {
  _id: string;
  name: string;
  email: string;
  role?: string;
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const clearOldAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  };

  const handleLogin = async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      toast.error("Enter valid email");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Login failed");
        return;
      }

      if (!data.token || !data.user) {
        toast.error("Invalid server response");
        return;
      }

      const user: User = data.user;
      const role = user.role?.toLowerCase() || "user";

      clearOldAuth();

      if (role === "admin") {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUser", JSON.stringify(user));

        toast.success(`Welcome Admin ${user.name} 👋`);

        setTimeout(() => {
          window.location.href = "/admin";
        }, 500);
      } else if (role === "delivery") {
        localStorage.setItem("deliveryToken", data.token);
        localStorage.setItem("deliveryUser", JSON.stringify(user));

        toast.success(`Welcome Delivery ${user.name} 🚴`);

        setTimeout(() => {
          window.location.href = "/delivery-dashboard";
        }, 500);
      } else {
        localStorage.setItem("customerToken", data.token);
        localStorage.setItem("customerUser", JSON.stringify(user));

        toast.success(`Welcome ${user.name} 👋`);

        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      toast.error("Server error. Try again");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Welcome Back 👋</h2>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          autoFocus
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")}>Register</span>
        </p>
      </div>
    </div>
  );
}

export default Login;