import { useEffect, useState } from "react";
import "./Checkout.css";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

type Product = {
  id?: number;
  _id?: string;
  name: string;
  price: number;
  qty?: number;
  image?: string;
};

type Address = {
  name: string;
  phone: string;
  street: string;
  city: string;
  pincode: string;
};

type LocationData = {
  lat: number;
  lng: number;
  accuracy?: number;
  displayName?: string;
};

type PaymentMethod = "RAZORPAY" | "COD";

type CheckoutQuote = {
  shopCount: number;
  shops: Array<{ storeName: string; itemTotal: number; deliveryFee: number; handlingFee: number; total: number }>;
  pricing: { itemTotal: number; deliveryFee: number; handlingFee: number; total: number };
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;

  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    paylater?: boolean;
    emi?: boolean;
  };

  config?: {
    display: {
      blocks: {
        upi: {
          name: string;
          instruments: { method: string }[];
        };
        cards: {
          name: string;
          instruments: { method: string }[];
        };
      };
      sequence: string[];
      preferences: {
        show_default_blocks: boolean;
      };
    };
  };

  handler: (response: RazorpayResponse) => Promise<void>;
  prefill: {
    name: string;
    contact: string;
  };
  theme: {
    color: string;
  };
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function Checkout() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] =\n    useState<PaymentMethod>("RAZORPAY");\n  const [quote, setQuote] = useState<CheckoutQuote | null>(null);

  const [cart] = useState<Product[]>(() => {
    try {
      const data = localStorage.getItem("cart");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const [address, setAddress] = useState<Address>({
    name: "",
    phone: "",
    street: "",
    city: "",
    pincode: "",
  });

  const itemTotal = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 1),
    0
  );

  const deliveryFee = quote?.pricing.deliveryFee ?? (itemTotal >= 499 ? 0 : 35);\n  const handlingFee = quote?.pricing.handlingFee ?? 5;\n  const total = quote?.pricing.total ?? (itemTotal + deliveryFee + handlingFee);

  const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("customerUser") || "{}");
      setAddress((prev) => ({ ...prev, name: user.name || prev.name, phone: user.phone || prev.phone }));
    } catch { /* keep empty fields */ }
  }, []);

  const getSavedLocation = (): LocationData | null => {
    try {
      const saved = localStorage.getItem("userLocation");
      if (!saved) return null;

      const data = JSON.parse(saved) as LocationData;

      if (!data?.lat || !data?.lng) return null;

      return {
        lat: Number(data.lat),
        lng: Number(data.lng),
        accuracy: data.accuracy,
        displayName: data.displayName,
      };
    } catch {
      return null;
    }
  };

  const getCurrentLocation = () => {
    return new Promise<LocationData>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => reject("Location permission denied"),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const validateAddress = () => {
    const token =
      localStorage.getItem("customerToken") || localStorage.getItem("token");

    if (!token || token === "undefined" || token === "null") {
      toast.error("Please login first");
      navigate("/login");
      return false;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty");
      return false;
    }

    if (
      !address.name ||
      !address.phone ||
      !address.street ||
      !address.city ||
      !address.pincode
    ) {
      toast.error("Please fill all fields");
      return false;
    }

    if (address.phone.length !== 10) {
      toast.error("Enter valid phone");
      return false;
    }

    if (address.pincode.length !== 6) {
      toast.error("Enter valid pincode");
      return false;
    }

    return true;
  };

  const fetchCheckoutQuote = async () => {
    const token = localStorage.getItem("customerToken") || localStorage.getItem("token");
    const res = await fetch("https://megamarto-backend.onrender.com/orders/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: cart.map((item) => ({ productId: item._id || item.id, qty: item.qty || 1 })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Unable to calculate checkout total");
    setQuote(data);
    return data as CheckoutQuote;
  };

  const openPayment = async () => {
    if (!validateAddress()) return;

    let location = getSavedLocation();

    if (!location) {
      try {
        setLoading(true);
        toast.loading("Getting current location...");
        location = await getCurrentLocation();
        toast.dismiss();

        localStorage.setItem("userLocation", JSON.stringify(location));
      } catch {
        toast.dismiss();
        toast.error("Please allow location permission");
        return;
      } finally {
        setLoading(false);
      }
    }

    try {\n      setLoading(true);\n      await fetchCheckoutQuote();\n      setPaymentOpen(true);\n    } catch (err) {\n      toast.error(err instanceof Error ? err.message : "Checkout total failed");\n    } finally {\n      setLoading(false);\n    }
  };

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      const oldScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (oldScript) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const placeFinalOrder = async (
    method: string,
    status: string,
    paymentId?: string
  ) => {
    const token =
      localStorage.getItem("customerToken") || localStorage.getItem("token");

    const location = getSavedLocation();

    if (!location) {
      toast.error("Location missing. Please try again");
      return;
    }

    const res = await fetch("https://megamarto-backend.onrender.com/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: cart.map((item) => ({
          productId: item._id || item.id,
          name: item.name,
          price: item.price,
          qty: item.qty || 1,
          image: item.image,
        })),
        total,
        address,
        location,
        paymentMethod: method,
        paymentStatus: status,
        paymentId,
      }),
    });

    const data = await res.json();

    if (res.status === 401) {
      toast.error("Session expired");
      localStorage.removeItem("customerToken");
      localStorage.removeItem("customerUser");
      navigate("/login");
      return;
    }

    if (!res.ok) {
      toast.error(data?.message || "Order failed");
      return;
    }

    toast.success("🎉 Order placed successfully!");

    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("cartUpdated"));

    setPaymentOpen(false);
    navigate("/orders");
  };

  const placeOrderAfterPayment = async () => {
    try {
      setLoading(true);

      if (paymentMethod === "COD") {
        await placeFinalOrder("COD", "PENDING");
        return;
      }

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        toast.error("Razorpay failed to load");
        return;
      }

      const orderRes = await fetch("https://megamarto-backend.onrender.com/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: total }),
      });

      const razorpayOrder = (await orderRes.json()) as RazorpayOrder;

      if (!orderRes.ok) {
        toast.error("Payment order failed");
        return;
      }

      const options: RazorpayOptions = {
        key: "rzp_test_SzS55azcF8z86M",
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "MegaMarto",
        description: "Order Payment",
        order_id: razorpayOrder.id,

        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          paylater: true,
          emi: true,
        },

        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay using UPI",
                instruments: [{ method: "upi" }],
              },
              cards: {
                name: "Pay using Card",
                instruments: [{ method: "card" }],
              },
            },
            sequence: ["block.upi", "block.cards"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },

        handler: async (response: RazorpayResponse) => {
          const verifyRes = await fetch("https://megamarto-backend.onrender.com/payment/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok || !verifyData.success) {
            toast.error("Payment verification failed");
            return;
          }

          await placeFinalOrder(
            "RAZORPAY",
            "PAID",
            response.razorpay_payment_id
          );
        },

        prefill: {
          name: address.name,
          contact: address.phone,
        },

        theme: {
          color: "#22c55e",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.log("PAYMENT ERROR:", err);
      toast.error("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "phone" || name === "pincode") {
      if (!/^\d*$/.test(value)) return;
    }

    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="checkout">
      <div className="checkout-title"><span>SECURE CHECKOUT</span><h2>Complete your order</h2><p>Delivery in approximately 10–20 minutes</p></div>

      <div className="address-box">
        <h3><span className="step-no">1</span> Delivery Address</h3><p className="section-note">Enter the address where you want your order delivered.</p>

        <input
          name="name"
          placeholder="Full Name"
          value={address.name}
          onChange={handleAddressChange}
        />

        <input
          name="phone"
          placeholder="Phone"
          value={address.phone}
          onChange={handleAddressChange}
          maxLength={10}
        />

        <input
          name="street"
          placeholder="Street"
          value={address.street}
          onChange={handleAddressChange}
        />

        <input
          name="city"
          placeholder="City"
          value={address.city}
          onChange={handleAddressChange}
        />

        <input
          name="pincode"
          placeholder="Pincode"
          value={address.pincode}
          onChange={handleAddressChange}
          maxLength={6}
        />
      </div>

      <div className="summary">\n        <h3><span className="step-no">2</span> Order Summary ({totalItems} items)</h3>\n        {quote && quote.shopCount > 1 && <p className="section-note">Split across {quote.shopCount} shops. Delivery and handling are calculated per shop.</p>}

        {cart.map((item) => (
          <div key={item._id || item.id} className="summary-item">
            <p>
              {item.name} x {item.qty || 1}
            </p>
            <p>₹{item.price * (item.qty || 1)}</p>
          </div>
        ))}

        <div className="checkout-bill"><div><span>Item total</span><b>₹{quote?.pricing.itemTotal ?? itemTotal}</b></div><div><span>Delivery fee</span><b>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</b></div><div><span>Handling fee</span><b>₹{handlingFee}</b></div><div className="checkout-total"><span>To pay</span><b>₹{total}</b></div></div>
      </div>

      <button className="place-btn" onClick={openPayment} disabled={loading}>
        {loading ? "Checking..." : "Continue to payment →"}
      </button>

      {paymentOpen && (
        <div className="payment-overlay">
          <div className="payment-card">
            <button
              className="payment-close"
              onClick={() => setPaymentOpen(false)}
              disabled={loading}
            >
              ✕
            </button>

            <h2>💳 Payment</h2>
            <p className="pay-subtitle">Pay ₹{total} securely</p>

            <div className="payment-options">
              <button
                type="button"
                className={paymentMethod === "RAZORPAY" ? "active" : ""}
                onClick={() => setPaymentMethod("RAZORPAY")}
              >
                💳 Razorpay
              </button>

              <button
                type="button"
                className={paymentMethod === "COD" ? "active" : ""}
                onClick={() => setPaymentMethod("COD")}
              >
                💵 COD
              </button>
            </div>

            <button
              className="pay-now-btn"
              onClick={placeOrderAfterPayment}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : paymentMethod === "COD"
                ? "Place COD Order"
                : `Pay ₹${total}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;