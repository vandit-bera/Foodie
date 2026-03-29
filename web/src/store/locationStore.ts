"use client";
import { create } from "zustand";

interface LocationState {
  lat: number | null;
  lng: number | null;
  city: string | null;
  permissionGranted: boolean;
  setLocation: (lat: number, lng: number, city?: string) => void;
  setPermissionGranted: (v: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  lat: null,
  lng: null,
  city: null,
  permissionGranted: false,

  setLocation: (lat, lng, city) => set({ lat, lng, city, permissionGranted: true }),
  setPermissionGranted: (v) => set({ permissionGranted: v }),
}));
