import { useCallback, useEffect, useMemo, useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

type Product = {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  qty?: number;
};

type SavedLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  displayName?: string;
};

const API_URL = "https://megamarto-backend.onrender.com";

const topTabs = [
  { name: "All", icon: "🛍️" },
  { name: "Cafe", icon: "☕" },
  { name: "Home", icon: "🧹" },
  { name: "Toys", icon: "🧸" },
  { name: "Fresh", icon: "🍃" },
  { name: "Electronics", icon: "🎧" },
  { name: "Mobiles", icon: "📱" },
  { name: "Beauty", icon: "💄" },
  { name: "Fashion", icon: "👕" },
];

const categoryMap: Record<string, string[]> = {
  All: [],
  Cafe: ["Cafe", "Tea", "Coffee"],
  Home: ["Home", "Home Essentials", "Cleaning", "Kitchen"],
  Toys: ["Toys"],
  Fresh: ["Fruits", "Vegetables", "Fresh"],
  Electronics: ["Electronics"],
  Mobiles: ["Mobiles", "Mobile", "Phone"],
  Beauty: ["Beauty", "Personal Care", "Makeup"],
  Fashion: ["Fashion", "Clothes"],
};

const categoryCards = [
  {
    title: "Fruits & Vegetables",
    key: "Fresh",
    img: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600",
  },
  {
    title: "Dairy, Bread & Eggs",
    key: "Dairy",
    img: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600",
  },
  {
    title: "Atta, Rice, Oil & Dals",
    key: "Grocery",
    img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600",
  },
  {
    title: "Snacks & Drinks",
    key: "Snacks",
    img: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600",
  },
  {
    title: "Tea, Coffee & More",
    key: "Cafe",
    img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600",
  },
  {
    title: "Ice Creams & More",
    key: "Ice Cream",
    img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600",
  },
  {
    title: "Beauty & Care",
    key: "Beauty",
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600",
  },
  {
    title: "Home Essentials",
    key: "Home",
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600",
  },
];

const heroCards = [
  {
    title: "⚡ 10 Minutes Delivery",
    text: "Fresh groceries at your doorstep",
    className: "purple",
  },
  {
    title: "🥬 Fresh & Healthy",
    text: "Daily fresh fruits and vegetables",
    className: "green",
  },
  {
    title: "🎁 FIRST50 Coupon",
    text: "Save more on your first order",
    className: "pink",
  },
  {
    title: "🛒 MegaMarto Deals",
    text: "Daily essentials at best prices",
    className: "orange",
  },
];
const trendingSearches = {
  categories:
    "Ice Creams | Fans & Coolers | Talcom Powder | Mosquito Nets | Sunscreen | Ice Cream Cake | Cold Beverages | Sunglasses",
  products:
    "Bajaj Table Fan | OnePlus 13R | Coconut Water | Diet Coke | Masala Chaas | Amul Rabdi | Lahori Jeera | Ice Cube",
  brands:
    "Rasna | Dermi Cool | Decathlon | Kwality Walls | Vincent Chase By Lenskart",
};

const popularSearches = {
  products:
    "Avocado | Strawberry | Pomegranate | Beetroot | Potato | Lemon | Papaya | Jeera | Mushroom | Lettuce",
  brands:
    "Yakult | Aashirvaad Atta | Too Yumm | Lays | Amul | Fortune Oil | Mother Dairy | Nandini Milk",
  categories:
    "Grocery | Chips | Curd | Eggs | Cheese | Fruits | Vegetables | Paneer",
};

const footerCategories = [
  "Fruits & Vegetables",
  "Atta, Rice, Oil & Dals",
  "Masala & Dry Fruits",
  "Sweet Cravings",
  "Frozen Food & Ice Creams",
  "Baby Food",
  "Dairy, Bread & Eggs",
  "Cold Drinks & Juices",
  "Snacks",
  "Meats, Fish & Eggs",
  "Breakfast & Sauces",
  "Tea, Coffee & More",
  "Biscuits",
  "Makeup & Beauty",
  "Bath & Body",
  "Cleaning Essentials",
  "Home Needs",
  "Electricals & Accessories",
  "Hygiene & Grooming",
  "Health & Baby Care",
  "Homegrown Brands",
  "Paan Corner",
];

function Home() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [locationLoading, setLocationLoading] = useState(false);

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

  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved: SavedLocation | null = JSON.parse(
        localStorage.getItem("userLocation") || "null"
      );
      return saved?.displayName || "Select Location";
    } catch {
      return "Select Location";
    }
  });

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);
    const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );

      const data = await res.json();
      const address = data?.address || {};

      const area =
        address.suburb ||
        address.neighbourhood ||
        address.road ||
        address.village ||
        address.town ||
        address.city ||
        "Current Location";

      const city =
        address.city || address.town || address.village || address.state || "";

      return city ? `${area}, ${city}` : area;
    } catch {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Location not supported");
      return;
    }

    setLocationLoading(true);
    setUserLocation("Fetching...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        const displayName = await reverseGeocode(lat, lng);

        localStorage.setItem(
          "userLocation",
          JSON.stringify({ lat, lng, accuracy, displayName })
        );

        setUserLocation(displayName);
        setLocationLoading(false);
      },
      () => {
        setUserLocation("Permission Denied");
        setLocationLoading(false);
        alert("Please allow location permission");
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }, []);

  const updateCart = (updated: Product[]) => {
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const addToCart = (item: Product) => {
    const existing = cart.find((c) => c._id === item._id);

    const updated = existing
      ? cart.map((c) =>
          c._id === item._id ? { ...c, qty: (c.qty || 0) + 1 } : c
        )
      : [...cart, { ...item, qty: 1 }];

    updateCart(updated);
  };

  const increaseQty = (id: string) => {
    updateCart(
      cart.map((c) => (c._id === id ? { ...c, qty: (c.qty || 0) + 1 } : c))
    );
  };

  const decreaseQty = (id: string) => {
    updateCart(
      cart
        .map((c) => (c._id === id ? { ...c, qty: (c.qty || 0) - 1 } : c))
        .filter((c) => (c.qty || 0) > 0)
    );
  };
    const getQty = (id: string) => cart.find((c) => c._id === id)?.qty || 0;

  const toggleWishlist = (id: string) => {
    const updated = wishlist.includes(id)
      ? wishlist.filter((w) => w !== id)
      : [...wishlist, id];

    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
  };

  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const itemName = item.name.toLowerCase();
      const itemCategory = item.category.toLowerCase();
      const searchText = search.toLowerCase();

      const matchesSearch =
        itemName.includes(searchText) || itemCategory.includes(searchText);

      if (selectedCategory === "All") return matchesSearch;

      const mapped = categoryMap[selectedCategory] || [selectedCategory];

      const matchesCategory = mapped.some((cat) => {
        const c = cat.toLowerCase();
        return itemCategory.includes(c) || itemName.includes(c);
      });

      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  return (
    <main className="home-page">
      <section className="mega-hero">
        <div className="mega-hero-left">
          <div className="hero-badge">⚡ MegaMarto Fast Delivery</div>

          <h1>
            Groceries delivered
            <span> in minutes</span>
          </h1>

          <p>
            Fresh fruits, dairy, snacks, beauty, home essentials and daily needs
            delivered fast to your doorstep.
          </p>

          <div className="hero-location" onClick={getLocation}>
            <span>📍</span>
            <div>
              <b>{locationLoading ? "Fetching..." : "Delivery Location"}</b>
              <small>{userLocation}</small>
            </div>
          </div>

          <div className="hero-search">
            <span>🔍</span>
            <input
              placeholder='Search for "milk, fruits, snacks"'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="hero-actions">
            <button onClick={() => navigate("/customer-login")}>👤 Login</button>
            <button onClick={() => navigate("/cart")}>🛒 Cart</button>
          </div>
        </div>

        <div className="mega-hero-right">
          {heroCards.map((card) => (
            <div className={`mega-offer-card ${card.className}`} key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
            </div>
          ))}
        </div>
      </section>
            <nav className="tabs">
        {topTabs.map((cat) => (
          <button
            key={cat.name}
            className={selectedCategory === cat.name ? "tab active" : "tab"}
            onClick={() => setSelectedCategory(cat.name)}
          >
            <span>{cat.icon}</span> {cat.name}
          </button>
        ))}
      </nav>

      <section className="category-section">
        <div className="section-head">
          <h2>Grocery & Kitchen</h2>
          <button type="button">See All ›</button>
        </div>

        <div className="category-grid">
          {categoryCards.map((cat) => (
            <button
              type="button"
              className="category-card"
              key={cat.title}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <img src={cat.img} alt={cat.title} />
              <span>{cat.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="product-section">
        <div className="section-head">
          <h2>
            {selectedCategory === "All" ? "Popular Products" : selectedCategory}
          </h2>
          <button type="button">See All ›</button>
        </div>

        <div className="product-grid">
          {filteredProducts.length === 0 ? (
            <p className="empty-text">No products found</p>
          ) : (
            filteredProducts.map((item) => {
              const qty = getQty(item._id);
              const mrp = item.price + 40;

              return (
                <article className="product-card" key={item._id}>
                  <div className="product-img">
                    <button
                      type="button"
                      className="wish-btn"
                      onClick={() => toggleWishlist(item._id)}
                    >
                      {wishlist.includes(item._id) ? "❤️" : "🤍"}
                    </button>

                    <img
                      src={item.image || "https://via.placeholder.com/300"}
                      alt={item.name}
                    />

                    {qty === 0 ? (
                      <button
                        type="button"
                        className="add-btn"
                        onClick={() => addToCart(item)}
                      >
                        ADD
                      </button>
                    ) : (
                      <div className="qty-pill">
                        <button type="button" onClick={() => decreaseQty(item._id)}>
                          -
                        </button>
                        <span>{qty}</span>
                        <button type="button" onClick={() => increaseQty(item._id)}>
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="price-row">
                    <b>₹{item.price}</b>
                    <del>₹{mrp}</del>
                  </div>

                  <h3>{item.name}</h3>
                  <p className="pack">1 pack</p>
                  <p className="rating">☘ 4.8</p>
                </article>
              );
            })
          )}
        </div>
      </section>
            <footer className="mart-footer">
        <div className="footer-searches">
          <h2>Trending Searches</h2>
          <p>
            <b>Categories :</b> {trendingSearches.categories}
          </p>
          <p>
            <b>Products :</b> {trendingSearches.products}
          </p>
          <p>
            <b>Brands :</b> {trendingSearches.brands}
          </p>

          <h2>Popular Searches</h2>
          <p>
            <b>Products :</b> {popularSearches.products}
          </p>
          <p>
            <b>Brands :</b> {popularSearches.brands}
          </p>
          <p>
            <b>Categories :</b> {popularSearches.categories}
          </p>
        </div>

        <div className="footer-category-area">
          <h2>Categories</h2>
          <div className="footer-category-grid">
            {footerCategories.map((cat) => (
              <span key={cat}>{cat}</span>
            ))}
          </div>
        </div>
      </footer>

      {cartCount > 0 && (
        <button className="floating-cart" onClick={() => navigate("/cart")}>
          🛒 {cartCount} items | View Cart
        </button>
      )}
    </main>
  );
}

export default Home;