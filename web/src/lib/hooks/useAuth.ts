import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { TokenResponse } from "@/types";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<TokenResponse, Error, { email: string; password: string }>({
    mutationFn: async (creds) => {
      const { data } = await api.post<TokenResponse>("/auth/login", creds);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
    },
  });
}

export function useSignup() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation<
    TokenResponse,
    Error,
    { username: string; email: string; password: string; full_name?: string }
  >({
    mutationFn: async (payload) => {
      const { data } = await api.post<TokenResponse>("/auth/signup", payload);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
    },
  });
}

export function useLogout() {
  const { refreshToken, clearAuth } = useAuthStore();

  return async () => {
    try {
      if (refreshToken) await api.post("/auth/logout", { refresh_token: refreshToken });
    } finally {
      clearAuth();
    }
  };
}
