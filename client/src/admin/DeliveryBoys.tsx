import { useEffect, useState, useCallback, useRef } from "react";

/* ================= TYPES ================= */
type DeliveryBoy = {
  _id: string;
  name: string;
  phone: string;
  address: string;
  bikeNumber: string;
  username: string;
};

/* ================= COMPONENT ================= */
export default function DeliveryBoys() {
  const [boys, setBoys] = useState<DeliveryBoy[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    bikeNumber: "",
    username: "",
    password: "",
  });

  const [editId, setEditId] = useState<string | null>(null);

  const token = localStorage.getItem("token");
  const didFetch = useRef(false);

  /* ================= STRONG INPUT STYLE (FIX UI ISSUE) ================= */
  const inputStyle = {
    display: "block",
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    border: "2px solid #333",
    borderRadius: "8px",
    outline: "none",
    backgroundColor: "#fff",
    color: "#000",
    fontSize: "14px",
  };

  /* ================= FETCH ================= */
  const fetchBoys = useCallback(async () => {
    try {
      const res = await fetch(
        "https://megamarto-backend.onrender.com/admin/delivery-boys",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      setBoys(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
      setBoys([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchBoys();
  }, [fetchBoys]);

  /* ================= CREATE / UPDATE ================= */
  const createBoy = async () => {
    try {
      if (
        !form.name ||
        !form.phone ||
        !form.address ||
        !form.bikeNumber ||
        !form.username ||
        (!editId && !form.password)
      ) {
        alert("All fields required");
        return;
      }

      const url = editId
        ? `https://megamarto-backend.onrender.com/admin/delivery-boy/${editId}`
        : "https://megamarto-backend.onrender.com/admin/delivery-boys";

      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Failed");
        return;
      }

      alert(editId ? "Updated ✅" : "Created ✅");

      setEditId(null);
      setForm({
        name: "",
        phone: "",
        address: "",
        bikeNumber: "",
        username: "",
        password: "",
      });

      fetchBoys();
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= DELETE ================= */
  const deleteBoy = async (id: string) => {
    try {
      const res = await fetch(
        `https://megamarto-backend.onrender.com/admin/delivery-boy/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Delete failed");
        return;
      }

      alert("Deleted ✅");
      fetchBoys();
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= EDIT ================= */
  const editBoy = (boy: DeliveryBoy) => {
    setEditId(boy._id);

    setForm({
      name: boy.name,
      phone: boy.phone,
      address: boy.address,
      bikeNumber: boy.bikeNumber,
      username: boy.username,
      password: "",
    });
  };

  /* ================= UI ================= */
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>🚴 Delivery Boys Management</h2>

      {/* ================= FORM ================= */}
      <div
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3>
          {editId ? "✏️ Edit Delivery Boy" : "Create Delivery Boy"}
        </h3>

        {/* GRID FORM */}
        <div style={{ display: "grid", gap: "10px" }}>
          <input
            style={inputStyle}
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="Bike Number"
            value={form.bikeNumber}
            onChange={(e) =>
              setForm({ ...form, bikeNumber: e.target.value })
            }
          />

          <input
            style={inputStyle}
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
          />

          {!editId && (
            <input
              style={inputStyle}
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          )}
        </div>

        <button
          onClick={createBoy}
          style={{
            marginTop: 10,
            padding: 12,
            background: editId ? "orange" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            width: "100%",
          }}
        >
          {editId ? "Update Delivery Boy" : "Create Delivery Boy"}
        </button>
      </div>

      {/* ================= LIST ================= */}
      <h3>All Delivery Boys</h3>

      {loading && <p>Loading...</p>}

      {!loading && boys.length === 0 && (
        <p>No delivery boys created</p>
      )}

      {boys.map((b) => (
        <div
          key={b._id}
          style={{
            background: "#f9fafb",
            padding: 15,
            marginBottom: 10,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        >
          <p><b>Name:</b> {b.name}</p>
          <p>📞 {b.phone}</p>
          <p>🏠 {b.address}</p>
          <p>🏍️ {b.bikeNumber}</p>
          <p>👤 {b.username}</p>

          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => deleteBoy(b._id)}
              style={{
                background: "red",
                color: "#fff",
                marginRight: 10,
                padding: "6px 10px",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              ❌ Delete
            </button>

            <button
              onClick={() => editBoy(b)}
              style={{
                background: "orange",
                color: "#fff",
                padding: "6px 10px",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              ✏️ Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}