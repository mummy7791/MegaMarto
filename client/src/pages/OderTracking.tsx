import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./OrderTracking.css";

type OrderStatus = "PLACED"|"STORE_PENDING"|"STORE_ACCEPTED"|"STORE_CANCELLED"|"ASSIGNED"|"DELIVERY_ACCEPTED"|"PICKED_UP"|"OUT_FOR_DELIVERY"|"DELIVERED";
type Order = {
  _id:string; total:number; status:OrderStatus; storeName?:string; storeId?:{storeName?:string}|null; createdAt?:string; paymentMethod?:string; paymentStatus?:string;
  address?:{name?:string;phone?:string;city?:string;street?:string;pincode?:string};
  items?:{name:string;qty:number;price:number;image?:string}[];
};
const steps=[["PLACED","Order placed","We received your order"],["STORE_ACCEPTED","Store accepted","The shop is preparing your items"],["ASSIGNED","Partner assigned","Delivery partner has been assigned"],["PICKED_UP","Picked up","Your items were collected from the shop"],["OUT_FOR_DELIVERY","Out for delivery","Your order is on the way"],["DELIVERED","Delivered","Order delivered successfully"]] as const;
const normalized=(s:OrderStatus)=>s==="STORE_PENDING"?"PLACED":s==="DELIVERY_ACCEPTED"?"ASSIGNED":s;

export default function OrderTracking(){
 const {id}=useParams<{id:string}>(); const navigate=useNavigate();
 const [order,setOrder]=useState<Order|null>(null),[loading,setLoading]=useState(!!id),[error,setError]=useState("");
 const intervalRef=useRef<ReturnType<typeof setInterval>|null>(null);
 const fetchOrder=async()=>{if(!id)return;try{const token=localStorage.getItem("customerToken");const res=await fetch(`https://megamarto-backend.onrender.com/orders/${id}`,{headers:{Authorization:`Bearer ${token}`}});const data=await res.json();if(!res.ok)throw new Error(data?.message||"Failed to load order");setOrder(data);setError("")}catch(e){setError(e instanceof Error?e.message:"Server error")}finally{setLoading(false)}};
 useEffect(()=>{fetchOrder();intervalRef.current=setInterval(fetchOrder,5000);return()=>{if(intervalRef.current)clearInterval(intervalRef.current)}},[id]);
 if(loading)return <div className="ot-state">Loading live order status…</div>;
 if(error||!order)return <div className="ot-state"><h2>Unable to track order</h2><p>{error||"Order not found"}</p><button onClick={()=>navigate("/orders")}>Back to orders</button></div>;
 const cancelled=order.status==="STORE_CANCELLED"; const status=normalized(order.status); const current=Math.max(0,steps.findIndex(([key])=>key===status)); const delivered=status==="DELIVERED";
 return <main className="ot-page">
   <button className="ot-back" onClick={()=>navigate("/orders")}>← My orders</button>
   <section className={`ot-hero ${cancelled?"ot-cancelled":""}`}>
    <div><span>LIVE ORDER</span><h1>{cancelled?"Order cancelled":delivered?"Delivered successfully":"Your order is being prepared"}</h1><p>Order #{order._id.slice(-8).toUpperCase()} · Status refreshes automatically</p></div>
    <div className="ot-eta"><small>{cancelled||delivered?"STATUS":"ESTIMATED DELIVERY"}</small><b>{cancelled?"Cancelled":delivered?"Delivered":"10–20 min"}</b></div>
   </section>
   <div className="ot-grid">
    <section className="ot-card">
      <div className="ot-card-head"><div><span>ORDER JOURNEY</span><h2>Track your delivery</h2></div><button onClick={fetchOrder}>Refresh</button></div>
      {cancelled?<div className="ot-cancel-message"><b>This shop order was cancelled.</b><p>No further delivery progress will be shown for this order.</p></div>:<div className="ot-timeline">{steps.map(([key,title,text],i)=><div className={`ot-step ${i<=current?"done":""} ${i===current?"current":""}`} key={key}><div className="ot-dot">{i<current||delivered?"✓":i+1}</div><div><b>{title}</b><p>{i<current||delivered?"Completed":i===current?text:"Pending"}</p></div></div>)}</div>
    </section>
    <aside>
      <section className="ot-card ot-summary"><span>ORDER SUMMARY</span><p className="ot-store">🏪 {order.storeId?.storeName||order.storeName||"MegaMarto"}</p><h2>₹{order.total}</h2><div><small>Payment</small><b>{order.paymentMethod||"COD"} · {order.paymentStatus||"PENDING"}</b></div><div><small>Items</small><b>{order.items?.reduce((n,x)=>n+x.qty,0)||0} items</b></div></section>
      <section className="ot-card ot-address"><span>DELIVERING TO</span><h3>{order.address?.name||"Customer"}</h3><p>{order.address?.street}{order.address?.city?", "+order.address.city:""}{order.address?.pincode?" - "+order.address.pincode:""}</p>{order.address?.phone&&<small>📞 {order.address.phone}</small>}</section>
    </aside>
   </div>
 </main>;
}