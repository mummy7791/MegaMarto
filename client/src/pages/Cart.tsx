import { useState } from "react";
import "./Cart.css";
import { useNavigate } from "react-router-dom";

type Product = {
  id?: number;
  _id?: string;
  name: string;
  price: number;
  image: string;
  qty?: number;
  mrp?: number;
  unit?: string;
  stock?: number;
};

const getInitialCart = (): Product[] => {
  try {
    const data = localStorage.getItem("cart");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const getDeliveryFee = (km: number) => {
  if (km <= 1) return 20;
  if (km <= 3) return 35;
  if (km <= 5) return 50;
  return 70;
};

function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<Product[]>(getInitialCart);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const distance = 3;

  const updateCart = (updated: Product[]) => {
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const getItemId = (item: Product) => item._id || String(item.id);

  const increaseQty = (id: string) => {
    const updated = cart.map((item) =>
      getItemId(item) === id
        ? { ...item, qty: typeof item.stock === "number" ? Math.min((item.qty || 0) + 1, item.stock) : (item.qty || 0) + 1 }
        : item
    );

    updateCart(updated);
  };

  const decreaseQty = (id: string) => {
    const updated = cart
      .map((item) =>
        getItemId(item) === id
          ? { ...item, qty: (item.qty || 0) - 1 }
          : item
      )
      .filter((item) => (item.qty || 0) > 0);

    updateCart(updated);
  };

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => getItemId(item) !== id);
    updateCart(updated);
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();

    if (code === "FIRST50") {
      setDiscount(50);
      alert("FIRST50 applied ✅");
    } else if (code === "SAVE100") {
      setDiscount(100);
      alert("SAVE100 applied ✅");
    } else {
      setDiscount(0);
      alert("Invalid coupon ❌");
    }
  };

  const itemTotal = cart.reduce(
    (sum, item) => sum + item.price * (item.qty || 0),
    0
  );

  const mrpTotal = cart.reduce((sum, item) => sum + ((item.mrp && item.mrp > item.price ? item.mrp : item.price) * (item.qty || 0)), 0);
  const mrpSavings = Math.max(mrpTotal - itemTotal, 0);
  const freeDeliveryGap = Math.max(499 - itemTotal, 0);
  const deliveryFee = itemTotal >= 499 ? 0 : getDeliveryFee(distance);
  const handlingFee = Math.round(itemTotal * 0.03);
  const total = Math.max(itemTotal + deliveryFee + handlingFee - discount, 0);
  const savings = mrpSavings + discount;

  return (
    <div className="zepto-cart">
      <div className="cart-header">
        <div><span className="cart-kicker">⚡ Delivery in 10–20 mins</span><h2>Your Cart</h2><p>{cart.length} products ready for checkout</p></div>
      </div>

      {cart.length > 0 && (
        <>
          <div className="save-box">🎉 You save ₹{savings} on this order</div>
          <div className="delivery-progress">
            <div><b>{freeDeliveryGap === 0 ? "Free delivery unlocked!" : `Add ₹${freeDeliveryGap} more for free delivery`}</b><span>{freeDeliveryGap === 0 ? "Your delivery fee is on us." : "Free delivery on ₹499+ cart value"}</span></div>
            <div className="progress-track"><span style={{ width: `${Math.min((itemTotal / 499) * 100, 100)}%` }} /></div>
          </div>
        </>
      )}

      {cart.length === 0 ? (
        <div className="empty-cart">
          <h3>Your cart is empty 😢</h3>
          <button onClick={() => navigate("/")}>Continue Shopping</button>
        </div>
      ) : (
        <>
          {cart.map((item) => {
            const itemId = getItemId(item);

            return (
              <div className="cart-card" key={itemId}>
                <img
                  src={item.image || "https://via.placeholder.com/100"}
                  alt={item.name}
                />

                <div className="cart-info">
                  <h4>{item.name}</h4><small>{item.unit || "1 pack"}</small><p>₹{item.price} {item.mrp && item.mrp > item.price ? <del>₹{item.mrp}</del> : null}</p>

                  <div className="qty-box">
                    <button onClick={() => decreaseQty(itemId)}>-</button>
                    <span>{item.qty || 0}</span>
                    <button onClick={() => increaseQty(itemId)}>+</button>
                  </div>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeItem(itemId)}
                >
                  ❌
                </button>
              </div>
            );
          })}

          <div className="bill-card">
            <h2>📄 Bill Summary</h2>

            <div className="coupon-box">
              <input
                placeholder="Enter coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <button onClick={applyCoupon}>Apply</button>
            </div>

            <p className="coupon-hint">
              Use <b>FIRST50</b> or <b>SAVE100</b>
            </p>

            <div className="bill-row">
              <span>Item Total</span>
              <b>₹{itemTotal}</b>
            </div>

            <div className="bill-row">
              <span>Delivery Fee ({distance} KM)</span>
              <b>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</b>
            </div>

            <div className="bill-row">
              <span>Handling Fee</span>
              <b>₹{handlingFee}</b>
            </div>

            {discount > 0 && (
              <div className="bill-row">
                <span>Coupon Discount</span>
                <b style={{ color: "green" }}>-₹{discount}</b>
              </div>
            )}

            <hr />

            <div className="bill-row total-row">
              <span>To Pay</span>
              <b>₹{total}</b>
            </div>
          </div>

          <div className="saving-card">
            <h2>💰 Savings on this order</h2>

            <div className="saving-row">
              <span>Discount on MRP</span>
              <b>₹{mrpSavings}</b>
            </div>

            <div className="saving-row">
              <span>Delivery Savings</span>
              <b>₹20</b>
            </div>

            <div className="saving-row">
              <span>Handling Savings</span>
              <b>₹10</b>
            </div>
          </div>

          <button
            className="checkout-btn"
            onClick={() => navigate("/checkout")}
          >
            Proceed to checkout →
          </button>
        </>
      )}
    </div>
  );
}

export default Cart;