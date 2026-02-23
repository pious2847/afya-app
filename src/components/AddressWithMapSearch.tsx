"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, opts?: { types?: string[] }) => {
            addListener: (event: string, cb: () => void) => void;
            getPlace: () => {
              name?: string;
              formatted_address?: string;
              geometry?: { location: { lat: () => number; lng: () => number } };
            };
          };
        };
      };
    };
    initAddressAutocomplete?: () => void;
  }
}

type Props = {
  address: string;
  onAddressChange: (value: string) => void;
  onPlaceSelect?: (data: { name?: string; address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  id?: string;
};

/**
 * Address input with optional Google Places Autocomplete for search + coordinates.
 * Falls back to plain input if GOOGLE_MAPS_API_KEY (client) is not set.
 */
export function AddressWithMapSearch({
  address,
  onAddressChange,
  onPlaceSelect,
  placeholder = "Search or type address...",
  id = "address-input",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocompleteReady, setAutocompleteReady] = useState(false);
  const key = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "") : "";

  useEffect(() => {
    if (!key || !inputRef.current || autocompleteReady) return;

    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;

    const initAutocomplete = () => {
      if (!window.google?.maps?.places || !inputRef.current) return;
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["establishment", "geocode"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const addr = place.formatted_address || "";
        if (addr) onAddressChange(addr);
        const loc = place.geometry?.location;
        if (loc && onPlaceSelect) {
          onPlaceSelect({
            name: place.name || undefined,
            address: addr,
            lat: loc.lat(),
            lng: loc.lng(),
          });
        }
      });
      setAutocompleteReady(true);
    };

    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      if (window.google?.maps?.places) {
        initAutocomplete();
      } else {
        existing.addEventListener("load", () => initAutocomplete());
      }
      return;
    }

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.onload = () => {
      if (window.google?.maps?.places) initAutocomplete();
    };
    document.head.appendChild(script);
  }, [key, onAddressChange, onPlaceSelect, autocompleteReady]);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      value={address}
      onChange={(e) => onAddressChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
    />
  );
}
