import { useEffect, useState, useCallback } from "react";
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

const API_URL = "http://localhost:5000";

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
    "Grocery | Chips | Curd | Eggs price | Cheese slice | Fresh fruits | Fresh vegetables | Paneer price",
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
  const [cart, setCart] = useState<Product[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const [locationLoading, setLocationLoading] = useState(false);
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
      .catch((err) => console.log(err));
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

  const toggleWishlist = (id: string) => {
    const updated = wishlist.includes(id)
      ? wishlist.filter((w) => w !== id)
      : [...wishlist, id];

    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
  };

  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0);

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

  const filteredProducts = products.filter((item) => {
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

  const productSections = [
    { title: "Laundry Care", list: filteredProducts.slice(0, 8) },
    { title: "Rice", list: filteredProducts.slice(0, 8) },
    { title: "Popular Products", list: filteredProducts },
  ];

  return (
    <div className="zepto-home">
      <header className="zepto-header">
        <div className="brand" onClick={() => navigate("/")}>
          MegaMarto
        </div>

        <button
          type="button"
          className="location-btn"
          onClick={getLocation}
          disabled={locationLoading}
        >
          📍 {locationLoading ? "Fetching..." : userLocation}⌄
        </button>

        <div className="search-box">
          🔍
          <input
            placeholder='Search for "banana"'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="icon-btn" onClick={() => navigate("/login")}>
          👤 <span>Login</span>
        </button>

        <button className="icon-btn" onClick={() => navigate("/cart")}>
          🛒 <span>Cart</span>
        </button>
      </header>

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

      <section className="hero-slider">
        <div className="hero-track">
          <div className="hero-card purple">
            <h2>⚡ 10 Minutes Delivery</h2>
            <p>Fresh groceries at your doorstep</p>
          </div>
          <div className="hero-card green">
            <h2>🥬 Fresh & Healthy</h2>
            <p>Daily fresh fruits and vegetables</p>
          </div>
          <div className="hero-card pink">
            <h2>🎁 FIRST50 Coupon</h2>
            <p>Save more on your first order</p>
          </div>
          <div className="hero-card orange">
            <h2>🛒 MegaMarto Deals</h2>
            <p>Daily essentials at best prices</p>
          </div>
        </div>
      </section>

      <section className="category-section">
        <h2>Grocery & Kitchen</h2>

        <div className="category-grid">
          {categoryCards.map((cat) => (
            <div
              className="category-card"
              key={cat.title}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <img src={cat.img} alt={cat.title} />
              <h3>{cat.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {productSections.map((section) => (
        <section className="product-section" key={section.title}>
          <div className="section-head">
            <h2>{section.title}</h2>
            <button>See All ›</button>
          </div>

          <div className="product-row">
            {section.list.length === 0 ? (
              <p>No products found</p>
            ) : (
              section.list.map((item) => {
                const qty = getQty(item._id);
                const mrp = item.price + 40;
                const off = mrp - item.price;

                return (
                  <div className="product-card" key={item._id}>
                    <div className="img-box">
                      <button
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
                          className="add-btn"
                          onClick={() => addToCart(item)}
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="qty-pill">
                          <button onClick={() => decreaseQty(item._id)}>-</button>
                          <span>{qty}</span>
                          <button onClick={() => increaseQty(item._id)}>+</button>
                        </div>
                      )}
                    </div>

                    <div className="price-row">
                      <b>₹{item.price}</b>
                      <del>₹{mrp}</del>
                    </div>

                    <p className="off">₹{off} OFF</p>
                    <h3>{item.name}</h3>
                    <p className="pack">1 pack</p>
                    <p className="rating">☘ 4.8 (2.6k)</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      ))}

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

        <div className="footer-main">
          <div>
            <h1 className="footer-logo">MegaMarto</h1>
            <div className="footer-socials">📷 𝕏 f in</div>
            <p>© MegaMarto Marketplace Private Limited</p>
            <p>fssai lic no : 11224999000872</p>
          </div>

          <div>
            <p>Home</p>
            <p>Delivery Areas</p>
            <p>Careers</p>
            <p>Customer Support</p>
            <p>Press</p>
            <p>MegaMarto Blog</p>
          </div>

          <div>
            <p>Privacy Policy</p>
            <p>Terms of Use</p>
            <p>Responsible Disclosure Policy</p>
            <p>Sell on MegaMarto</p>
            <p>Deliver with MegaMarto</p>
            <p>Franchise with MegaMarto</p>
          </div>

          <div>
            <h3>Download App</h3>
            <button className="store-btn">▶ Get it on play store</button>
            <button className="store-btn"> Get it on app store</button>
          </div>
        </div>
      </footer>

      {cartCount > 0 && (
        <div className="floating-cart" onClick={() => navigate("/cart")}>
          🛒 {cartCount} items | View Cart
        </div>
      )}
    </div>
  );
}

export default Home;