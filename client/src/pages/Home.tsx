import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

type Product = {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  qty?: number;
};

const API_URL = "https://megamarto-backend.onrender.com";

const tabs = [
  ["All", "🛍️"],
  ["Fresh", "🥬"],
  ["Dairy", "🥛"],
  ["Snacks", "🍿"],
  ["Drinks", "🥤"],
  ["Beauty", "💄"],
  ["Home", "🧹"],
  ["Electronics", "🎧"],
];

const categories = [
  ["Fruits & Vegetables", "Fresh", "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600"],
  ["Dairy, Bread & Eggs", "Dairy", "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600"],
  ["Atta, Rice, Oil & Dals", "Grocery", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600"],
  ["Snacks & Drinks", "Snacks", "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600"],
  ["Tea, Coffee & More", "Cafe", "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600"],
  ["Ice Creams & More", "Ice Cream", "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600"],
  ["Beauty & Care", "Beauty", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600"],
  ["Home Essentials", "Home", "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600"],
];

const offers = [
  ["⚡ 10 Minutes Delivery", "Fresh groceries at your doorstep", "purple"],
  ["🥬 Fresh & Healthy", "Daily fresh fruits and vegetables", "green"],
  ["🎁 FIRST50 Coupon", "Save more on your first order", "pink"],
  ["🛒 MegaMarto Deals", "Daily essentials at best prices", "orange"],
];

function Home() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("All");
  const [location, setLocation] = useState("Select Location");
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [cart, setCart] = useState<Product[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("wishlist") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Location not supported");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        setLocation(value);
        localStorage.setItem("userLocation", value);
        setLoadingLocation(false);
      },
      () => {
        setLocation("Permission denied");
        setLoadingLocation(false);
      }
    );
  }, []);

  const updateCart = (items: Product[]) => {
    setCart(items);
    localStorage.setItem("cart", JSON.stringify(items));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const addToCart = (item: Product) => {
    const exist = cart.find((c) => c._id === item._id);

    if (exist) {
      updateCart(
        cart.map((c) =>
          c._id === item._id ? { ...c, qty: (c.qty || 0) + 1 } : c
        )
      );
    } else {
      updateCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const changeQty = (id: string, type: "inc" | "dec") => {
    const updated = cart
      .map((c) =>
        c._id === id
          ? { ...c, qty: type === "inc" ? (c.qty || 0) + 1 : (c.qty || 0) - 1 }
          : c
      )
      .filter((c) => (c.qty || 0) > 0);

    updateCart(updated);
  };

  const getQty = (id: string) => cart.find((c) => c._id === id)?.qty || 0;

  const toggleWishlist = (id: string) => {
    const updated = wishlist.includes(id)
      ? wishlist.filter((w) => w !== id)
      : [...wishlist, id];

    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
  };

  const cartCount = cart.reduce((s, i) => s + (i.qty || 0), 0);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const cat = p.category.toLowerCase();
      const q = search.toLowerCase();

      const searchOk = name.includes(q) || cat.includes(q);
      const catOk = selected === "All" || cat.includes(selected.toLowerCase());

      return searchOk && catOk;
    });
  }, [products, search, selected]);

  return (
    <main className="mm-home">
      <section className="mm-hero">
        <div className="mm-hero-left">
          <span className="mm-pill">⚡ MegaMarto Fast Delivery</span>

          <h1>
            Groceries delivered
            <b> in minutes</b>
          </h1>

          <p>
            Fresh fruits, dairy, snacks, beauty, home essentials and daily needs
            delivered fast to your doorstep.
          </p>

          <div className="mm-hero-actions">
            <button onClick={getLocation}>
              📍 <span>{loadingLocation ? "Fetching..." : location}</span>
            </button>

            <div className="mm-hero-search">
              🔍
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search for "milk, fruits, snacks"'
              />
            </div>
          </div>

          <div className="mm-quick-actions">
            <button onClick={() => navigate("/customer-login")}>👤 Login</button>
            <button onClick={() => navigate("/customer-register")}>📝 Register</button>
          </div>

          <div className="mm-floating-basket">🛒🥛🍎🥬🍌</div>
        </div>

        <div className="mm-offers">
          {offers.map(([title, text, color]) => (
            <div className={`mm-offer ${color}`} key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <nav className="mm-tabs">
        {tabs.map(([name, icon]) => (
          <button
            key={name}
            className={selected === name ? "active" : ""}
            onClick={() => setSelected(name)}
          >
            <span>{icon}</span>
            {name}
          </button>
        ))}
      </nav>

      <section className="mm-section">
        <div className="mm-section-head">
          <h2>Grocery & Kitchen</h2>
          <button>See All ›</button>
        </div>

        <div className="mm-category-grid">
          {categories.map(([title, key, img]) => (
            <button
              key={title}
              className="mm-category"
              onClick={() => setSelected(key)}
            >
              <img src={img} alt={title} />
              <b>{title}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="mm-section">
        <div className="mm-section-head">
          <h2>{selected === "All" ? "Popular Products" : selected}</h2>
          <button>See All ›</button>
        </div>

        <div className="mm-product-grid">
          {filteredProducts.length === 0 ? (
            <div className="mm-empty">No products found</div>
          ) : (
            filteredProducts.map((item) => {
              const qty = getQty(item._id);

              return (
                <article className="mm-product" key={item._id}>
                  <div className="mm-product-img">
                    <button
                      className="mm-wish"
                      onClick={() => toggleWishlist(item._id)}
                    >
                      {wishlist.includes(item._id) ? "❤️" : "🤍"}
                    </button>

                    <img
                      src={item.image || "https://via.placeholder.com/300"}
                      alt={item.name}
                    />

                    {qty === 0 ? (
                      <button className="mm-add" onClick={() => addToCart(item)}>
                        ADD
                      </button>
                    ) : (
                      <div className="mm-qty">
                        <button onClick={() => changeQty(item._id, "dec")}>-</button>
                        <b>{qty}</b>
                        <button onClick={() => changeQty(item._id, "inc")}>+</button>
                      </div>
                    )}
                  </div>

                  <div className="mm-product-info">
                    <h3>{item.name}</h3>
                    <p>1 pack</p>
                    <div>
                      <b>₹{item.price}</b>
                      <del>₹{item.price + 40}</del>
                    </div>
                    <span>⭐ 4.8</span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <footer className="mm-footer">
        <h2>MegaMarto</h2>
        <p>Fresh groceries, daily essentials and fast delivery.</p>

        <div>
          <span>🚀 10 Min Delivery</span>
          <span>🔐 Safe Payments</span>
          <span>⭐ Best Quality</span>
          <span>💰 Best Prices</span>
        </div>
      </footer>

      {cartCount > 0 && (
        <button className="mm-floating-cart" onClick={() => navigate("/cart")}>
          🛒 {cartCount} items | View Cart
        </button>
      )}
    </main>
  );
}

export default Home;