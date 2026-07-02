import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type Order = {
  _id: string;
  items: {
    _id?: string;
    name: string;
    price: number;
    qty: number;
    image?: string;
  }[];
  total: number;
  status: OrderStatus;
  createdAt?: string;
  address?: {
    name?: string;
    phone?: string;
    city?: string;
    street?: string;
    pincode?: string;
  };
};

const steps: OrderStatus[] = [
  "PLACED",
  "CONFIRMED",
  "ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("customerToken");

        if (!token || token === "undefined" || token === "null") {
          setError("Session expired. Please login again");
          setLoading(false);
          return;
        }

        const res = await fetch("http://https://megamarto-backend.onrender.com/orders", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();

        if (ignore) return;

        if (res.status === 401 || res.status === 403) {
          setError("Session expired. Please login again");
          setOrders([]);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError(data?.message || "Failed to load orders");
          setOrders([]);
        } else {
          setOrders(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        console.log("❌ ORDERS ERROR:", err);
        if (!ignore) setError("Server error");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      ignore = true;
    };
  }, []);

  const getProgress = (status: OrderStatus) => {
    if (status === "CANCELLED") return 100;

    const index = steps.indexOf(status);
    return index >= 0 ? ((index + 1) / steps.length) * 100 : 20;
  };

  const trackOrder = (id: string) => {
    if (!id) {
      alert("Invalid order ID");
      return;
    }

    navigate(`/track/${id}`);
  };

  const formatDate = (date?: string) => {
    if (!date) return "Recently";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <p style={{ padding: 20 }}>Loading orders...</p>;
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>🧾 My Orders</h2>

      {error && <p style={styles.error}>{error}</p>}

      {orders.length === 0 ? (
        <div style={styles.emptyBox}>
          <h3>No orders found</h3>
          <button style={styles.shopBtn} onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order._id} style={styles.orderCard}>
            <div style={styles.orderTop}>
              <div>
                <h3 style={styles.statusText}>
                  Order {order.status === "DELIVERED" ? "delivered" : order.status}
                  {order.status === "DELIVERED" && " ✅"}
                </h3>

                <p style={styles.dateText}>
                  Placed at {formatDate(order.createdAt)}
                </p>
              </div>

              <h3 style={styles.price}>₹{order.total}</h3>
            </div>

            <div style={styles.itemRow}>
              {order.items?.slice(0, 5).map((item, i) => (
                <div key={item._id || i} style={styles.itemBox}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      style={styles.itemImg}
                    />
                  ) : (
                    <span style={styles.itemEmoji}>🛒</span>
                  )}
                </div>
              ))}
            </div>

            <div style={styles.itemsList}>
              {order.items?.map((item, i) => (
                <div key={item._id || i}>
                  {item.name} × {item.qty} — ₹{item.price}
                </div>
              ))}
            </div>

            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${getProgress(order.status)}%`,
                  background:
                    order.status === "CANCELLED"
                      ? "#ef4444"
                      : "linear-gradient(90deg, #22c55e, #16a34a)",
                }}
              />
            </div>

            <button
              onClick={() => trackOrder(order._id)}
              style={styles.trackBtn}
            >
              Track Order
            </button>
          </div>
        ))
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 25,
    maxWidth: 900,
    margin: "auto",
    fontFamily: "Outfit, sans-serif",
  },

  title: {
    fontSize: 28,
    marginBottom: 20,
  },

  error: {
    color: "red",
    marginBottom: 12,
    fontWeight: 600,
  },

  emptyBox: {
    background: "white",
    padding: 30,
    borderRadius: 18,
    textAlign: "center",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  },

  shopBtn: {
    marginTop: 12,
    padding: "10px 18px",
    border: "none",
    borderRadius: 10,
    background: "#a855f7",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  },

  orderCard: {
    background: "#fff",
    padding: 20,
    marginBottom: 18,
    borderRadius: 20,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  },

  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 15,
  },

  statusText: {
    margin: 0,
    fontSize: 20,
  },

  dateText: {
    color: "#94a3b8",
    margin: "8px 0",
  },

  price: {
    margin: 0,
    fontSize: 22,
  },

  itemRow: {
    display: "flex",
    gap: 10,
    margin: "12px 0",
  },

  itemBox: {
    width: 55,
    height: 55,
    borderRadius: 12,
    background: "#f8fafc",
    display: "grid",
    placeItems: "center",
    border: "1px solid #e5e7eb",
  },

  itemImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: 12,
  },

  itemEmoji: {
    fontSize: 25,
  },

  itemsList: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 12,
  },

  progressTrack: {
    height: 8,
    background: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    transition: "0.3s",
  },

  trackBtn: {
    marginTop: 12,
    padding: "9px 14px",
    background: "#0072ff",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
  },
};

export default MyOrders;