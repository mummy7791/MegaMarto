import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "ASSIGNED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

type Order = {
  _id: string;
  total: number;
  status: OrderStatus;
  createdAt?: string;
  address?: {
    name?: string;
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

function OrderTracking() {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string>(id ? "" : "Invalid order ID");
  const [secondsLeft, setSecondsLeft] = useState(600);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem("customerToken");

      if (!token || token === "undefined" || token === "null") {
        return {
          order: null,
          error: "Please login again",
        };
      }

      const res = await fetch(`http://https://megamarto-backend.onrender.com/orders/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          order: null,
          error: data?.message || "Failed to load order",
        };
      }

      return {
        order: data as Order,
        error: "",
      };
    } catch (err) {
      console.log("ORDER TRACKING ERROR:", err);

      return {
        order: null,
        error: "Server error",
      };
    }
  };

  useEffect(() => {
    if (!id) return;

    let ignore = false;

    const loadOrder = async () => {
      const result = await fetchOrder(id);

      if (ignore) return;

      setOrder(result.order);
      setError(result.error);
      setLoading(false);

      if (result.order?.createdAt) {
        const createdTime = new Date(result.order.createdAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - createdTime) / 1000);
        const remaining = Math.max(600 - elapsed, 0);
        setSecondsLeft(remaining);
      }
    };

    loadOrder();

    intervalRef.current = setInterval(loadOrder, 5000);

    return () => {
      ignore = true;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getProgress = (status: OrderStatus) => {
    const index = steps.indexOf(status);
    return index >= 0 ? ((index + 1) / steps.length) * 100 : 0;
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  if (loading) {
    return <div style={{ padding: 30 }}>Loading Order...</div>;
  }

  if (error) {
    return <div style={{ padding: 30, color: "red" }}>{error}</div>;
  }

  if (!order) {
    return <div style={{ padding: 30 }}>Order Not Found</div>;
  }

  const currentIndex = steps.indexOf(order.status);
  const orderProgress = getProgress(order.status);
  const timeProgress = ((600 - secondsLeft) / 600) * 100;

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "30px auto",
        background: "#f8fafc",
        padding: "25px",
        borderRadius: "24px",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #7e22ce, #a855f7)",
          color: "white",
          padding: "28px",
          borderRadius: "24px",
          marginBottom: "22px",
          boxShadow: "0 12px 25px rgba(126,34,206,0.25)",
        }}
      >
        <h1 style={{ margin: 0 }}>🚚 Arriving in {formatTime(secondsLeft)}</h1>
        <p style={{ marginTop: 8 }}>Your MegaMarto order is on the way</p>

        <div
          style={{
            height: "12px",
            background: "rgba(255,255,255,0.3)",
            borderRadius: "20px",
            overflow: "hidden",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              width: `${timeProgress}%`,
              height: "100%",
              background: "#ffffff",
              borderRadius: "20px",
              transition: "0.3s",
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "22px",
          boxShadow: "0 8px 22px rgba(0,0,0,0.06)",
        }}
      >
        <h2>📦 Track Order</h2>

        <p>
          <b>Order ID:</b> {order._id}
        </p>

        <p>
          <b>Customer:</b> {order.address?.name || "N/A"}
        </p>

        <p>
          <b>Address:</b> {order.address?.street || "N/A"},{" "}
          {order.address?.city || ""}
        </p>

        <h2>₹{order.total}</h2>

        <p>
          Status: <b>{order.status.replaceAll("_", " ")}</b>
        </p>

        <div
          style={{
            height: "12px",
            background: "#e5e7eb",
            borderRadius: "20px",
            overflow: "hidden",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              width: `${orderProgress}%`,
              height: "100%",
              background: "linear-gradient(90deg,#22c55e,#16a34a)",
              transition: "0.3s",
            }}
          />
        </div>

        <div style={{ marginTop: 28 }}>
          {steps.map((step, index) => (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: index <= currentIndex ? "#22c55e" : "#d1d5db",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  marginRight: 12,
                  fontWeight: 900,
                }}
              >
                {index <= currentIndex ? "✓" : index + 1}
              </div>

              <div>
                <b
                  style={{
                    color: index <= currentIndex ? "#16a34a" : "#64748b",
                  }}
                >
                  {step.replaceAll("_", " ")}
                </b>
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                  {index <= currentIndex ? "Completed" : "Pending"}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={async () => {
            if (!id) return;

            setLoading(true);

            const result = await fetchOrder(id);

            setOrder(result.order);
            setError(result.error);
            setLoading(false);
          }}
          style={{
            marginTop: "15px",
            padding: "12px 20px",
            background: "#7e22ce",
            color: "#fff",
            border: "none",
            borderRadius: "14px",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}

export default OrderTracking;