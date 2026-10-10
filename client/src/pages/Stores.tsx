import { useState, useEffect, useRef } from "react";

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

type GPS = { lat: number; lng: number };
type LeafletMap = { setView: (coords: [number, number], zoom: number) => LeafletMap; on: (event: string, cb: (event: { latlng: GPS }) => void) => void; remove: () => void; invalidateSize: () => void };
type LeafletMarker = { setLatLng: (coords: [number, number]) => void; on: (event: string, cb: (event: { target: { getLatLng: () => GPS } }) => void) => void; addTo: (map: LeafletMap) => LeafletMarker };
type LeafletAPI = { map: (el: HTMLElement) => LeafletMap; tileLayer: (url: string, opts: { attribution: string; maxZoom: number }) => { addTo: (map: LeafletMap) => void }; marker: (coords: [number, number], opts: { draggable: boolean }) => LeafletMarker };
declare global { interface Window { L?: LeafletAPI } }
let leafletPromise: Promise<void> | undefined;
function loadLeaflet(): Promise<void> {
  if (window.L) return Promise.resolve();
  if (!leafletPromise) {
    leafletPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-megamarto-map]')) {
        const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; css.dataset.megamartoMap = "1"; document.head.appendChild(css);
      }
      const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = () => resolve(); script.onerror = () => { leafletPromise = undefined; reject(new Error("Map could not load. Check internet connection.")); }; document.head.appendChild(script);
    });
  }
  return leafletPromise;
}
function StoreLocationMap({ value, onChange }: { value: GPS | null; onChange: (point: GPS) => void }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const pin = useRef<LeafletMarker | null>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const [mapError, setMapError] = useState("");
  useEffect(() => {
    let active = true;
    loadLeaflet().then(() => {
      if (!active || !element.current || !window.L) return;
      const L = window.L;
      const start: [number, number] = value ? [value.lat, value.lng] : [16.9891, 81.7837];
      const instance = L.map(element.current).setView(start, value ? 17 : 12);
      map.current = instance;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(instance);
      const marker = L.marker(start, { draggable: true }).addTo(instance);
      pin.current = marker;
      instance.on("click", event => callback.current({ lat: event.latlng.lat, lng: event.latlng.lng }));
      marker.on("dragend", event => { const p = event.target.getLatLng(); callback.current({ lat: p.lat, lng: p.lng }); });
      setTimeout(() => { if (active) instance.invalidateSize(); }, 100);
    }).catch(err => { if (active) setMapError(String(err)); });
    return () => { active = false; map.current?.remove(); map.current = null; pin.current = null; };
  }, []);
  useEffect(() => {
    if (value && map.current && pin.current) { pin.current.setLatLng([value.lat, value.lng]); map.current.setView([value.lat, value.lng], 17); }
  }, [value?.lat, value?.lng]);
  return <div style={{ marginTop: 14, width: "100%", minWidth: 0 }}>
    <strong>📍 Select exact store pickup location</strong>
    <p style={{ margin: "5px 0 10px", fontSize: 13 }}>Tap anywhere on the map or drag the green pin to the shop entrance. Zoom in for accuracy.</p>
    <div ref={element} style={{ width: "100%", height: 300, borderRadius: 12, border: "1px solid #d8e5db", zIndex: 0 }} />
    {mapError && <p role="alert">{mapError}</p>}
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
      <label style={{ flex: "1 1 130px" }}>Latitude<input type="number" step="any" value={value?.lat ?? ""} placeholder="Latitude" onChange={e => { const lat = Number(e.target.value); if (e.target.value !== "" && lat >= -90 && lat <= 90) onChange({ lat, lng: value?.lng ?? 81.7837 }); }} /></label>
      <label style={{ flex: "1 1 130px" }}>Longitude<input type="number" step="any" value={value?.lng ?? ""} placeholder="Longitude" onChange={e => { const lng = Number(e.target.value); if (e.target.value !== "" && lng >= -180 && lng <= 180) onChange({ lat: value?.lat ?? 16.9891, lng }); }} /></label>
    </div>
    {value && <a href={`https://www.google.com/maps/search/?api=1&query=${value.lat},${value.lng}`} target="_blank" rel="noopener noreferrer">Preview selected pickup location in Google Maps ↗</a>}
  </div>;
}

const API = "https://megamarto-backend.onrender.com";

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [editingGPS, setEditingGPS] = useState<{ id: string; location: GPS | null } | null>(null);

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
        <StoreLocationMap value={form.location} onChange={location => setForm(prev => ({ ...prev, location }))} />
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
            <button type="button" onClick={() => setEditingGPS({ id: store._id, location: store.location ?? null })}>🗺 Change Location on Map</button>
            {editingGPS?.id === store._id && <div style={{ marginTop: 14, padding: 12, background: "#f6faf7", borderRadius: 12 }}>
              <StoreLocationMap value={editingGPS.location} onChange={location => setEditingGPS({ id: store._id, location })} />
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" disabled={locating} onClick={() => {
                  if (!navigator.geolocation) { alert("GPS not supported"); return; }
                  setLocating(true);
                  navigator.geolocation.getCurrentPosition(pos => { setEditingGPS({ id: store._id, location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }); setLocating(false); }, err => { alert(err.message); setLocating(false); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
                }}>📍 Use Current GPS</button>
                <button type="button" disabled={loading || !editingGPS.location} onClick={async () => {
                  if (!editingGPS.location || !window.confirm("Save this exact pickup point for delivery partners?")) return;
                  setLoading(true);
                  try {
                    const response = await fetch(`${API}/admin/stores/${store._id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ location: editingGPS.location }) });
                    const data: { message?: string } = await response.json();
                    if (!response.ok) throw new Error(data.message || "Could not update pickup GPS");
                    setEditingGPS(null); await loadStores();
                  } catch (err) { alert(err instanceof Error ? err.message : "Unable to save location"); }
                  finally { setLoading(false); }
                }}>Save Pickup Location</button>
                <button type="button" onClick={() => setEditingGPS(null)}>Cancel</button>
              </div>
            </div>}

            <button onClick={() => deleteStore(store._id)} disabled={loading}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}