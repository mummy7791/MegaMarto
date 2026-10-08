import { useEffect, useState } from "react";
import { MapPin, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

type Product = {
  id?: number;
  _id?: string;
  name: string;
  price: number;
  qty?: number;
};

type User = {
  name?: string;
  username?: string;
  email?: string;
};

const isValidToken = (token: string | null) =>
  !!token && token !== "undefined" && token !== "null" && token.trim() !== "";

const getUserFromStorage = (key: string): User | null => {
  try {
    const user = localStorage.getItem(key);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("Your location");
  const [locationLoading, setLocationLoading] = useState(false);

  const isCustomerAuth = isValidToken(localStorage.getItem("customerToken"));
  const customerUser = getUserFromStorage("customerUser");
  const displayName = customerUser?.name || customerUser?.username || "Customer";

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart: Product[] = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(cart.reduce((sum, item) => sum + (item.qty || 0), 0));
      } catch {
        setCartCount(0);
      }
    };
    updateCart();
    window.addEventListener("storage", updateCart);
    window.addEventListener("cartUpdated", updateCart);
    return () => {
      window.removeEventListener("storage", updateCart);
      window.removeEventListener("cartUpdated", updateCart);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("userLocation");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed?.displayName) setDeliveryLocation(parsed.displayName);
      else if (parsed?.lat && parsed?.lng) setDeliveryLocation(`${Number(parsed.lat).toFixed(3)}, ${Number(parsed.lng).toFixed(3)}`);
    } catch {
      // Ignore old non-JSON location values.
    }
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Location is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const data = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          displayName: `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`,
        };

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${data.lat}&lon=${data.lng}`
          );
          if (response.ok) {
            const place = await response.json();
            const a = place?.address || {};
            data.displayName =
              a.suburb || a.neighbourhood || a.village || a.town || a.city || a.county || data.displayName;
          }
        } catch {
          // Coordinates are still valid if reverse geocoding is unavailable.
        }

        localStorage.setItem("userLocation", JSON.stringify(data));
        setDeliveryLocation(data.displayName);
        setLocationLoading(false);
        window.dispatchEvent(new Event("locationUpdated"));
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location permission was denied. Please allow Location for MegaMarto in your browser and try again.");
        } else {
          alert("Unable to get your current location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const goTo = (path: string) => {
    setProfileOpen(false);
    setMobileOpen(false);
    navigate(path);
  };

  const logoutCustomer = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerUser");
    setProfileOpen(false);
    setMobileOpen(false);
    navigate("/customer-login", { replace: true });
  };

  const active = (path: string) => (location.pathname === path ? "nav-active" : "");

  return (
    <header className="mm-navbar-shell">
      <div className="mm-topbar">
        <span>Free delivery on selected orders</span>
        <span>Fresh groceries • Daily essentials • Fast delivery</span>
      </div>

      <div className="mm-navbar">
        <button className="mm-logo" onClick={() => goTo("/")} aria-label="MegaMarto home">
          <img className="mm-brand-image" src="/MegaMarto%20Fresh%20Grocery%20Delivery%20Logo.png" alt="MegaMarto Smart grocery shopping" />
        </button>

        <button
          className="mm-location-pill"
          onClick={requestLocation}
          disabled={locationLoading}
          aria-label="Use current delivery location"
        >
          <MapPin size={18} />
          <span>
            <small>Deliver to</small>
            <b>{locationLoading ? "Locating..." : deliveryLocation}</b>
          </span>
        </button>

        <div className="mm-search">
          <Search size={19} />
          <input placeholder="Search for fruits, milk, snacks, home essentials..." />
        </div>

        <button className="mm-menu-btn" onClick={() => setMobileOpen((p) => !p)} aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={mobileOpen ? "mm-links open" : "mm-links"}>
          <button className={active("/")} onClick={() => goTo("/")}>Home</button>
          <button onClick={() => goTo("/orders")}>Orders</button>
          <button className="cart-btn" onClick={() => goTo("/cart")}>
            <ShoppingCart size={19} />
            <span className="cart-label">Cart</span>
            {cartCount > 0 && <em>{cartCount}</em>}
          </button>

          {isCustomerAuth ? (
            <div className="profile-area">
              <button className="profile-btn" onClick={() => setProfileOpen((p) => !p)}>
                <UserRound size={18} />
                <span>{displayName}</span>
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <p onClick={() => goTo("/profile")}>My Profile</p>
                  <p onClick={() => goTo("/orders")}>My Orders</p>
                  <p onClick={() => goTo("/store-login")}>Store Login</p>
                  <p onClick={() => goTo("/delivery-login")}>Delivery Login</p>
                  <p className="danger" onClick={logoutCustomer}>Logout</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="login-btn" onClick={() => goTo("/customer-login")}>Login</button>
              <button className="join-btn" onClick={() => goTo("/customer-register")}>Sign Up</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
