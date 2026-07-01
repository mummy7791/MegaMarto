import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

type Props = {
  children: ReactNode;
};

function ProtectedRoute({ children }: Props) {
  const token = localStorage.getItem("token");

  const isAuth =
    token && token !== "undefined" && token !== "null";

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;