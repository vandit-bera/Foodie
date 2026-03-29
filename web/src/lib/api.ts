/**
 * Axios instance with:
 * - Base URL from env
 * - Auth header injection (from Zustand store)
 * - 401 auto-logout
 */
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
});

// ── Request interceptor: attach Bearer token ──────────────────────────────────
api.interceptors.request.use((config) => {
  // Import lazily to avoid circular deps at module load time
  const { useAuthStore } = require("@/store/authStore");
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const { useAuthStore } = require("@/store/authStore");
      useAuthStore.getState().clearAuth();
      // Redirect handled by middleware or component
    }
    return Promise.reject(error);
  }
);
