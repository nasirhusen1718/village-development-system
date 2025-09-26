import api from "./http";

export const login = async (email, password) => {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);
  const resp = await api.post("/api/token", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const { access_token, role } = resp.data || {};
  if (access_token) {
    localStorage.setItem("token", access_token);
    localStorage.setItem("role", role || "");
  }
  return resp;
};

// Registration endpoint
export const register = (payload) => api.post("/api/register", payload);
