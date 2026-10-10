import { useState } from "react";

type Store = {
  _id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  location?: { lat: number; lng: number };
};

type StoreForm = {
  storeName: string;
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  location: { lat: number; lng: number } | null;
};

const API = "https://megamarto-backend.onrender.com";

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState<StoreForm>({
    storeName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    location: null,
  });

  const token = localStorage.getItem("adminToken") || "";

  const loadStores = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/admin/stores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: Store[] | { message?: string } = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        alert("Stores loading failed");
        return;
      }

      setStores(data);
    } catch (err) {
      console.error("LOAD STORES ERROR:", err);
      alert("Could not connect to MegaMarto backend. Check Render logs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const captureStoreLocation = () => {
    if (!navigator.geolocation) { alert("GPS is not supported on this device"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({ ...prev, location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }));
        setLocating(false);
      },
      (error) => { alert("Location not saved: " + error.message + ". Allow location access at the shop and retry."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const createStore = async () => {
    if (
      !form.storeName ||
      !form.ownerName ||
      !form.email ||
      !form.password ||
      !form.phone ||
      !form.address || !form.location
    ) {
      alert("Please fill all store details");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/admin/stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data: { message?: string } = await res.json();

      if (!res.ok) {
        alert(data.message || "Store create failed");
        return;
      }

      alert(data.message || "Store created successfully");

      setForm({
        storeName: "",
        ownerName: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        location: null,
      });

      await loadStores();
    } catch (err) {
      console.error("CREATE STORE ERROR:", err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  const deleteStore = async (id: string) => {
    if (!window.confirm("Delete Store?")) return;

    try {
      setLoading(true);

      const res = await fetch(`${API}/admin/stores/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: { message?: string } = await res.json();

      if (!res.ok) {
        alert(data.message || "Delete failed");
        return;
      }

      alert(data.message || "Store deleted");

      await loadStores();
    } catch (err) {
      console.error("DELETE STORE ERROR:", err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🏪 Stores</h2>

      <button onClick={loadStores} disabled={loading}>
        {loading ? "Loading..." : "Load Stores"}
      </button>

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        <h3>Create Store</h3>

        <input
          placeholder="Store Name"
          value={form.storeName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, storeName: e.target.value }))
          }
        />

        <input
          placeholder="Owner Name"
          value={form.ownerName}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, ownerName: e.target.value }))
          }
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, email: e.target.value }))
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, password: e.target.value }))
          }
        />

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, phone: e.target.value }))
          }
        />

        <input
          placeholder="Address"
          value={form.address}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, address: e.target.value }))
          }
        />

        <div style={{ margin: "12px 0", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" disabled={locating} onClick={captureStoreLocation}>{locating ? "Getting shop GPS..." : "📍 Use Current Shop Location"}</button>
          {form.location ? <span>Pickup GPS saved: {form.location.lat.toFixed(5)}, {form.location.lng.toFixed(5)}</span> : <span>Stand at the shop and allow location permission to save pickup point.</span>}
        </div>
        <button onClick={createStore} disabled={loading}>
          {loading ? "Please wait..." : "Create Store"}
        </button>
      </div>

      <h3>All Stores</h3>

      {stores.length === 0 ? (
        <p>No stores loaded. Click Load Stores.</p>
      ) : (
        stores.map((store) => (
          <div
            key={store._id}
            style={{
              background: "#fff",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "10px",
            }}
          >
            <h4>{store.storeName}</h4>

            <p>Owner: {store.ownerName}</p>
            <p>Email: {store.email}</p>
            <p>Phone: {store.phone}</p>
            <p>Address: {store.address}</p>
            <p>Pickup GPS: {store.location?.lat != null && store.location?.lng != null ? `${store.location.lat.toFixed(5)}, ${store.location.lng.toFixed(5)}` : "Not set (older store)"}</p>
            <button type="button" disabled={loading || locating} onClick={() => {
              if (!navigator.geolocation) { alert("GPS not supported"); return; }
              if (!window.confirm("Are you physically at this shop? Save current GPS as its pickup point?")) return;
              setLocating(true);
              navigator.geolocation.getCurrentPosition(async pos => {
                try {
                  const response = await fetch(`${API}/admin/stores/${store._id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }) });
                  if (!response.ok) throw new Error("Unable to save GPS");
                  await loadStores();
                } catch (err) { alert(err instanceof Error ? err.message : "Unable to save GPS"); }
                finally { setLocating(false); }
              }, err => { alert(err.message); setLocating(false); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
            }}>📍 Update Pickup GPS</button>

            <button onClick={() => deleteStore(store._id)} disabled={loading}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}