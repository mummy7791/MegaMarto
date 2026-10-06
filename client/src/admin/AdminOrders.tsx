import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";

/* ================= TYPES ================= */
type OrderItem = {
  name: string;
  qty: number;
};

type Order = {
  _id: string;
  total: number;
  status: string;
  address?: {
    name?: string;
  };
  items?: OrderItem[];
  storeName?: string;
  storeId?: { storeName?: string; ownerName?: string; phone?: string } | null;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryBoy?: { name?: string; phone?: string; bikeNumber?: string } | null;
};

type DeliveryBoy = {
  _id: string;
  name: string;
  phone: string;
};

/* ================= COMPONENT ================= */
function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [boys, setBoys] = useState<DeliveryBoy[]>([]);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetched = useRef(false);

  const getAdminToken = () => {
    const token = localStorage.getItem("adminToken");

    if (!token || token === "undefined" || token === "null") {
      return null;
    }

    return token;
  };

  /* ================= FETCH ORDERS ================= */
  const fetchOrders = useCallback(async () => {
    try {
      const token = getAdminToken();

      if (!token) {
        toast.error("Admin login required");
        setLoading(false);
        return;
      }

      const res = await fetch("https://megamarto-backend.onrender.com/admin/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Failed to load orders");
        setOrders([]);
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("FETCH ORDERS ERROR:", err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= FETCH DELIVERY BOYS ================= */
  const fetchBoys = useCallback(async () => {
    try {
      const token = getAdminToken();

      if (!token) {
        toast.error("Admin login required");
        return;
      }

      const res = await fetch("https://megamarto-backend.onrender.com/admin/delivery-boys", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Failed to load delivery boys");
        setBoys([]);
        return;
      }

      setBoys(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("FETCH BOYS ERROR:", err);
    }
  }, []);

  /* ================= INIT LOAD ================= */
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchOrders();
    fetchBoys();
  }, [fetchOrders, fetchBoys]);

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (id: string, status: string) => {
    try {
      const token = getAdminToken();

      if (!token) {
        toast.error("Admin login required");
        return;
      }

      const res = await fetch(`https://megamarto-backend.onrender.com/admin/orders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Update failed");
        return;
      }

      toast.success("Status updated");

      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status } : o))
      );
    } catch (err) {
      console.log("UPDATE STATUS ERROR:", err);
      toast.error("Error updating status");
    }
  };

  /* ================= ASSIGN DELIVERY BOY ================= */
  const assignOrder = async (orderId: string, deliveryBoyId: string) => {
    if (!deliveryBoyId) return;

    try {
      const token = getAdminToken();

      if (!token) {
        toast.error("Admin login required");
        return;
      }

      const res = await fetch(
        `https://megamarto-backend.onrender.com/admin/assign-order/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ deliveryBoyId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "Assign failed");
        return;
      }

      toast.success("Order Assigned 🚴");
      fetchOrders();
    } catch (err) {
      console.log("ASSIGN ORDER ERROR:", err);
      toast.error("Server error");
    }
  };

  if (loading) {
    return <h3 style={{ padding: 20 }}>Loading orders...</h3>;
  }

  return (
    <div className="admin-orders">
      <div className="admin-orders-head"><div><span>FULFILMENT CONTROL</span><h2>Orders & Delivery</h2><p>Every order is linked to its actual selling shop.</p></div><button onClick={fetchOrders}>Refresh Orders</button></div>

      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        orders.map((order) => {
          const isOpen = openOrderId === order._id;

          return (
            <div
              key={order._id}
              className="admin-order-card"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
                onClick={() => setOpenOrderId(isOpen ? null : order._id)}
              >
                <div>
                  <p>
                    <b>Order:</b> #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p>
                    <b>Customer:</b> {order.address?.name || "N/A"}
                  </p>
                  <p><b>Shop:</b> {order.storeId?.storeName || order.storeName || "MegaMarto"}
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p>
                    <b>₹{order.total}</b>
                  </p>
                  <p style={{ color: "#2563eb" }}>{order.status}</p>
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 10 }}>
                  <hr />

                  <div className="admin-order-meta"><span>🏪 {order.storeId?.storeName || order.storeName || "MegaMarto"}</span><span>💳 {order.paymentMethod || "COD"} / {order.paymentStatus || "PENDING"}</span>{order.deliveryBoy?.name && <span>🚴 {order.deliveryBoy.name}</span>}</div>

                  <h4>🛒 Items from this shop</h4>

                  {order.items?.length ? (
                    order.items.map((item, i) => (
                      <div key={i}>
                        {item.name} × {item.qty}
                      </div>
                    ))
                  ) : (
                    <p>No items</p>
                  )}

                  <div style={{ marginTop: 10 }}>
                    <button onClick={() => updateStatus(order._id, "OUT_FOR_DELIVERY")}>
                      OUT FOR DELIVERY
                    </button>

                    <button
                      onClick={() => updateStatus(order._id, "DELIVERED")}
                      style={{ marginLeft: 10 }}
                    >
                      DELIVERED
                    </button>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <select
                      defaultValue=""
                      onChange={(e) => assignOrder(order._id, e.target.value)}
                      style={{
                        padding: 6,
                        borderRadius: 6,
                      }}
                    >
                      <option value="">🚴 Assign Delivery Boy</option>

                      {boys.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} ({b.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default AdminOrders;