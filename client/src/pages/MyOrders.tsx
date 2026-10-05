import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyOrders.css";

type OrderStatus="PLACED"|"STORE_PENDING"|"CONFIRMED"|"ASSIGNED"|"OUT_FOR_DELIVERY"|"SHIPPED"|"DELIVERED"|"CANCELLED";
type Order={_id:string;items:{_id?:string;name:string;price:number;qty:number;image?:string}[];total:number;status:OrderStatus;createdAt?:string;paymentMethod?:string;paymentStatus?:string;address?:{city?:string;street?:string;pincode?:string}};
const steps:OrderStatus[]=["PLACED","CONFIRMED","ASSIGNED","OUT_FOR_DELIVERY","DELIVERED"];

function MyOrders(){
 const [orders,setOrders]=useState<Order[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const navigate=useNavigate();
 useEffect(()=>{let ignore=false;(async()=>{try{const token=localStorage.getItem("customerToken");if(!token||token==="undefined"||token==="null"){setError("Session expired. Please login again");return}const res=await fetch("https://megamarto-backend.onrender.com/orders",{headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"}});const data=await res.json();if(ignore)return;if(res.status===401||res.status===403){setError("Session expired. Please login again");setOrders([])}else if(!res.ok){setError(data?.message||"Failed to load orders");setOrders([])}else{setOrders(Array.isArray(data)?data:[]);setError("")}}catch{if(!ignore)setError("Server error")}finally{if(!ignore)setLoading(false)}})();return()=>{ignore=true}},[]);
 const progress=(s:OrderStatus)=>{if(s==="CANCELLED")return 100;const normalized=s==="STORE_PENDING"?"PLACED":s==="SHIPPED"?"OUT_FOR_DELIVERY":s;return Math.max(20,((steps.indexOf(normalized)+1)/steps.length)*100)};
 const date=(d?:string)=>d?new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"Recently";
 if(loading)return <div className="orders-state">Loading your orders...</div>;
 return <main className="orders-page">
   <header className="orders-head"><div><span>MY ORDERS</span><h1>Orders & delivery</h1><p>Review your purchases and track delivery progress.</p></div><button onClick={()=>navigate("/")}>Continue Shopping</button></header>
   {error&&<div className="orders-error">{error}</div>}
   {!orders.length?<section className="orders-empty"><div>📦</div><h2>No orders yet</h2><p>Your placed orders will appear here.</p><button onClick={()=>navigate("/")}>Start Shopping</button></section>:
   <section className="orders-list">{orders.map(order=><article className="order-item" key={order._id}>
     <div className="order-title"><div><span className={`status status-${order.status.toLowerCase()}`}>{order.status.replaceAll("_"," ")}</span><h3>Order #{order._id.slice(-8).toUpperCase()}</h3><p>{date(order.createdAt)}</p></div><strong>₹{order.total}</strong></div>
     <div className="order-products">{order.items?.slice(0,5).map((item,i)=><div className="order-product" key={item._id||i}>{item.image?<img src={item.image} alt={item.name}/>:<span>🛒</span>}<div><b>{item.name}</b><small>Qty {item.qty} · ₹{item.price}</small></div></div>)}</div>
     <div className="order-progress"><div style={{width:`${progress(order.status)}%`}} className={order.status==="CANCELLED"?"cancelled":""}/></div>
     <div className="order-meta"><span>💳 {order.paymentMethod||"COD"} · {order.paymentStatus||"PENDING"}</span>{order.address?.city&&<span>📍 {order.address.city}{order.address.pincode?` · ${order.address.pincode}`:""}</span>}</div><div className="order-footer"><span>{order.items?.length||0} item{order.items?.length===1?"":"s"}</span><button onClick={()=>navigate(`/track/${order._id}`)}>Track Order</button></div>
   </article>)}</section>}
 </main>
}
export default MyOrders;