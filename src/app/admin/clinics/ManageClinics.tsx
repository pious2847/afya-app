"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { AddressWithMapSearch } from "@/components/AddressWithMapSearch";

type Clinic = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  type: string;
  latitude?: number | null;
  longitude?: number | null;
};

export function ManageClinics() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Clinic | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    type: "clinic",
    latitude: "" as string | number,
    longitude: "" as string | number,
  });
  const [geocoding, setGeocoding] = useState(false);

  const load = () => {
    fetch("/api/clinics")
      .then((r) => r.json())
      .then((j) => j.ok && setClinics(j.clinics || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const openAdd = () => {
    setForm({ name: "", address: "", phone: "", type: "clinic", latitude: "", longitude: "" });
    setEditing(null);
    setModal("add");
  };

  const openEdit = (c: Clinic) => {
    setForm({
      name: c.name,
      address: c.address,
      phone: c.phone || "",
      type: c.type,
      latitude: c.latitude ?? "",
      longitude: c.longitude ?? "",
    });
    setEditing(c);
    setModal("edit");
  };

  const fetchCoordinates = async () => {
    const addr = form.address.trim();
    if (!addr) {
      alert("Enter an address first");
      return;
    }
    setGeocoding(true);
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(addr)}`);
      const data = await res.json();
      if (data.ok) {
        setForm((f) => ({ ...f, latitude: data.lat, longitude: data.lng, address: data.formattedAddress || addr }));
      } else {
        alert(data.error || "Could not find coordinates");
      }
    } catch {
      alert("Failed to geocode address");
    } finally {
      setGeocoding(false);
    }
  };

  const handlePlaceSelect = (data: { name?: string; address: string; lat: number; lng: number }) => {
    setForm((f) => ({
      ...f,
      address: data.address,
      latitude: data.lat,
      longitude: data.lng,
      ...(data.name && !f.name ? { name: data.name } : {}),
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      address: form.address,
      phone: form.phone || null,
      type: form.type,
      latitude: form.latitude === "" ? undefined : Number(form.latitude),
      longitude: form.longitude === "" ? undefined : Number(form.longitude),
    };
    const url = editing
      ? `/api/admin/clinics/${editing.id}`
      : "/api/admin/clinics";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setModal(null);
      setEditing(null);
      load();
    } else {
      const err = await res.json();
      alert(err.error || "Failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this clinic?")) return;
    const res = await fetch(`/api/admin/clinics/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else alert("Failed to delete");
  };

  if (loading) {
    return (
      <div className="mt-8 flex justify-center py-16">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const displayClinics = clinics.filter((c) => !String(c.id).startsWith("demo-"));

  return (
    <div className="mt-8">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-5 w-5" />
          Add Clinic
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {displayClinics.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">No clinics in database yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Add clinics above, or run the seed script to add demo data.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Add First Clinic
            </button>
          </div>
        ) : (
          displayClinics.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5"
            >
              <div>
                <h3 className="font-semibold text-slate-900">{c.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{c.address}</p>
                {c.phone && (
                  <p className="mt-1 text-sm text-slate-600">{c.phone}</p>
                )}
                <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {c.type}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {editing ? "Edit Clinic" : "Add Clinic"}
            </h3>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Address
                </label>
                <AddressWithMapSearch
                  address={form.address}
                  onAddressChange={(v) => setForm((f) => ({ ...f, address: v }))}
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="Search on map or type address..."
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchCoordinates}
                    disabled={geocoding || !form.address.trim()}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <MapPin className="h-4 w-4" />
                    {geocoding ? "Fetching…" : "Get coordinates"}
                  </button>
                  {(form.latitude !== "" && form.longitude !== "") && (
                    <span className="text-xs text-slate-500">
                      {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                >
                  <option value="clinic">Clinic</option>
                  <option value="hospital">Hospital</option>
                  <option value="health_center">Health Center</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
                >
                  {editing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
