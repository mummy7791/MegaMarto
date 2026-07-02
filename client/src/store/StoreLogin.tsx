import { useState } from "react";

import toast from "react-hot-toast";

const API = "http://https://megamarto-backend.onrender.com";

export default function StoreLogin() {
  

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const loginStore = async () => {
    if (!form.email || !form.password) {
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
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Login failed");
        return;
      }

      localStorage.setItem("storeToken", data.token);
      localStorage.setItem("storeUser", JSON.stringify(data.store));

      toast.success("Store login successful ✅");

      setTimeout(() => {
        window.location.href = "/store-dashboard";
      }, 500);
    } catch (err) {
      console.log("STORE LOGIN ERROR:", err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>🏪 Store Login</h2>
        <p style={styles.subtitle}>Login to manage your products and orders</p>

        <input
          style={styles.input}
          placeholder="Store Email"
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, password: e.target.value }))
          }
        />

        <button style={styles.button} onClick={loginStore} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "calc(100vh - 70px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #16a34a, #22c55e)",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "430px",
    background: "#fff",
    padding: "30px",
    borderRadius: "24px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
  },
  title: {
    margin: 0,
    textAlign: "center",
    fontSize: "28px",
    fontWeight: 900,
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: "24px",
  },
  input: {
    width: "100%",
    padding: "15px",
    marginBottom: "14px",
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    fontSize: "16px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #111827, #374151)",
    color: "#fff",
    fontSize: "17px",
    fontWeight: 900,
    cursor: "pointer",
  },
};