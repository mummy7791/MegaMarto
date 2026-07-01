// ================= GET TOKEN =================

export const getToken = () => {
  const customerToken =
    localStorage.getItem("customerToken");

  const adminToken =
    localStorage.getItem("adminToken");

  const deliveryToken =
    localStorage.getItem("deliveryToken");

  const token =
    customerToken ||
    adminToken ||
    deliveryToken;

  if (
    !token ||
    token === "undefined" ||
    token === "null" ||
    token.trim() === ""
  ) {
    return null;
  }

  return token;
};

// ================= GET USER =================

export const getUser = () => {
  try {
    const user = localStorage.getItem("user");

    if (!user) return null;

    return JSON.parse(user);
  } catch {
    return null;
  }
};

// ================= IS LOGGED IN =================

export const isLoggedIn = () => {
  return !!getToken();
};

// ================= LOGOUT =================

export const logout = () => {
  localStorage.removeItem("customerToken");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("deliveryToken");

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");

  window.location.href = "/login";
};