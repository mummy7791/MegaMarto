import { useEffect, useState } from "react";

type Order = {
  _id: string;
  total: number;
  status: string;
};

type DeliveryBoy = {
  _id: string;
  name: string;
  phone: string;
};

export default function AdminAssignDragDrop() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [boys, setBoys] = useState<DeliveryBoy[]>([]);

  /* ================= INIT LOAD ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch("https://megamarto-backend.onrender.com/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log(err);
        setOrders([]);
      }
    };

    const fetchBoys = async () => {
      try {
        const res = await fetch(
          "https://megamarto-backend.onrender.com/delivery/delivery-boys",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        setBoys(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log(err);
        setBoys([]);
      }
    };

    fetchOrders();
    fetchBoys();
  }, []);

  /* ================= DRAG START ================= */
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
  };

  /* ================= DROP ================= */
  const handleDrop = async (
    e: React.DragEvent,
    deliveryBoyId: string
  ) => {
    const orderId = e.dataTransfer.getData("orderId");
    const token = localStorage.getItem("token");

    if (!orderId || !token) return;

    try {
      await fetch(
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

      alert("Order Assigned 🚴");

      // refresh safely
      const res = await fetch("https://megamarto-backend.onrender.com/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={{ display: "flex", gap: 20, padding: 20 }}>
      
      {/* ================= ORDERS ================= */}
      <div style={{ flex: 1 }}>
        <h2>📦 Orders (Drag)</h2>

        {orders.map((o) => (
          <div
            key={o._id}
            draggable
            onDragStart={(e) => handleDragStart(e, o._id)}
            style={{
              padding: 10,
              marginBottom: 10,
              background: "#f3f4f6",
              borderRadius: 8,
              cursor: "grab",
            }}
          >
            <p><b>ID:</b> {o._id}</p>
            <p>₹ {o.total}</p>
            <p>{o.status}</p>
          </div>
        ))}
      </div>

      {/* ================= DELIVERY BOYS ================= */}
      <div style={{ flex: 1 }}>
        <h2>🚴 Delivery Boys (Drop here)</h2>

        {boys.map((b) => (
          <div
            key={b._id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, b._id)}
            style={{
              padding: 15,
              marginBottom: 15,
              background: "#dbeafe",
              borderRadius: 10,
              minHeight: 80,
            }}
          >
            <p><b>{b.name}</b></p>
            <p>{b.phone}</p>
            <small>Drop order here 👇</small>
          </div>
        ))}
      </div>
    </div>
  );
}