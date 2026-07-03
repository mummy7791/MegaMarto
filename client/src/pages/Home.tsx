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

const categoryMap: Record<string, string[]> = {
  All: [],
  Fresh: ["fresh", "fruit", "vegetable"],
  Dairy: ["dairy", "milk", "curd", "egg", "bread"],
  Snacks: ["snack", "chips", "chocolate"],
  Drinks: ["drink", "juice", "water", "beverage"],
  Beauty: ["beauty", "makeup", "care"],
  Home: ["home", "cleaning", "kitchen"],
  Electronics: ["electronics", "mobile", "phone"],
};

const categories = [
  ["Fruits & Vegetables", "Fresh", "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=700"],
  ["Dairy, Bread & Eggs", "Dairy", "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=700"],
  ["Snacks & Drinks", "Snacks", "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=700"],
  ["Tea, Coffee & More", "Drinks", "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=700"],
  ["Ice Creams & More", "Snacks", "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=700"],
  ["Beauty & Care", "Beauty", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=700"],
  ["Home Essentials", "Home", "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700"],
  ["Electronics", "Electronics", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700"],
];

const heroSlides = [
  {
    tag: "⚡ Super Saver Week",
    title: "Groceries delivered",
    highlight: "in minutes",
    text: "Fresh fruits, dairy, snacks, beauty, home essentials and daily needs delivered fast.",
    image: "🛒🥛🍎🥬🍌",
    color: "slide-purple",
  },
  {
    tag: "🥬 Fresh Today",
    title: "Farm fresh fruits",
    highlight: "up to 40% off",
    text: "Daily fresh vegetables and fruits delivered to your doorstep.",
    image: "🍎🥭🥦🍅",
    color: "slide-green",
  },
  {
    tag: "🎁 FIRST50",
    title: "Flat ₹50 OFF",
    highlight: "on first order",
    text: "Use coupon FIRST50 and save more on your first MegaMarto order.",
    image: "🎁🛍️💜",
    color: "slide-pink",
  },
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
  const [slide, setSlide] = useState(0);
  const [couponOpen, setCouponOpen] = useState(false);
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

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    return () => clearInterval(timer);
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

      if (selected === "All") return searchOk;

      const keys = categoryMap[selected] || [selected.toLowerCase()];

      const catOk = keys.some((k) => name.includes(k) || cat.includes(k));

      return searchOk && catOk;
    });
  }, [products, search, selected]);

  const currentSlide = heroSlides[slide];

  return (
    <main className="mm-home">
      <section className="mm-hero">
        <div className={`mm-hero-left ${currentSlide.color}`}>
          <span className="mm-pill">{currentSlide.tag}</span>

          <h1>
            {currentSlide.title}
            <b>{currentSlide.highlight}</b>
          </h1>

          <p>{currentSlide.text}</p>

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
            <button onClick={() => navigate("/login")}>👤 Login</button>
            <button onClick={() => navigate("/register")}>📝 Register</button>
            <button onClick={() => setCouponOpen(true)}>🎁 Coupon</button>
          </div>

          <div className="mm-floating-basket">{currentSlide.image}</div>

          <div className="mm-slider-controls">
            <button onClick={() => setSlide((slide - 1 + heroSlides.length) % heroSlides.length)}>
              ‹
            </button>

            <div>
              {heroSlides.map((_, index) => (
                <span
                  key={index}
                  className={slide === index ? "active" : ""}
                  onClick={() => setSlide(index)}
                />
              ))}
            </div>

            <button onClick={() => setSlide((slide + 1) % heroSlides.length)}>
              ›
            </button>
          </div>
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
                    <span className="mm-badge">🔥 Deal</span>

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

        <div className="mm-footer-benefits">
          <span>🚀 10 Min Delivery</span>
          <span>🔐 Safe Payments</span>
          <span>⭐ Best Quality</span>
          <span>💰 Best Prices</span>
        </div>

        <div className="mm-footer-searches">
          <h3>Trending Searches</h3>
          <p><b>Categories :</b> Ice Creams | Fans & Coolers | Talcom Powder | Mosquito Nets | Sunscreen | Cold Beverages</p>
          <p><b>Products :</b> Coconut Water | Diet Coke | Masala Chaas | Amul Rabdi | Lahori Jeera</p>
          <p><b>Brands :</b> Rasna | Dermi Cool | Decathlon | Kwality Walls | Vincent Chase</p>

          <h3>Popular Searches</h3>
          <p><b>Products :</b> Avocado | Strawberry | Pomegranate | Beetroot | Potato | Lemon | Papaya</p>
          <p><b>Brands :</b> Yakult | Aashirvaad Atta | Too Yumm | Lays | Amul | Fortune Oil</p>
        </div>
      </footer>

      {couponOpen && (
        <div className="mm-coupon-overlay" onClick={() => setCouponOpen(false)}>
          <div className="mm-coupon" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setCouponOpen(false)}>×</button>
            <h2>🎁 FIRST50</h2>
            <p>Flat ₹50 OFF on your first order</p>
            <b>Use coupon code: FIRST50</b>
          </div>
        </div>
      )}

      {cartCount > 0 && (
        <button className="mm-floating-cart" onClick={() => navigate("/cart")}>
          🛒 {cartCount} items | View Cart
        </button>
      )}
    </main>
  );
}

export default Home;