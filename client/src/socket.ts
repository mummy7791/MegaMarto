import { io } from "socket.io-client";

export const socket = io("http://https://megamarto-backend.onrender.com", {
  transports: ["websocket"],
  autoConnect: false,
});