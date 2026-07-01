import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

/* ================= USER PAGES ================= */
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Login from "./pages/login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderTracking from "./pages/OderTracking";
import Profile from "./pages/Profile";

/* ================= ADMIN ================= */
import AdminOrders from "./admin/AdminOrders";
import AdminDashboard from "./admin/AdminDashboard";
import Stores from "./pages/Stores";

/* ================= DELIVERY ================= */
import DeliveryLogin from "./delivery/DeliveryLogin";
import DeliveryDashboard from "./delivery/DeliveryDashboard";

/* ================= STORE ================= */
import StoreLogin from "./store/StoreLogin";
import StoreDashboard from "./store/StoreDashboard";

/* ================= COMPONENTS ================= */
import Navbar from "./components/Navbar";

/* ================= AUTH HELPERS ================= */
const isValidToken = (token: string | null) => {
  return !!(
    token &&
    token !== "undefined" &&
    token !== "null" &&
    token.trim() !== ""
  );
};

function AppContent() {
  const location = useLocation();

  const isCustomerAuth = isValidToken(localStorage.getItem("customerToken"));
  const isDeliveryAuth = isValidToken(localStorage.getItem("deliveryToken"));
  const isStoreAuth = isValidToken(localStorage.getItem("storeToken"));

  const hideNavbar =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/store") ||
    location.pathname.startsWith("/delivery");

  return (
    <>
      {!hideNavbar && <Navbar />}

      <div style={{ paddingTop: hideNavbar ? "0px" : "70px" }}>
        <Routes>
          {/* USER */}
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />

          <Route
            path="/login"
            element={isCustomerAuth ? <Navigate to="/" replace /> : <Login />}
          />

          <Route
            path="/register"
            element={
              isCustomerAuth ? <Navigate to="/" replace /> : <Register />
            }
          />

          <Route
            path="/profile"
            element={
              isCustomerAuth ? <Profile /> : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/checkout"
            element={
              isCustomerAuth ? <Checkout /> : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/orders"
            element={
              isCustomerAuth ? <MyOrders /> : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/track/:id"
            element={
              isCustomerAuth ? (
                <OrderTracking />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* ADMIN - SEPARATE DIRECT PAGE */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/stores" element={<Stores />} />

          {/* STORE */}
          <Route
            path="/store-login"
            element={
              isStoreAuth ? (
                <Navigate to="/store-dashboard" replace />
              ) : (
                <StoreLogin />
              )
            }
          />

          <Route
            path="/store-dashboard"
            element={
              isStoreAuth ? (
                <StoreDashboard />
              ) : (
                <Navigate to="/store-login" replace />
              )
            }
          />

          {/* DELIVERY */}
          <Route
            path="/delivery-login"
            element={
              isDeliveryAuth ? (
                <Navigate to="/delivery-dashboard" replace />
              ) : (
                <DeliveryLogin />
              )
            }
          />

          <Route
            path="/delivery-dashboard"
            element={
              isDeliveryAuth ? (
                <DeliveryDashboard />
              ) : (
                <Navigate to="/delivery-login" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AppContent />
    </BrowserRouter>
  );
}