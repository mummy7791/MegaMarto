import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

const LOGO = "/MegaMarto%20Fresh%20Grocery%20Delivery%20Logo.png";

export default function MobileLoadingScreen() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(() => Capacitor.isNativePlatform());
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 450);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  if (!visible) return null;
  return (
    <div aria-label="Loading MegaMarto" role="status" style={{
      position: "fixed", inset: 0, zIndex: 99990, background: "#fff",
      display: "flex", flexDirection: "column", justifyContent: "center",
      alignItems: "center", gap: 20, pointerEvents: "none"
    }}>
      <img src={LOGO} alt="MegaMarto" style={{ width: "min(65vw, 230px)", height: "auto", objectFit: "contain" }} />
      <span style={{ width: 34, height: 34, border: "3px solid #d9eee1",
        borderTopColor: "#176b3a", borderRadius: "50%",
        animation: "mm-loading-spin .8s linear infinite" }} />
      <style>{`@keyframes mm-loading-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
