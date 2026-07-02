import { useState, type ChangeEvent } from "react";

type ProductForm = {
  name: string;
  price: string;
  image: string;
  category: string;
  stock: string;
  description: string;
};

type FormKeys = keyof ProductForm;

function AddProduct() {
  const [form, setForm] = useState<ProductForm>({
    name: "",
    price: "",
    image: "",
    category: "Fruits",
    stock: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const name = e.target.name as FormKeys;

    setForm((prev) => ({
      ...prev,
      [name]: e.target.value,
    }));
  };

  const handleAdd = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Login required");
      return;
    }

    if (!form.name || !form.price || !form.image || !form.category) {
      alert("Please fill required fields");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://https://megamarto-backend.onrender.com/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          image: form.image,
          category: form.category,
          stock: Number(form.stock || 0),
          description: form.description,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        alert("Session expired, login again");
        localStorage.removeItem("token");
        return;
      }

      if (!res.ok) {
        alert(data.message || "Failed to add product");
        return;
      }

      alert("Product added successfully 🚀");

      setForm({
        name: "",
        price: "",
        image: "",
        category: "Fruits",
        stock: "",
        description: "",
      });
    } catch (err) {
      console.log(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>➕ Add Product</h2>

      <input
        name="name"
        placeholder="Product Name"
        value={form.name}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        name="price"
        type="number"
        placeholder="Price"
        value={form.price}
        onChange={handleChange}
        style={styles.input}
      />

      <input
        name="image"
        placeholder="Image URL"
        value={form.image}
        onChange={handleChange}
        style={styles.input}
      />

      {/* CATEGORY DROPDOWN */}
      <select
        name="category"
        value={form.category}
        onChange={handleChange}
        style={styles.input}
      >
        <option value="Fruits">Fruits</option>
        <option value="Dairy">Dairy</option>
        <option value="Snacks">Snacks</option>
        <option value="Grocery">Grocery</option>
      </select>

      <input
        name="stock"
        type="number"
        placeholder="Stock"
        value={form.stock}
        onChange={handleChange}
        style={styles.input}
      />

      <textarea
        name="description"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
        style={styles.textarea}
      />

      <button
        onClick={handleAdd}
        disabled={loading}
        style={{
          ...styles.button,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Adding..." : "➕ Add Product"}
      </button>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  container: {
    maxWidth: 450,
    margin: "auto",
    padding: 20,
    background: "white",
    borderRadius: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: 10,
    margin: "8px 0",
    borderRadius: 6,
    border: "1px solid #ccc",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: 10,
    margin: "8px 0",
    borderRadius: 6,
    border: "1px solid #ccc",
    height: 80,
  },
  button: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default AddProduct;