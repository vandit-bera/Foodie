"use client";
import { useEffect } from "react";
import { useLocationStore } from "@/store/locationStore";

/**
 * Requests browser geolocation and stores coords in Zustand.
 * Call once in the root layout or feed page.
 */
export function useRequestLocation() {
  const { setLocation, setPermissionGranted } = useLocationStore();

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setPermissionGranted(false);
      }
    );
  }, [setLocation, setPermissionGranted]);
}
