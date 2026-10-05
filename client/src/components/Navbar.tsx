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
          <span className="mm-logo-mark">M</span>
          <span className="mm-logo-copy">
            <b>MegaMarto</b>
            <small>Smart grocery shopping</small>
          </span>
        </button>

        <button className="mm-location-pill" onClick={() => goTo("/")}>
          <MapPin size={18} />
          <span><small>Deliver to</small><b>Your location</b></span>
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
