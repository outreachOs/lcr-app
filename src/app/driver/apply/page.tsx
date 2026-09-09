"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type VehicleType = "RECOVERY_TRUCK" | "FLATBED" | "VAN";
const VEHICLES: { id: VehicleType; label: string }[] = [
  { id: "RECOVERY_TRUCK", label: "Recovery Truck" },
  { id: "FLATBED", label: "Flatbed" },
  { id: "VAN", label: "Van" },
];

export default function DriverApplyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("RECOVERY_TRUCK");
  const [vehicleDesc, setVehicleDesc] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [coverageArea, setCoverageArea] = useState("Leicester & up to 20 miles");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password, vehicleType, vehicleDesc, vehicleReg, coverageArea }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error ?? "Something went wrong — try again.");
      setLoading(false);
      return;
    }

    await signIn("credentials", { phone, password, redirect: false });
    setLoading(false);
    router.push("/driver/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white rounded-card border border-border p-6 shadow-sm">
        <div className="w-11 h-11 rounded-xl bg-navy flex items-center justify-center mb-4">
          <span className="text-yellow font-display font-bold">L</span>
        </div>
        <h1 className="font-display font-bold text-xl mb-1">Drive for Leicester Car Recovery</h1>
        <p className="text-ink-2 text-sm mb-5">Get sent jobs across Leicestershire, paid on completion. No monthly fees.</p>

        <label className="block text-xs font-bold text-ink-3 mb-1">FULL NAME</label>
        <input className="w-full bg-bg rounded-xl px-3 py-3 mb-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />

        <label className="block text-xs font-bold text-ink-3 mb-1">PHONE NUMBER</label>
        <input className="w-full bg-bg rounded-xl px-3 py-3 mb-3 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXX XXXXXX" required />

        <label className="block text-xs font-bold text-ink-3 mb-1">PASSWORD</label>
        <input type="password" className="w-full bg-bg rounded-xl px-3 py-3 mb-3 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

        <label className="block text-xs font-bold text-ink-3 mb-1">VEHICLE TYPE</label>
        <div className="flex gap-2 mb-3">
          {VEHICLES.map((v) => (
            <button
              type="button"
              key={v.id}
              onClick={() => setVehicleType(v.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${
                vehicleType === v.id ? "bg-navy text-white" : "bg-bg text-ink-2"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <label className="block text-xs font-bold text-ink-3 mb-1">VEHICLE DESCRIPTION</label>
        <input
          className="w-full bg-bg rounded-xl px-3 py-3 mb-3 text-sm"
          value={vehicleDesc}
          onChange={(e) => setVehicleDesc(e.target.value)}
          placeholder="e.g. Ford Transit Recovery Truck"
          required
        />

        <label className="block text-xs font-bold text-ink-3 mb-1">REGISTRATION</label>
        <input className="w-full bg-bg rounded-xl px-3 py-3 mb-3 text-sm" value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value)} required />

        <label className="block text-xs font-bold text-ink-3 mb-1">COVERAGE AREA</label>
        <input className="w-full bg-bg rounded-xl px-3 py-3 mb-4 text-sm" value={coverageArea} onChange={(e) => setCoverageArea(e.target.value)} required />

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <button disabled={loading} className="w-full bg-yellow text-navy font-display font-bold text-sm rounded-xl py-3 disabled:opacity-60">
          {loading ? "Submitting…" : "Register Interest"}
        </button>
        <p className="text-ink-3 text-[11px] mt-3 text-center">
          We review every application and get back to you within 48 hours.
        </p>
      </form>
    </main>
  );
}
