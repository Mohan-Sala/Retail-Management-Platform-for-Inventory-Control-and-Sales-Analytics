import axios from "axios";

// Read API URL from Vite environment or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to dynamically inject the stored JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("shopsense.auth.token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to flatten success wrappers and normalize errors
api.interceptors.response.use(
  (response) => {
    // Return the response data body directly (e.g. { success, message, data })
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("shopsense.auth.user");
        localStorage.removeItem("shopsense.auth.token");
        window.location.href = "/login";
      }
    }
    const errorBody = error.response?.data;
    const message = errorBody?.message || error.message || "An unexpected error occurred";
    const errorsList = errorBody?.errors || [];
    
    return Promise.reject({
      message,
      errors: errorsList,
      status: error.response?.status,
    });
  }
);

export default api;
