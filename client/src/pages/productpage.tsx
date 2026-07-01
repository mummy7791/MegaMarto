import { useEffect, useState, useCallback, useRef } from "react";

type Product = {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
};

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);

  const tokenRef = useRef(localStorage.getItem("token"));

  // prevent duplicate calls
  const isFetched = useRef(false);

  // ✅ FETCH PRODUCTS (safe + stable)
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/products", {
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
      await fetch(`http://localhost:5000/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });

      fetchProducts();
    } catch (err) {
      console.log(err);
    }
  };

  // ✏️ UPDATE PRODUCT
  const updateProduct = async () => {
    if (!editing) return;

    try {
      await fetch(`http://localhost:5000/products/${editing._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify(editing),
      });

      setEditing(null);
      fetchProducts();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📦 Products</h2>

      {/* PRODUCTS LIST */}
      <div style={{ display: "grid", gap: 10 }}>
        {products.map((p) => (
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
              <p>Stock: {p.stock}</p>
            </div>

            <button onClick={() => setEditing(p)}>✏️ Edit</button>
            <button onClick={() => deleteProduct(p._id)}>🗑 Delete</button>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ background: "white", padding: 20, borderRadius: 10 }}>
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