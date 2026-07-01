import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

type User = {
  name?: string;
  phone?: string;
  email?: string;
};

function Profile() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("orders");

  const user: User = JSON.parse(localStorage.getItem("customerUser") || "{}");

  const logout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerUser");
    navigate("/login");
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>MegaMarto</h1>
        <input placeholder='Search for "banana"' />
        <button onClick={() => navigate("/cart")}>🛒 Cart</button>
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="user-box">
            <div className="avatar">👤</div>
            <h2>{user?.name || "MegaMarto User"}</h2>
            <p>{user?.phone || user?.email || "+91 XXXXX XXXXX"}</p>
          </div>

          <div className="cash-card">
            <b>💜 MegaMarto Cash & Gift Card</b>
            <p>Available Balance: ₹0</p>
            <button>Add Balance</button>
          </div>

          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>🛍️ Orders</button>
          <button className={tab === "support" ? "active" : ""} onClick={() => setTab("support")}>🎧 Customer Support</button>
          <button className={tab === "referrals" ? "active" : ""} onClick={() => setTab("referrals")}>♡ Manage Referrals</button>
          <button className={tab === "addresses" ? "active" : ""} onClick={() => setTab("addresses")}>📍 Saved Addresses</button>
          <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>👤 Profile</button>

          <button className="logout" onClick={logout}>Log Out</button>
        </aside>

        <main className="profile-content">
          {tab === "orders" && (
            <>
              <h2>Settings</h2>
              {[161, 350, 178].map((price, i) => (
                <div className="order-card" key={i}>
                  <div>
                    <h3>Order delivered ✅</h3>
                    <p>Placed at 30th May 2026, 09:30 am</p>
                    <div className="mini-products">
                      <span>🥛</span><span>🍎</span><span>🍪</span><span>🛒</span>
                    </div>
                  </div>
                  <b>₹{price}</b>
                </div>
              ))}
              <button className="load-more">↓ Load More</button>
            </>
          )}

          {tab === "addresses" && (
            <>
              <h2>Saved Addresses</h2>
              <div className="add-address">＋ Add New Address ›</div>

              {["Home", "Other", "Work"].map((type) => (
                <div className="address-card" key={type}>
                  <h3>{type}</h3>
                  <p>Rajhmundry, Andhra Pradesh, India</p>
                  <div>
                    <button>✏️</button>
                    <button>🗑️</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === "support" && (
            <>
              <h2>FAQs</h2>
              {[
                "General Inquiry",
                "Payment Related",
                "Feedback & Suggestions",
                "Order / Products Related",
                "Gift Card",
                "No-Cost EMI",
              ].map((q) => (
                <div className="faq-row" key={q}>
                  {q} <span>›</span>
                </div>
              ))}
            </>
          )}

          {tab === "profile" && (
            <div className="profile-info">
              <h2>Profile Details</h2>
              <p><b>Name:</b> {user?.name || "User"}</p>
              <p><b>Email:</b> {user?.email || "Not added"}</p>
              <p><b>Phone:</b> {user?.phone || "Not added"}</p>
            </div>
          )}

          {tab === "referrals" && (
            <div className="profile-info">
              <h2>Manage Referrals</h2>
              <p>Invite your friends and earn MegaMarto rewards 🎁</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Profile;