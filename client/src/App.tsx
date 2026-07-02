import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

/* USER */
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Login from "./pages/login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderTracking from "./pages/OderTracking";
import Profile from "./pages/Profile";

/* ADMIN */
import AdminOrders from "./admin/AdminOrders";
import AdminDashboard from "./admin/AdminDashboard";
import Stores from "./pages/Stores";

/* DELIVERY */
import DeliveryLogin from "./delivery/DeliveryLogin";
import DeliveryDashboard from "./delivery/DeliveryDashboard";

/* STORE */
import StoreLogin from "./store/StoreLogin";
import StoreDashboard from "./store/StoreDashboard";

/* COMPONENTS */
import Navbar from "./components/Navbar";

const validToken = (token: string | null) =>
  !!token && token !== "undefined" && token !== "null" && token.trim() !== "";

function AppContent() {
  const location = useLocation();

  const customerAuth = validToken(localStorage.getItem("customerToken"));
  const adminAuth = validToken(localStorage.getItem("adminToken"));
  const storeAuth = validToken(localStorage.getItem("storeToken"));
  const deliveryAuth = validToken(localStorage.getItem("deliveryToken"));

  const hideNavbar =
    location.pathname.includes("login") ||
    location.pathname.includes("register") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/store") ||
    location.pathname.startsWith("/delivery");

  return (
    <>
      {!hideNavbar && <Navbar />}

      <main style={{ paddingTop: hideNavbar ? 0 : 70 }}>
        <Routes>
          {/* CUSTOMER */}
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />

          <Route path="/login" element={<Navigate to="/customer-login" />} />
          <Route
            path="/customer-login"
            element={customerAuth ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/customer-register"
            element={customerAuth ? <Navigate to="/" replace /> : <Register />}
          />
          <Route path="/register" element={<Navigate to="/customer-register" />} />

          <Route
            path="/profile"
            element={customerAuth ? <Profile /> : <Navigate to="/customer-login" />}
          />
          <Route
            path="/checkout"
            element={customerAuth ? <Checkout /> : <Navigate to="/customer-login" />}
          />
          <Route
            path="/orders"
            element={customerAuth ? <MyOrders /> : <Navigate to="/customer-login" />}
          />
          <Route
            path="/track/:id"
            element={
              customerAuth ? <OrderTracking /> : <Navigate to="/customer-login" />
            }
          />

          {/* ADMIN */}
          <Route path="/admin-login" element={<Login />} />
          <Route
            path="/admin"
            element={adminAuth ? <AdminDashboard /> : <Navigate to="/admin-login" />}
          />
          <Route
            path="/admin/orders"
            element={adminAuth ? <AdminOrders /> : <Navigate to="/admin-login" />}
          />
          <Route
            path="/admin/stores"
            element={adminAuth ? <Stores /> : <Navigate to="/admin-login" />}
          />

          {/* STORE */}
          <Route
            path="/store-login"
            element={
              storeAuth ? <Navigate to="/store-dashboard" replace /> : <StoreLogin />
            }
          />
          <Route
            path="/store-dashboard"
            element={
              storeAuth ? <StoreDashboard /> : <Navigate to="/store-login" />
            }
          />

          {/* DELIVERY */}
          <Route
            path="/delivery-login"
            element={
              deliveryAuth ? (
                <Navigate to="/delivery-dashboard" replace />
              ) : (
                <DeliveryLogin />
              )
            }
          />
          <Route
            path="/delivery-dashboard"
            element={
              deliveryAuth ? (
                <DeliveryDashboard />
              ) : (
                <Navigate to="/delivery-login" />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
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