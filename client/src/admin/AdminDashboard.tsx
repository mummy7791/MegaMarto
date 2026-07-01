import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ProductsPage from "../pages/productpage";
import AdminOrders from "./AdminOrders";
import Stores from "../pages/Stores";
import "./AdminDashboard.css";

type Stats = {
  orders: number;
  users: number;
  products: number;
  stores?: number;
  deliveryBoys?: number;
  totalRevenue: number;
};

type Order = {
  _id: string;
  total: number;
  status: string;
  address?: {
    name?: string;
  };
};

type DeliveryBoy = {
  _id: string;
  name: string;
  phone?: string;
  bikeNumber?: string;
};

type TabType =
  | "dashboard"
  | "stores"
  | "add"
  | "products"
  | "orders"
  | "delivery";

const API = "http://localhost:5000";

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabType>("dashboard");

  const [stats, setStats] = useState<Stats>({
    orders: 0,
    users: 0,
    products: 0,
    stores: 0,
    deliveryBoys: 0,
    totalRevenue: 0,
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [boys, setBoys] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(true);

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    image: "",
    category: "Grocery",
    stock: "10",
    description: "",
  });

  const [boyForm, setBoyForm] = useState({
    name: "",
    phone: "",
    address: "",
    bikeNumber: "",
    username: "",
    password: "",
  });

  const token = localStorage.getItem("adminToken");

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const loadAdminData = useCallback(async () => {
    try {
      if (!token || token === "undefined" || token === "null") {
        window.location.href = "/login";
        return;
      }

      const [statsRes, ordersRes, boysRes] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers: authHeaders }),
        fetch(`${API}/admin/orders`, { headers: authHeaders }),
        fetch(`${API}/admin/delivery-boys`, { headers: authHeaders }),
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      const boysData = await boysRes.json();

      if (statsRes.ok) setStats(statsData);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setBoys(Array.isArray(boysData) ? boysData : []);
    } catch (err) {
      console.log("ADMIN LOAD ERROR:", err);
      toast.error("Admin data loading failed");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAdminData]);

  const logoutAdmin = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/login";
  };

  const addProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast.error("Please fill product name and price");
      return;
    }

    const res = await fetch(`${API}/products`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        isAvailable: true,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message || "Product add failed");
      return;
    }

    toast.success("Product added successfully");

    setProductForm({
      name: "",
      price: "",
      image: "",
      category: "Grocery",
      stock: "10",
      description: "",
    });

    await loadAdminData();
  };

  const createDeliveryBoy = async () => {
    if (!boyForm.name || !boyForm.phone || !boyForm.username || !boyForm.password) {
      toast.error("Please fill delivery boy details");
      return;
    }

    const res = await fetch(`${API}/admin/delivery-boys`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(boyForm),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data?.message || "Delivery boy create failed");
      return;
    }

    toast.success("Delivery boy created 🚴");

    setBoyForm({
      name: "",
      phone: "",
      address: "",
      bikeNumber: "",
      username: "",
      password: "",
    });

    await loadAdminData();
  };

  const revenue = stats.totalRevenue || orders.reduce((s, o) => s + o.total, 0);
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const activeOrders = orders.filter((o) => o.status !== "DELIVERED").length;

  if (loading) {
    return <div className="zepto-admin-loading">Loading Admin Panel...</div>;
  }

  return (
    <div className="zepto-admin">
      <aside className="za-sidebar">
        <div className="za-logo">⚡ MegaMarto</div>
        <p className="za-subtitle">Quick Commerce Admin</p>

        <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>📊 Dashboard</button>
        <button className={tab === "stores" ? "active" : ""} onClick={() => setTab("stores")}>🏪 Stores</button>
        <button className={tab === "add" ? "active" : ""} onClick={() => setTab("add")}>➕ Add Product</button>
        <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>📦 Products</button>
        <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>🧾 Orders</button>
        <button className={tab === "delivery" ? "active" : ""} onClick={() => setTab("delivery")}>🚴 Delivery Boys</button>

        <button className="za-logout" onClick={logoutAdmin}>Logout</button>
      </aside>

      <main className="za-main">
        <header className="za-topbar">
          <div>
            <h1>
              {tab === "dashboard" && "Dashboard"}
              {tab === "stores" && "Stores"}
              {tab === "add" && "Add Product"}
              {tab === "products" && "Products"}
              {tab === "orders" && "Orders"}
              {tab === "delivery" && "Delivery Boys"}
            </h1>
            <p>Live MegaMarto admin control center</p>
          </div>

          <div className="za-search">
            🔍 <input placeholder="Search orders, products..." />
          </div>

          <div className="za-admin-user">🔔 👋 Admin</div>
        </header>

        {tab === "dashboard" && (
          <>
            <section className="za-stats">
              <div className="za-stat purple"><span>🧾</span><h2>{stats.orders}</h2><p>Total Orders</p></div>
              <div className="za-stat green"><span>💰</span><h2>₹{revenue}</h2><p>Total Revenue</p></div>
              <div className="za-stat orange"><span>📦</span><h2>{stats.products}</h2><p>Products</p></div>
              <div className="za-stat pink"><span>🏪</span><h2>{stats.stores || 0}</h2><p>Stores</p></div>
              <div className="za-stat pink"><span>🚴</span><h2>{boys.length}</h2><p>Delivery Boys</p></div>
            </section>

            <section className="za-dashboard-grid">
              <div className="za-card">
                <div className="za-card-head"><h2>Revenue Analytics</h2><span>This Week</span></div>
                <div className="za-chart">
                  <div style={{ height: "45%" }} />
                  <div style={{ height: "70%" }} />
                  <div style={{ height: "40%" }} />
                  <div style={{ height: "85%" }} />
                  <div style={{ height: "60%" }} />
                  <div style={{ height: "95%" }} />
                  <div style={{ height: "75%" }} />
                </div>
              </div>

              <div className="za-card">
                <div className="za-card-head"><h2>Order Summary</h2></div>
                <div className="za-summary">
                  <p>Active Orders <b>{activeOrders}</b></p>
                  <p>Delivered <b>{delivered}</b></p>
                  <p>Customers <b>{stats.users}</b></p>
                  <p>Products <b>{stats.products}</b></p>
                  <p>Stores <b>{stats.stores || 0}</b></p>
                </div>
              </div>
            </section>
          </>
        )}

        {tab === "stores" && <section className="za-card za-page-card"><Stores /></section>}

        {tab === "add" && (
          <section className="za-card za-delivery-form">
            <h2>Add Product</h2>

            <input placeholder="Product Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            <input placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
            <input placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} />
            <input placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />

            <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
              <option>Fruits</option>
              <option>Dairy</option>
              <option>Snacks</option>
              <option>Grocery</option>
            </select>

            <button onClick={addProduct}>Add Product</button>
          </section>
        )}

        {tab === "products" && <section className="za-card za-page-card"><ProductsPage /></section>}
        {tab === "orders" && <section className="za-card za-page-card"><AdminOrders /></section>}

        {tab === "delivery" && (
          <section className="za-delivery-layout">
            <div className="za-card za-delivery-form">
              <h2>Create Delivery Boy 🚴</h2>

              <input placeholder="Name" value={boyForm.name} onChange={(e) => setBoyForm({ ...boyForm, name: e.target.value })} />
              <input placeholder="Phone" value={boyForm.phone} onChange={(e) => setBoyForm({ ...boyForm, phone: e.target.value })} />
              <input placeholder="Address" value={boyForm.address} onChange={(e) => setBoyForm({ ...boyForm, address: e.target.value })} />
              <input placeholder="Bike Number" value={boyForm.bikeNumber} onChange={(e) => setBoyForm({ ...boyForm, bikeNumber: e.target.value })} />
              <input placeholder="Username" value={boyForm.username} onChange={(e) => setBoyForm({ ...boyForm, username: e.target.value })} />
              <input type="password" placeholder="Password" value={boyForm.password} onChange={(e) => setBoyForm({ ...boyForm, password: e.target.value })} />

              <button onClick={createDeliveryBoy}>Create Delivery Boy</button>
            </div>

            <div className="za-card">
              <h2>Delivery Partners</h2>

              <div className="za-boys-list">
                {boys.length === 0 ? (
                  <p>No delivery boys found</p>
                ) : (
                  boys.map((boy) => (
                    <div className="za-boy" key={boy._id}>
                      <div>
                        <h3>🚴 {boy.name}</h3>
                        <p>📞 {boy.phone || "N/A"}</p>
                        <p>🏍 {boy.bikeNumber || "Bike not added"}</p>
                      </div>
                      <span>Online</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}