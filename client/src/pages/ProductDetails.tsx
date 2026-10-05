import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProductDetails.css";

type Product = {
  _id: string; name: string; price: number; image: string; category: string;
  mrp?: number; unit?: string; stock?: number; rating?: number; description?: string;
  discountPercent?: number; qty?: number;
};

const API_URL = "https://megamarto-backend.onrender.com";
const fallbackImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((p) => {
        setProduct(p);
        const cart: Product[] = JSON.parse(localStorage.getItem("cart") || "[]");
        setQty(cart.find((x) => x._id === p._id)?.qty || 0);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const updateQty = (next: number) => {
    if (!product) return;
    const safe = Math.max(0, Math.min(next, product.stock ?? 99));
    const cart: Product[] = JSON.parse(localStorage.getItem("cart") || "[]");
    const exists = cart.some((x) => x._id === product._id);
    const updated = safe === 0
      ? cart.filter((x) => x._id !== product._id)
      : exists
        ? cart.map((x) => x._id === product._id ? { ...x, qty: safe } : x)
        : [...cart, { ...product, qty: safe }];
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
    setQty(safe);
  };

  if (loading) return <div className="pd-state">Loading product…</div>;
  if (!product) return <div className="pd-state"><h2>Product not found</h2><button onClick={() => navigate("/")}>Back to shopping</button></div>;

  const mrp = product.mrp && product.mrp > product.price ? product.mrp : product.price + 40;
  const discount = Math.round(((mrp - product.price) / mrp) * 100);

  return <main className="pd-page">
    <button className="pd-back" onClick={() => navigate(-1)}>← Back</button>
    <section className="pd-card">
      <div className="pd-image-wrap">
        <span className="pd-off">{discount}% OFF</span>
        <img src={product.image || fallbackImage} alt={product.name} onError={(e) => { e.currentTarget.onerror=null; e.currentTarget.src=fallbackImage; }} />
      </div>
      <div className="pd-info">
        <span className="pd-category">{product.category}</span>
        <h1>{product.name}</h1>
        <p className="pd-unit">{product.unit || "1 pack"}</p>
        <div className="pd-rating">★ {product.rating || 4.5} <span>Quality checked</span></div>
        <div className="pd-price"><strong>₹{product.price}</strong><del>₹{mrp}</del><b>{discount}% OFF</b></div>
        <div className="pd-delivery"><strong>⚡ Delivery in 10–20 minutes</strong><span>Freshly picked and packed for your order</span></div>
        <div className="pd-stock">{(product.stock ?? 10) > 5 ? "In stock" : `Only ${product.stock ?? 0} left in stock`}</div>
        <p className="pd-description">{product.description || "Fresh, quality-checked product from MegaMarto. Carefully packed for safe and fast delivery."}</p>
        <div className="pd-buy">
          {qty === 0 ? <button className="pd-add" disabled={product.stock === 0} onClick={() => updateQty(1)}>{product.stock === 0 ? "Sold out" : "Add to cart"}</button>
          : <div className="pd-qty"><button onClick={() => updateQty(qty-1)}>−</button><b>{qty}</b><button onClick={() => updateQty(qty+1)}>+</button></div>}
          <button className="pd-cart" onClick={() => navigate("/cart")}>View cart →</button>
        </div>
        <div className="pd-trust"><span>✓ Secure payments</span><span>✓ Easy support</span><span>✓ Quality assured</span></div>
      </div>
    </section>
  </main>;
}
