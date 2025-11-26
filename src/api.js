// src/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: API_BASE + "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ems_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
