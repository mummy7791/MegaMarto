import { useEffect, useState } from "react";
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

const isValidToken = (token: string | null) => {
  return !!token && token !== "undefined" && token !== "null" && token.trim() !== "";
};

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
    <header className="mm-navbar">
      <div className="mm-logo" onClick={() => goTo("/")}>
        <span>🛒</span>
        <b>MegaMarto</b>
      </div>

      <div className="mm-search">
        <span>🔍</span>
        <input placeholder='Search for "milk, fruits, snacks"' />
      </div>

      <button className="mm-menu-btn" onClick={() => setMobileOpen((p) => !p)}>
        ☰
      </button>

      <nav className={mobileOpen ? "mm-links open" : "mm-links"}>
        <button className={active("/")} onClick={() => goTo("/")}>
          Home
        </button>

        <button onClick={() => goTo("/admin-login")}>Admin</button>
        <button onClick={() => goTo("/store-login")}>Store</button>
        <button onClick={() => goTo("/delivery-login")}>Delivery</button>

        <button className="cart-btn" onClick={() => goTo("/cart")}>
          🛒 Cart
          {cartCount > 0 && <span>{cartCount}</span>}
        </button>

        {isCustomerAuth ? (
          <div className="profile-area">
            <button
              className="profile-btn"
              onClick={() => setProfileOpen((p) => !p)}
            >
              👋 {displayName}
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <p onClick={() => goTo("/profile")}>👤 Profile</p>
                <p onClick={() => goTo("/orders")}>🧾 My Orders</p>
                <p className="danger" onClick={logoutCustomer}>
                  🚪 Logout
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <button onClick={() => goTo("/customer-login")}>Login</button>
            <button className="join-btn" onClick={() => goTo("/customer-register")}>
              Register
            </button>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;