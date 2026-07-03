import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "./StoreDashboard.css";

type Product = {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
};

const API = "https://megamarto-backend.onrender.com";

export default function StoreAddProduct() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
    category: "Grocery",
    stock: "10",
  });

  const token = localStorage.getItem("storeToken") || "";

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Products loading failed");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select image only");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        image: reader.result as string,
      }));
    };

    reader.readAsDataURL(file);
  };

  const createProduct = async () => {
    if (!form.name || !form.price || !form.image || !form.category || !form.stock) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          price: Number(form.price),
          image: form.image,
          category: form.category,
          stock: Number(form.stock),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Product create failed");
        return;
      }

      toast.success("Product created ✅");

      setForm({
        name: "",
        price: "",
        image: "",
        category: "Grocery",
        stock: "10",
      });

      loadProducts();
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="store-page">
      <h1>🏪 Store Add Product</h1>

      <div className="store-product-form">
        <input
          placeholder="Product Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <label className="store-image-upload">
          📷 Choose Image
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </label>

        {form.image && (
          <img className="store-image-preview" src={form.image} alt="Preview" />
        )}

        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option>Grocery</option>
          <option>Fresh</option>
          <option>Dairy</option>
          <option>Snacks</option>
          <option>Drinks</option>
          <option>Beauty</option>
          <option>Home</option>
          <option>Electronics</option>
        </select>

        <input
          placeholder="Stock"
          type="number"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
        />

        <button onClick={createProduct} disabled={loading}>
          {loading ? "Creating..." : "Create Product"}
        </button>
      </div>

      <h2>All Products</h2>

      <div className="store-products-grid">
        {products.map((p) => (
          <div className="store-product-card" key={p._id}>
            <img src={p.image} alt={p.name} />
            <h3>{p.name}</h3>
            <b>{p.category}</b>
            <p>₹{p.price}</p>
            <p>Stock: {p.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
}