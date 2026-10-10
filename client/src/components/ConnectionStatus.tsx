import { useEffect, useState } from "react";

const LOGO = "/MegaMarto%20Fresh%20Grocery%20Delivery%20Logo.png";

export default function ConnectionStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div role="alert" style={{
      position: "fixed", inset: 0, zIndex: 100000, display: "flex",
      alignItems: "center", justifyContent: "center", background: "#fff",
      padding: 24, textAlign: "center"
    }}>
      <div style={{ maxWidth: 360, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <img src={LOGO} alt="MegaMarto" style={{ width: "min(65vw, 220px)", height: "auto", objectFit: "contain" }} />
        <div style={{ fontSize: 44 }} aria-hidden="true">📵</div>
        <h1 style={{ fontSize: 23, margin: 0, color: "#153d25" }}>No Internet Connection</h1>
        <p style={{ color: "#647067", lineHeight: 1.6, margin: 0 }}>
          Please turn on Wi-Fi or mobile data and try again.
        </p>
        <button type="button" onClick={() => {
          if (navigator.onLine) window.location.reload();
          else setOnline(false);
        }} style={{
          background: "#176b3a", color: "#fff", padding: "13px 42px",
          borderRadius: 12, border: 0, fontWeight: 700, cursor: "pointer",
          minHeight: 48, fontSize: 15
        }}>Retry</button>
      </div>
    </div>
  );
}
