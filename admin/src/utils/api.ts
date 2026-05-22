import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const api = axios.create({ 
  baseURL: API_URL, 
  withCredentials: true 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  
  async (err) => {
    const original = err.config;

    // Check for token expired (both direct 401 and your backend message)
    const isTokenExpired = 
      err.response?.status === 401 || 
      err.response?.data?.message === "Token expired." ||
      err.response?.data?.success === false && 
      err.response?.data?.message?.toLowerCase().includes("expired");

    if (isTokenExpired && !original._retry) {
      original._retry = true;

      try {
        // Try to refresh token
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`, 
          {}, 
          { withCredentials: true }
        );

        const newToken = data.data?.accessToken || data.accessToken;
        
        if (newToken) {
          localStorage.setItem("accessToken", newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);   // Retry original request
        }
      } catch (refreshError) {
        // Refresh failed → Token is truly expired
        localStorage.removeItem("accessToken");
        
        // Option 1: Reload current page (What you asked for)
        window.location.reload();
        
        // Option 2: If you prefer redirect to login instead:
        window.location.href = "/login?expired=true";
      }
    }

    return Promise.reject(err);
  }
);

export default api;