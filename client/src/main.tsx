import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Capacitor } from "@capacitor/core";
import "./index.css";

if (Capacitor.isNativePlatform()) document.documentElement.classList.add("mm-native-app");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);