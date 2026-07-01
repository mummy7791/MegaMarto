import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { CSSProperties } from "react";

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
};

const isValidToken = (token: string | null) => {
  return !!(
    token &&
    token !== "undefined" &&
    token !== "null" &&
    token.trim() !== ""
  );
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
  const [showMenu, setShowMenu] = useState(false);

  const isCustomerAuth = isValidToken(localStorage.getItem("customerToken"));
  const customerUser = getUserFromStorage("customerUser");

  const displayName =
    customerUser?.name || customerUser?.username || "Customer";

  useEffect(() => {
    const updateCart = () => {
      try {
        const cart: Product[] = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
        setCartCount(count);
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

  const closeMenu = () => setShowMenu(false);

  const logoutCustomer = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerUser");
    closeMenu();
    window.location.href = "/login";
  };

  const goTo = (path: string) => {
    closeMenu();
    navigate(path);
  };

  const isActive = (path: string) =>
    location.pathname === path ? styles.activeBtn : {};

  return (
    <div style={styles.navbar}>
      <h2 style={styles.logo} onClick={() => goTo("/")}>
        🛒 MegaMarto
      </h2>

      <div style={styles.links}>
        <button
          style={{ ...styles.navBtn, ...isActive("/") }}
          onClick={() => goTo("/")}
        >
          Home
        </button>

        <div style={styles.cartWrapper} onClick={() => goTo("/cart")}>
          🛒
          {cartCount > 0 && <span style={styles.badge}>{cartCount}</span>}
        </div>

        {isCustomerAuth ? (
          <>
            <button
              style={{ ...styles.navBtn, ...isActive("/orders") }}
              onClick={() => goTo("/orders")}
            >
              Orders
            </button>

            <button
              style={styles.profileBtn}
              onClick={() => setShowMenu((prev) => !prev)}
            >
              👋 {displayName}
            </button>

            {showMenu && (
              <div style={styles.dropdown}>
                <div style={styles.dropItem} onClick={() => goTo("/profile")}>
                  👤 Profile
                </div>

                <div style={styles.dropItem} onClick={() => goTo("/orders")}>
                  🧾 My Orders
                </div>

                <div style={styles.dropItemDanger} onClick={logoutCustomer}>
                  🚪 Logout
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <button
              style={{ ...styles.navBtn, ...isActive("/login") }}
              onClick={() => goTo("/login")}
            >
              Login
            </button>

            <button style={styles.registerBtn} onClick={() => goTo("/register")}>
              Register
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 25px",
    background: "linear-gradient(135deg, #141e30, #243b55)",
    color: "white",
    position: "sticky",
    top: 0,
    zIndex: 99999,
    overflow: "visible",
  },

  logo: {
    cursor: "pointer",
    fontWeight: "bold",
    margin: 0,
  },

  links: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    overflow: "visible",
    position: "relative",
  },

  navBtn: {
    background: "transparent",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "15px",
  },

  activeBtn: {
    background: "#00c6ff",
    color: "black",
    padding: "8px 12px",
    borderRadius: "8px",
  },

  registerBtn: {
    background: "#00c6ff",
    color: "black",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  cartWrapper: {
    position: "relative",
    cursor: "pointer",
    fontSize: "22px",
  },

  badge: {
    position: "absolute",
    top: "-8px",
    right: "-12px",
    background: "red",
    color: "white",
    borderRadius: "50%",
    padding: "2px 7px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  profileBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    padding: "8px 10px",
  },

  dropdown: {
    position: "absolute",
    right: 0,
    top: "45px",
    background: "#ffffff",
    color: "#111827",
    borderRadius: "14px",
    width: "220px",
    boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
    zIndex: 999999,
    overflow: "hidden",
  },

  dropItem: {
    padding: "14px 16px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    borderBottom: "1px solid #f1f1f1",
  },

  dropItemDanger: {
    padding: "14px 16px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 700,
    color: "red",
  },
};

export default Navbar;