import axios from "axios";

// Base instance
const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Request interceptor to add bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
