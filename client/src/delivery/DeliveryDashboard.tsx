import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import "./DeliveryDashboard.css";

const API = "https://megamarto-backend.onrender.com";

const socket = io(API, {
  autoConnect: false,
  transports: ["websocket"],
});

type Order = {
  _id: string;
  total: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string;

  storeId?: {
    _id?: string;
    storeName?: string;
    address?: string;
    phone?: string;
    location?: {
      lat?: number;
      lng?: number;
    };
  };

  storeName?: string;

  address?: {
    name?: string;
    phone?: string;
    city?: string;
    street?: string;
    pincode?: string;
  };

  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };

  items?: {
    name: string;
    qty: number;
    price: number;
  }[];
};

type Filter = "AVAILABLE" | "ACTIVE" | "DELIVERED";

export default function DeliveryDashboard() {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("AVAILABLE");

  const getToken = () => localStorage.getItem("deliveryToken") || "";

  const fetchAvailableOrders = useCallback(async () => {
    const token = getToken();

    if (!token || token === "undefined" || token === "null") {
      setAvailableOrders([]);
      return;
    }

    try {
      const res = await fetch(`${API}/delivery/available-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("AVAILABLE ORDERS ERROR:", data);
        setAvailableOrders([]);
        return;
      }

      setAvailableOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("AVAILABLE FETCH ERROR:", err);
      setAvailableOrders([]);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    const token = getToken();

    if (!token || token === "undefined" || token === "null") {
      setMyOrders([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/delivery/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("MY ORDERS ERROR:", data);
        setMyOrders([]);
        setLoading(false);
        return;
      }

      setMyOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.log("FETCH ERROR:", err);
      setMyOrders([]);
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await fetchAvailableOrders();
    await fetchMyOrders();
  }, [fetchAvailableOrders, fetchMyOrders]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshAll();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshAll]);

  useEffect(() => {
    const deliveryBoy = JSON.parse(localStorage.getItem("deliveryBoy") || "{}");

    if (!socket.connected) {
      socket.connect();
    }

    if (deliveryBoy?._id) {
      socket.emit("joinDelivery", deliveryBoy._id);
    }

    const refreshOrders = () => {
      window.setTimeout(() => {
        void refreshAll();
      }, 0);
    };

    socket.on("newDeliveryOrder", refreshOrders);
    socket.on("orderTaken", refreshOrders);
    socket.on("orderAssigned", refreshOrders);
    socket.on("storeAcceptedOrder", refreshOrders);
    socket.on("deliveryAcceptedOrder", refreshOrders);
    socket.on("orderUpdated", refreshOrders);
    socket.on("outForDelivery", refreshOrders);
    socket.on("orderDelivered", refreshOrders);

    return () => {
      socket.off("newDeliveryOrder", refreshOrders);
      socket.off("orderTaken", refreshOrders);
      socket.off("orderAssigned", refreshOrders);
      socket.off("storeAcceptedOrder", refreshOrders);
      socket.off("deliveryAcceptedOrder", refreshOrders);
      socket.off("orderUpdated", refreshOrders);
      socket.off("outForDelivery", refreshOrders);
      socket.off("orderDelivered", refreshOrders);
    };
  }, [refreshAll]);

  const acceptDeliveryOrder = async (id: string) => {
    const token = getToken();

    if (!token || token === "undefined" || token === "null") {
      alert("Please login again");
      return;
    }

    try {
      const res = await fetch(`${API}/delivery/accept-order/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Order already accepted");
        await refreshAll();
        return;
      }

      alert("Order accepted successfully");
      setFilter("ACTIVE");
      await refreshAll();
    } catch (err) {
      console.log("ACCEPT ERROR:", err);
      alert("Server error");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const token = getToken();

    if (!token || token === "undefined" || token === "null") {
      alert("Please login again");
      return;
    }

    try {
      const res = await fetch(`${API}/delivery/delivery-status/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Status update failed");
        return;
      }

      await refreshAll();
    } catch (err) {
      console.log("UPDATE ERROR:", err);
      alert("Server error");
    }
  };

  const openCustomerMap = (order: Order) => {
    if (!order.location?.lat || !order.location?.lng) {
      alert("Customer GPS location not available");
      return;
    }

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${order.location.lat},${order.location.lng}`,
      "_blank"
    );
  };

  const openStoreMap = (order: Order) => {
    const lat = order.storeId?.location?.lat;
    const lng = order.storeId?.location?.lng;

    if (lat && lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank"
      );
      return;
    }

    const address =
      order.storeId?.address ||
      order.storeName ||
      order.storeId?.storeName ||
      "store";

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
      )}`,
      "_blank"
    );
  };

  const activeOrders = myOrders.filter((o) => o.status !== "DELIVERED");
  const deliveredOrders = myOrders.filter((o) => o.status === "DELIVERED");

  const visibleOrders =
    filter === "AVAILABLE"
      ? availableOrders
      : filter === "ACTIVE"
      ? activeOrders
      : deliveredOrders;

  const earnings = deliveredOrders.length * 25;

  if (loading) {
    return <div className="delivery-page">Loading delivery orders...</div>;
  }

  return (
    <div className="delivery-page">
      <div className="delivery-hero">
        <div>
          <h1>🚴 Delivery Partner</h1>
          <p>MegaMarto live delivery dashboard</p>
        </div>

        <div className="online-pill">● Online</div>
      </div>

      <div className="delivery-stats">
        <div className="stat-card">
          <h3>{availableOrders.length}</h3>
          <p>Available Orders</p>
        </div>

        <div className="stat-card">
          <h3>{activeOrders.length}</h3>
          <p>My Active Orders</p>
        </div>

        <div className="stat-card">
          <h3>{deliveredOrders.length}</h3>
          <p>Delivered</p>
        </div>

        <div className="stat-card">
          <h3>₹{earnings}</h3>
          <p>Today Earnings</p>
        </div>
      </div>

      <div className="delivery-tabs">
        <button
          className={filter === "AVAILABLE" ? "active" : ""}
          onClick={() => {
            setFilter("AVAILABLE");
            void refreshAll();
          }}
        >
          Available Orders
        </button>

        <button
          className={filter === "ACTIVE" ? "active" : ""}
          onClick={() => {
            setFilter("ACTIVE");
            void refreshAll();
          }}
        >
          My Active Orders
        </button>

        <button
          className={filter === "DELIVERED" ? "active" : ""}
          onClick={() => {
            setFilter("DELIVERED");
            void refreshAll();
          }}
        >
          Delivered
        </button>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="empty-delivery">
          <h2>No orders found</h2>
          <p>
            Store accepted orders will appear in Available Orders. Accepted
            orders will move to My Active Orders.
          </p>
        </div>
      ) : (
        visibleOrders.map((order) => (
          <div className="delivery-card" key={order._id}>
            <div className="order-top">
              <div>
                <h2>₹{order.total}</h2>

                <span className={`status ${order.status.toLowerCase()}`}>
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>

              <div className="map-actions">
                <button className="map-btn" onClick={() => openStoreMap(order)}>
                  🏪 Store Map
                </button>

                <button
                  className="map-btn"
                  onClick={() => openCustomerMap(order)}
                >
                  🗺 Customer Map
                </button>
              </div>
            </div>

            <div className="customer-box">
              <h3>🏪 Store Details</h3>
              <p>
                Store:{" "}
                {order.storeId?.storeName || order.storeName || "Store"}
              </p>
              <p>
                Store Address:{" "}
                {order.storeId?.address || "Address not added"}
              </p>
              <p>Store Phone: {order.storeId?.phone || "N/A"}</p>

              <h3>👤 Customer Details</h3>
              <p>Customer: {order.address?.name || "Customer"}</p>
              <p>Phone: {order.address?.phone || "N/A"}</p>
              <p>
                Address: {order.address?.street || "N/A"},{" "}
                {order.address?.city || "N/A"} -{" "}
                {order.address?.pincode || ""}
              </p>

              <h3>📦 Items</h3>
              {order.items?.map((item, index) => (
                <p key={index}>
                  {item.name} x {item.qty} = ₹{item.price * item.qty}
                </p>
              ))}

              <h3>💳 Payment</h3>
              <p>
                {order.paymentMethod || "COD"} /{" "}
                {order.paymentStatus || "PENDING"}
              </p>

              {order.location ? (
                <p className="location-ok">
                  ✅ Customer GPS available{" "}
                  {order.location.accuracy
                    ? `(${Math.round(order.location.accuracy)}m accuracy)`
                    : ""}
                </p>
              ) : (
                <p className="location-missing">
                  ⚠ Customer GPS not available
                </p>
              )}
            </div>

            {order.status !== "DELIVERED" && (
              <div className="delivery-actions">
                {filter === "AVAILABLE" &&
                  order.status === "STORE_ACCEPTED" && (
                    <button
                      className="accept-btn"
                      onClick={() => acceptDeliveryOrder(order._id)}
                    >
                      Accept This Order
                    </button>
                  )}

                {filter !== "AVAILABLE" &&
                  order.status === "DELIVERY_ACCEPTED" && (
                    <button
                      className="accept-btn"
                      onClick={() => updateStatus(order._id, "PICKED_UP")}
                    >
                      Order Picked Up
                    </button>
                  )}

                {filter !== "AVAILABLE" && order.status === "PICKED_UP" && (
                  <button
                    className="accept-btn"
                    onClick={() =>
                      updateStatus(order._id, "OUT_FOR_DELIVERY")
                    }
                  >
                    Start To Customer
                  </button>
                )}

                {filter !== "AVAILABLE" &&
                  order.status === "OUT_FOR_DELIVERY" && (
                    <button
                      className="delivered-btn"
                      onClick={() => updateStatus(order._id, "DELIVERED")}
                    >
                      {order.paymentMethod === "COD"
                        ? "Cash Collected & Delivered"
                        : "Mark Delivered"}
                    </button>
                  )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}