/**
 * Axios instance for React Native.
 * API URL loaded from Expo Constants (app.json extra.apiUrl).
 */
import axios from "axios";
import Constants from "expo-constants";

const API_URL: string =
  Constants.expoConfig?.extra?.apiUrl ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
});

// Attach Bearer token from auth store on every request
api.interceptors.request.use((config) => {
  const { useAuthStore } = require("@/store/authStore");
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → clear auth
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const { useAuthStore } = require("@/store/authStore");
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);

export const mediaUrl = (path: string) => {
  const base = API_URL.replace("/api/v1", "");
  return path.startsWith("http") ? path : `${base}${path}`;
};
