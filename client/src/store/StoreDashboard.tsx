import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import "./StoreDashboard.css";

const API = "http://localhost:5000";

const socket = io(API, {
  autoConnect: false,
  transports: ["websocket"],
});

type Product = {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
};

type DeliveryBoy = {
  _id?: string;
  name?: string;
  phone?: string;
  bikeNumber?: string;
};

type Order = {
  _id: string;
  total: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryBoy?: DeliveryBoy | null;
  address?: {
    name?: string;
    phone?: string;
    street?: string;
    city?: string;
    pincode?: string;
  };
  items?: {
    name: string;
    qty: number;
    price: number;
  }[];
};

type Tab = "products" | "orders" | "notifications";

export default function StoreDashboard() {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
    category: "Grocery",
    stock: "10",
    description: "",
  });

  const token = localStorage.getItem("storeToken") || "";

  const storeUser = useMemo(() => {
    return JSON.parse(localStorage.getItem("storeUser") || "{}");
  }, []);

  const checkToken = useCallback(() => {
    if (!token || token === "undefined" || token === "null") {
      toast.error("Please login again");
      localStorage.removeItem("storeToken");
      localStorage.removeItem("storeUser");
      window.location.href = "/store-login";
      return false;
    }

    return true;
  }, [token]);

  const loadProducts = useCallback(async () => {
    if (!checkToken()) return;

    try {
      const res = await fetch(`${API}/store/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Products loading failed");
        return;
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Products loading failed");
    }
  }, [checkToken, token]);

  const loadOrders = useCallback(async () => {
    if (!checkToken()) return;

    try {
      const res = await fetch(`${API}/store/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Orders loading failed");
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Orders loading failed");
    }
  }, [checkToken, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProducts, loadOrders]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    if (storeUser?._id) {
      socket.emit("joinStore", storeUser._id);
    }

    const refresh = () => {
      window.setTimeout(() => {
        void loadOrders();
        void loadProducts();
      }, 0);
    };

    socket.on("orderPlaced", refresh);
    socket.on("orderUpdated", refresh);
    socket.on("storeAcceptedOrder", refresh);
    socket.on("deliveryAcceptedOrder", refresh);
    socket.on("orderPickedUp", refresh);
    socket.on("outForDelivery", refresh);
    socket.on("orderDelivered", refresh);

    return () => {
      socket.off("orderPlaced", refresh);
      socket.off("orderUpdated", refresh);
      socket.off("storeAcceptedOrder", refresh);
      socket.off("deliveryAcceptedOrder", refresh);
      socket.off("orderPickedUp", refresh);
      socket.off("outForDelivery", refresh);
      socket.off("orderDelivered", refresh);
    };
  }, [loadOrders, loadProducts, storeUser?._id]);

  const addProduct = async () => {
    if (!checkToken()) return;

    if (!form.name || !form.price || !form.category) {
      toast.error("Please fill product details");
      return;
    }

    const res = await fetch(`${API}/store/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message || "Product add failed");
      return;
    }

    toast.success("Product added ✅");

    setForm({
      name: "",
      price: "",
      image: "",
      category: "Grocery",
      stock: "10",
      description: "",
    });

    await loadProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!checkToken()) return;
    if (!confirm("Delete this product?")) return;

    await fetch(`${API}/store/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("Product deleted");
    await loadProducts();
  };

  const acceptOrder = async (id: string) => {
    if (!checkToken()) return;

    const res = await fetch(`${API}/store/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "STORE_ACCEPTED" }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message || "Accept failed");
      return;
    }

    toast.success("Order accepted ✅ Waiting for delivery boy");
    await loadOrders();
  };

  const cancelOrder = async (id: string) => {
    if (!checkToken()) return;

    const res = await fetch(`${API}/store/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "STORE_CANCELLED" }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message || "Cancel failed");
      return;
    }

    toast.success("Order cancelled");
    await loadOrders();
  };

  const logout = () => {
    localStorage.removeItem("storeToken");
    localStorage.removeItem("storeUser");
    window.location.href = "/store-login";
  };

  const pendingOrders = orders.filter((o) => o.status === "STORE_PENDING");
  const deliveryAcceptedOrders = orders.filter(
    (o) => o.status === "DELIVERY_ACCEPTED"
  );

  return (
    <div className="store-page">
      <aside className="store-sidebar">
        <h2>🏪 MegaMarto Store</h2>
        <p>{storeUser.storeName || "Store Dashboard"}</p>

        <button
          className={tab === "products" ? "active" : ""}
          onClick={() => setTab("products")}
        >
          📦 Products
        </button>

        <button
          className={tab === "orders" ? "active" : ""}
          onClick={() => {
            setTab("orders");
            void loadOrders();
          }}
        >
          🧾 Orders
        </button>

        <button
          className={tab === "notifications" ? "active" : ""}
          onClick={() => {
            setTab("notifications");
            void loadOrders();
          }}
        >
          🔔 Notifications
        </button>

        <button className="logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="store-main">
        <header className="store-header">
          <div>
            <h1>Store Dashboard</h1>
            <p>Manage products, stock and orders</p>
          </div>

          {tab === "products" ? (
            <button onClick={loadProducts}>Refresh Products</button>
          ) : (
            <button onClick={loadOrders}>Refresh Orders</button>
          )}
        </header>

        {tab === "products" && (
          <>
            <section className="store-stats">
              <div>
                <h3>{products.length}</h3>
                <p>Total Products</p>
              </div>
              <div>
                <h3>{products.reduce((s, p) => s + p.stock, 0)}</h3>
                <p>Total Stock</p>
              </div>
              <div>
                <h3>₹{products.reduce((s, p) => s + p.price, 0)}</h3>
                <p>Product Value</p>
              </div>
            </section>

            <section className="store-card">
              <h2>Add Product</h2>

              <div className="product-form">
                <input
                  placeholder="Product Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />

                <input
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                />

                <input
                  placeholder="Image URL"
                  value={form.image}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, image: e.target.value }))
                  }
                />

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                >
                  <option>Fruits</option>
                  <option>Dairy</option>
                  <option>Snacks</option>
                  <option>Grocery</option>
                  <option>Fresh</option>
                  <option>Beauty</option>
                  <option>Home</option>
                </select>

                <input
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, stock: e.target.value }))
                  }
                />

                <button onClick={addProduct}>Add Product</button>
              </div>
            </section>

            <section className="store-card">
              <h2>My Products</h2>

              <div className="products-grid">
                {products.length === 0 ? (
                  <p>No products found. Click Refresh Products.</p>
                ) : (
                  products.map((p) => (
                    <div className="product-card" key={p._id}>
                      <img
                        src={p.image || "https://via.placeholder.com/150"}
                        alt={p.name}
                      />
                      <h3>{p.name}</h3>
                      <p className="category">{p.category}</p>
                      <h2>₹{p.price}</h2>
                      <p>Stock: {p.stock}</p>
                      <button onClick={() => deleteProduct(p._id)}>
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {tab === "orders" && (
          <section className="store-card">
            <h2>Store Orders</h2>

            {orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              orders.map((order) => (
                <div className="order-card" key={order._id}>
                  <h3>Order #{order._id.slice(-6)}</h3>
                  <p><b>Total:</b> ₹{order.total}</p>
                  <p><b>Status:</b> {order.status.replaceAll("_", " ")}</p>
                  <p>
                    <b>Payment:</b> {order.paymentMethod} /{" "}
                    {order.paymentStatus}
                  </p>

                  <h4>Items</h4>
                  {order.items?.map((item, i) => (
                    <p key={i}>
                      {item.name} x {item.qty} = ₹{item.price * item.qty}
                    </p>
                  ))}

                  <h4>Customer</h4>
                  <p>{order.address?.name}</p>
                  <p>{order.address?.phone}</p>
                  <p>
                    {order.address?.street}, {order.address?.city},{" "}
                    {order.address?.pincode}
                  </p>

                  {order.deliveryBoy && (
                    <>
                      <h4>🚴 Delivery Boy</h4>
                      <p>Name: {order.deliveryBoy.name}</p>
                      <p>Phone: {order.deliveryBoy.phone}</p>
                      <p>Bike: {order.deliveryBoy.bikeNumber || "N/A"}</p>
                    </>
                  )}

                  {order.status === "STORE_PENDING" && (
                    <div className="order-actions">
                      <button onClick={() => acceptOrder(order._id)}>
                        Accept Order
                      </button>
                      <button
                        className="danger"
                        onClick={() => cancelOrder(order._id)}
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {tab === "notifications" && (
          <section className="store-card">
            <h2>Notifications</h2>

            {pendingOrders.length === 0 && deliveryAcceptedOrders.length === 0 ? (
              <p>No new notifications.</p>
            ) : (
              <>
                {pendingOrders.map((order) => (
                  <div className="notification-card" key={order._id}>
                    <span>
                      🔔 New order received #{order._id.slice(-6)} — ₹
                      {order.total}
                    </span>
                    <button onClick={() => acceptOrder(order._id)}>
                      Accept
                    </button>
                  </div>
                ))}

                {deliveryAcceptedOrders.map((order) => (
                  <div className="notification-card" key={order._id}>
                    <span>
                      🚴 Delivery boy accepted order #{order._id.slice(-6)}
                      {order.deliveryBoy?.name
                        ? ` — ${order.deliveryBoy.name}`
                        : ""}
                      {order.deliveryBoy?.phone
                        ? ` (${order.deliveryBoy.phone})`
                        : ""}
                    </span>
                  </div>
                ))}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}