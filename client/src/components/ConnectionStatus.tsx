import { useEffect, useState } from "react";

export default function ConnectionStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (online) return null;
  return (
    <div role="alert" style={{position:"fixed",inset:0,zIndex:99999,display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc",padding:24,textAlign:"center"}}>
      <div style={{maxWidth:360}}>
        <div style={{fontSize:54}} aria-hidden="true">📶</div>
        <h1 style={{fontSize:24,marginBottom:12}}>No Internet Connection</h1>
        <p style={{color:"#475569",lineHeight:1.6}}>Connect to Wi-Fi or mobile data to use MegaMarto.</p>
        <button type="button" onClick={() => window.location.reload()} style={{background:"#16a34a",color:"#fff",padding:"12px 28px",borderRadius:12,border:0,fontWeight:700,cursor:"pointer"}}>Retry</button>
      </div>
    </div>
  );
}
