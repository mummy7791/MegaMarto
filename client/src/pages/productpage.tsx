import { useEffect, useState, useCallback, useRef } from "react";

type Product = {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  mrp?: number;
  unit?: string;
  isAvailable?: boolean;
  storeName?: string;
};

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const tokenRef = useRef(localStorage.getItem("adminToken"));

  // prevent duplicate calls
  const isFetched = useRef(false);

  // ✅ FETCH PRODUCTS (safe + stable)
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("https://megamarto-backend.onrender.com/admin/products", {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.log("Fetch error:", err);
      setProducts([]);
    }
  }, []);

  // ✅ FIXED useEffect (no loop, no warning)
  useEffect(() => {
    if (isFetched.current) return;
    isFetched.current = true;

    fetchProducts();
  }, [fetchProducts]);

  // ❌ DELETE PRODUCT
  const deleteProduct = async (id: string) => {
    try {
      if (!window.confirm("Delete this product permanently?")) return;
      const response = await fetch(`https://megamarto-backend.onrender.com/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });

      if (!response.ok) { window.alert("Delete failed"); return; }
      fetchProducts();
    } catch (err) {
      console.log(err);
    }
  };

  // ✏️ UPDATE PRODUCT
  const updateProduct = async () => {
    if (!editing) return;

    try {
      if (!Number.isInteger(editing.stock) || editing.stock < 0 || editing.price <= 0 || (editing.mrp || editing.price) < editing.price) { window.alert("Enter valid price, MRP and stock"); return; }
      const response = await fetch(`https://megamarto-backend.onrender.com/admin/products/${editing._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify(editing),
      });

      if (!response.ok) { window.alert("Product update failed"); return; }
      setEditing(null);
      fetchProducts();
    } catch (err) {
      console.log(err);
    }
  };

  const visible = products.filter(p => {
    const matches = `${p.name} ${p.category} ${p.storeName || ""}`.toLowerCase().includes(search.toLowerCase());
    return matches && (filter === "all" || (filter === "low" && p.stock > 0 && p.stock <= 5) || (filter === "out" && p.stock === 0) || (filter === "hidden" && p.isAvailable === false));
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>📦 Inventory Management</h2>
      <p>{products.length} products · {products.filter(p => p.stock <= 5).length} low/out of stock</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <input aria-label="Search inventory" placeholder="Search product, category, store" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: "1 1 220px" }} />
        <select aria-label="Filter inventory" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All products</option><option value="low">Low stock (1–5)</option><option value="out">Out of stock</option><option value="hidden">Unavailable</option>
        </select>
        <button onClick={() => void fetchProducts()}>Refresh</button>
      </div>

      {/* PRODUCTS LIST */}
      <div style={{ display: "grid", gap: 10 }}>
        {visible.map((p) => (
          <div
            key={p._id}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              background: "white",
              padding: 10,
              borderRadius: 10,
            }}
          >
            <img src={p.image} width={60} height={60} />

            <div style={{ flex: 1 }}>
              <b>{p.name}</b>
              <p>₹{p.price}</p>
              <p>Stock: {p.stock} {p.stock <= 5 ? "⚠ Low stock" : ""}</p><p>{p.unit || "1 pack"} · MRP ₹{p.mrp || p.price} · {p.storeName || "Marketplace"}</p>
            </div>

            <button onClick={() => setEditing(p)}>✏️ Edit</button>
            <button onClick={() => deleteProduct(p._id)}>🗑 Delete</button>
          </div>
        ))}
      </div>

      {visible.length === 0 && <p>No matching products found.</p>}
      {/* EDIT MODAL */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            padding: 16,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ background: "white", padding: 20, borderRadius: 10, width: "min(100%, 480px)", maxHeight: "90vh", overflowY: "auto" }}>
            <h3>Edit Product</h3>

            <input
              value={editing.name}
              onChange={(e) =>
                setEditing({ ...editing, name: e.target.value })
              }
              placeholder="Name"
            />

            <input
              value={editing.price}
              onChange={(e) =>
                setEditing({ ...editing, price: Number(e.target.value) })
              }
              placeholder="Price"
            />

            <input
              value={editing.image}
              onChange={(e) =>
                setEditing({ ...editing, image: e.target.value })
              }
              placeholder="Image"
            />

            <input placeholder="MRP" type="number" value={editing.mrp ?? editing.price} onChange={(e) => setEditing({ ...editing, mrp: Number(e.target.value) })} />
            <input placeholder="Unit" value={editing.unit || ""} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
            <label><input type="checkbox" checked={editing.isAvailable !== false} onChange={(e) => setEditing({ ...editing, isAvailable: e.target.checked })} /> Available for sale</label>
            <input
              value={editing.stock}
              onChange={(e) =>
                setEditing({ ...editing, stock: Number(e.target.value) })
              }
              placeholder="Stock"
            />

            <div style={{ marginTop: 10 }}>
              <button onClick={updateProduct}>💾 Save</button>
              <button onClick={() => setEditing(null)}>❌ Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;