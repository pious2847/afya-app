"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Navigation,
  Phone,
  Search,
  Building2,
  Heart,
  Stethoscope,
  Filter,
  Loader2,
} from "lucide-react";

type Clinic = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  type: string;
  distanceKm?: number;
  distanceText?: string;
  latitude?: number;
  longitude?: number;
};

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Building2; color: string; bg: string }> = {
  hospital: { label: "Hospital", icon: Building2, color: "text-rose-700", bg: "bg-rose-100" },
  health_center: { label: "Health Center", icon: Heart, color: "text-emerald-700", bg: "bg-emerald-100" },
  clinic: { label: "Clinic", icon: Stethoscope, color: "text-teal-700", bg: "bg-teal-100" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.clinic;
}

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"distance" | "name">("distance");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch("/api/clinics")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setClinics(json.clinics || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError("Could not get your location"),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    const params = new URLSearchParams({ lat: String(userLocation.lat), lng: String(userLocation.lng) });
    if (typeFilter !== "all") params.set("type", typeFilter);
    fetch(`/api/clinics/nearby?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setClinics(json.clinics || []);
      });
  }, [userLocation, typeFilter]);

  const filteredAndSorted = useMemo(() => {
    let list = clinics;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      list = list.filter((c) => c.type === typeFilter);
    }
    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "distance" && userLocation) {
      list = [...list].sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }
    return list;
  }, [clinics, search, typeFilter, sortBy, userLocation]);

  const openInMaps = (clinic: Clinic) => {
    if (clinic.latitude != null && clinic.longitude != null) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`,
        "_blank"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl font-bold text-emerald-700">
            AfyaAI
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-emerald-600">
              Dashboard
            </Link>
            <Link
              href="/teleconsult"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Call AI
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-10 text-white shadow-xl sm:px-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find Healthcare
          </h1>
          <p className="mt-2 max-w-xl text-emerald-100">
            {userLocation
              ? "Clinics sorted by distance. Use filters to narrow results."
              : "Enable location to see the nearest facilities first."}
          </p>
          {locationError && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100">
              {locationError}
            </p>
          )}
        </div>

        {/* Search & Filters */}
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  showFilters ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "distance" | "name")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="distance">By distance</option>
                <option value="name">A–Z</option>
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
              <span className="mr-2 flex items-center text-sm font-medium text-slate-600">Type:</span>
              {["all", "hospital", "health_center", "clinic"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    typeFilter === t
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {t === "all" ? "All" : getTypeConfig(t).label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="mt-4 text-sm text-slate-500">
          {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "facility" : "facilities"} found
        </p>

        {/* Clinic cards */}
        {loading ? (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-slate-500">Loading clinics…</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <Building2 className="mx-auto h-14 w-14 text-slate-300" />
            <p className="mt-4 font-medium text-slate-700">No clinics match your filters</p>
            <p className="mt-2 text-sm text-slate-500">
              Try adjusting your search or filters, or add clinics via the admin panel.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((clinic) => {
              const config = getTypeConfig(clinic.type);
              const Icon = config.icon;
              return (
                <div
                  key={clinic.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-200 hover:shadow-lg"
                >
                  <div className={`h-1.5 ${config.bg}`} />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {clinic.distanceText && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <MapPin className="h-3 w-3" />
                          {clinic.distanceText}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900 line-clamp-2">{clinic.name}</h3>
                    <span className={`mt-1.5 inline-block w-fit rounded-lg px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{clinic.address}</p>
                    <div className="mt-4 flex flex-1 flex-col gap-2">
                      {clinic.phone && (
                        <a
                          href={`tel:${clinic.phone}`}
                          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </a>
                      )}
                      {clinic.latitude != null && clinic.longitude != null && (
                        <button
                          type="button"
                          onClick={() => openInMaps(clinic)}
                          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <Navigation className="h-4 w-4" />
                          Directions
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
