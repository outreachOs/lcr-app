"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type ServiceType = "CAR" | "VAN" | "ACCIDENT" | "TRANSPORT";

const SERVICES: { id: ServiceType; label: string }[] = [
  { id: "CAR", label: "Car" },
  { id: "VAN", label: "Van" },
  { id: "ACCIDENT", label: "Accident" },
  { id: "TRANSPORT", label: "Transport" },
];

export default function RequestPage() {
  const router = useRouter();
  const [step, setStep] = useState<"account" | "booking">("account");

  // account step
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  // booking step
  const [service, setService] = useState<ServiceType>("CAR");
  const [pickup, setPickup] = useState("");
  const [pickupPostcode, setPickupPostcode] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [dropoffPostcode, setDropoffPostcode] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  async function createAccountAndContinue(e: React.FormEvent) {
    e.preventDefault();
    setAccountLoading(true);
    setAccountError(null);

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setAccountError(body?.error ?? "Something went wrong — try again.");
      setAccountLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { phone, password, redirect: false });
    setAccountLoading(false);

    if (signInRes?.error) {
      setAccountError("Account created, but sign-in failed — try signing in from the login page.");
      return;
    }
    setStep("booking");
  }

  async function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError(null);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceType: service,
        pickupAddress: pickup,
        pickupPostcode,
        dropoffAddress: dropoff,
        dropoffPostcode,
      }),
    });

    if (!res.ok) {
      setBookingError("Couldn't submit your request — try again.");
      setBookingLoading(false);
      return;
    }

    const { job } = await res.json();
    router.push(`/track/${job.id}`);
  }

  if (step === "account") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 py-10">
        <form onSubmit={createAccountAndContinue} className="w-full max-w-sm bg-white rounded-card border border-border p-6 shadow-sm">
          <h1 className="font-display font-bold text-xl mb-1">Where's the vehicle stuck?</h1>
          <p className="text-ink-2 text-sm mb-5">First, a quick account so we can send you updates on your recovery.</p>

          <label className="block text-xs font-bold text-ink-3 mb-1">FULL NAME</label>
          <input className="w-full bg-bg rounded-xl px-3 py-3 mb-4 text-sm" value={name} onChange={(e) => setName(e.target.value)} required />

          <label className="block text-xs font-bold text-ink-3 mb-1">PHONE NUMBER</label>
          <input className="w-full bg-bg rounded-xl px-3 py-3 mb-4 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXX XXXXXX" required />

          <label className="block text-xs font-bold text-ink-3 mb-1">PASSWORD</label>
          <input type="password" className="w-full bg-bg rounded-xl px-3 py-3 mb-4 text-sm" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

          {accountError && <p className="text-red-600 text-xs mb-3">{accountError}</p>}

          <button disabled={accountLoading} className="w-full bg-yellow text-navy font-display font-bold text-sm rounded-xl py-3 disabled:opacity-60">
            {accountLoading ? "Setting up…" : "Continue"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <form onSubmit={submitBooking} className="w-full max-w-sm bg-white rounded-card border border-border p-6 shadow-sm">
        <h1 className="font-display font-bold text-xl mb-5">Book your recovery</h1>

        <div className="bg-bg rounded-2xl px-4 py-1 mb-4">
          <div className="flex items-center gap-3 py-3 border-b border-border">
            <div className="w-2 h-2 rounded-full bg-good shrink-0" />
            <div className="flex-1 flex gap-2">
              <div className="flex-[2]">
                <div className="text-[10px] font-bold text-ink-3 tracking-wide">PICKUP</div>
                <input
                  className="w-full bg-transparent text-sm font-medium outline-none"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Where's the vehicle now?"
                  required
                />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-ink-3 tracking-wide">POSTCODE</div>
                <input
                  className="w-full bg-transparent text-sm font-medium outline-none uppercase"
                  value={pickupPostcode}
                  onChange={(e) => setPickupPostcode(e.target.value)}
                  placeholder="LE19 4AT"
                  required
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3">
            <div className="w-2 h-2 rounded-full bg-yellow shrink-0" />
            <div className="flex-1 flex gap-2">
              <div className="flex-[2]">
                <div className="text-[10px] font-bold text-ink-3 tracking-wide">DROP-OFF</div>
                <input
                  className="w-full bg-transparent text-sm font-medium outline-none"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder="Where's it going?"
                  required
                />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-ink-3 tracking-wide">POSTCODE</div>
                <input
                  className="w-full bg-transparent text-sm font-medium outline-none uppercase"
                  value={dropoffPostcode}
                  onChange={(e) => setDropoffPostcode(e.target.value)}
                  placeholder="LE1 1RE"
                  required
                />
              </div>
            </div>
          </div>
        </div>
        <p className="text-ink-3 text-[11px] mb-4 -mt-2">Postcode gives you an accurate estimate based on distance — the price band updates automatically.</p>

        <div className="text-[11px] font-bold text-ink-3 tracking-wide mb-2">CHOOSE A SERVICE</div>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {SERVICES.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setService(s.id)}
              className={`h-16 rounded-2xl text-[11px] font-bold transition-colors ${
                service === s.id ? "bg-navy text-white" : "bg-bg text-ink-2"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {bookingError && <p className="text-red-600 text-xs mb-3">{bookingError}</p>}

        <button disabled={bookingLoading} className="w-full bg-yellow text-navy font-display font-bold text-sm rounded-xl py-3 disabled:opacity-60">
          {bookingLoading ? "Requesting…" : "Request Recovery"}
        </button>
      </form>
    </main>
  );
}
