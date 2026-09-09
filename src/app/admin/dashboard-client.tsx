"use client";

import { useEffect, useState } from "react";
import { formatPence, suggestFinalPrice } from "@/lib/pricing";
import type { ServiceType } from "@prisma/client";

type Job = {
  id: string;
  status: string;
  serviceType: ServiceType;
  pickupAddress: string;
  dropoffAddress: string;
  distanceMiles: number | null;
  priceEstimateLow: number;
  priceEstimateHigh: number;
  wholesaleQuote: number | null;
  priceFinal: number | null;
  customer: { name: string; phone: string };
  driver: { id: string; user: { name: string } } | null;
};

type Driver = {
  id: string;
  status: string;
  vehicleDesc: string;
  user: { name: string; phone: string };
};

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [jobsRes, driversRes] = await Promise.all([fetch("/api/jobs"), fetch("/api/drivers")]);
    if (jobsRes.ok) setJobs((await jobsRes.json()).jobs);
    if (driversRes.ok) setDrivers((await driversRes.json()).drivers);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const approvedDrivers = drivers.filter((d) => d.status === "APPROVED");
  const pendingDrivers = drivers.filter((d) => d.status === "PENDING");
  const pendingJobs = jobs.filter((j) => j.status === "REQUESTED");

  async function assign(jobId: string, driverId: string) {
    if (!driverId) return;
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId }),
    });
    load();
  }

  async function setDriverStatus(driverId: string, status: string) {
    await fetch(`/api/drivers/${driverId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function confirmPrice(jobId: string, wholesaleQuote: number, priceFinal: number) {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wholesaleQuote, priceFinal }),
    });
    load();
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center text-ink-2">Loading…</main>;

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1">Dispatch</h1>
      <p className="text-ink-2 text-sm mb-8">{pendingJobs.length} job(s) waiting to be assigned.</p>

      <section className="mb-10">
        <h2 className="font-display font-bold text-sm text-ink-2 mb-3 uppercase tracking-wide">Incoming jobs</h2>
        <div className="flex flex-col gap-3">
          {jobs.length === 0 && <div className="text-ink-2 text-sm">No jobs yet.</div>}
          {jobs.map((job) => (
            <div key={job.id} className="bg-white border border-border rounded-card p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-display font-bold text-sm">
                    {job.serviceType} · {job.customer.name}
                  </div>
                  <div className="text-ink-2 text-xs">
                    {job.pickupAddress} → {job.dropoffAddress}
                    {job.distanceMiles != null && ` · ${job.distanceMiles.toFixed(1)} mi`}
                  </div>
                  <div className="text-ink-2 text-xs">
                    {job.priceFinal
                      ? `${formatPence(job.priceFinal)} confirmed`
                      : `${formatPence(job.priceEstimateLow)} – ${formatPence(job.priceEstimateHigh)} estimate`}
                    {" · "}
                    {job.status}
                  </div>
                </div>
                {job.driver ? (
                  <div className="text-xs font-semibold text-good">Assigned to {job.driver.user.name}</div>
                ) : (
                  <select
                    defaultValue=""
                    onChange={(e) => assign(job.id, e.target.value)}
                    className="text-xs bg-bg rounded-xl px-3 py-2 border border-border"
                  >
                    <option value="" disabled>
                      Assign driver…
                    </option>
                    {approvedDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.user.name} — {d.vehicleDesc}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {job.driver && !job.priceFinal && (
                <QuoteEntry serviceType={job.serviceType} onConfirm={(wholesale, final) => confirmPrice(job.id, wholesale, final)} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display font-bold text-sm text-ink-2 mb-3 uppercase tracking-wide">
          Driver applications ({pendingDrivers.length} pending)
        </h2>
        <div className="flex flex-col gap-3">
          {drivers.length === 0 && <div className="text-ink-2 text-sm">No applications yet.</div>}
          {drivers.map((d) => (
            <div key={d.id} className="bg-white border border-border rounded-card p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-display font-bold text-sm">{d.user.name}</div>
                <div className="text-ink-2 text-xs">{d.vehicleDesc} · {d.user.phone}</div>
                <div className="text-ink-2 text-xs">{d.status}</div>
              </div>
              {d.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setDriverStatus(d.id, "APPROVED")}
                    className="text-xs font-bold bg-yellow text-navy rounded-xl px-3 py-2"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setDriverStatus(d.id, "REJECTED")}
                    className="text-xs font-bold bg-bg text-ink-2 rounded-xl px-3 py-2"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// Replaces "ring the customer back": once you've got the driver's wholesale
// quote by phone, type it in — the final price defaults to your usual
// markup (+£25 standard, +£50 bigger jobs) and you can adjust it before
// confirming. The customer's tracking page updates on its own.
function QuoteEntry({ serviceType, onConfirm }: { serviceType: ServiceType; onConfirm: (wholesale: number, final: number) => void }) {
  const [wholesale, setWholesale] = useState("");
  const [final, setFinal] = useState("");
  const [finalTouched, setFinalTouched] = useState(false);

  function onWholesaleChange(value: string) {
    setWholesale(value);
    const pounds = parseFloat(value);
    if (!finalTouched && !Number.isNaN(pounds)) {
      const suggested = suggestFinalPrice(Math.round(pounds * 100), serviceType);
      setFinal((suggested / 100).toFixed(2));
    }
  }

  function submit() {
    const wholesalePence = Math.round(parseFloat(wholesale) * 100);
    const finalPence = Math.round(parseFloat(final) * 100);
    if (Number.isNaN(wholesalePence) || Number.isNaN(finalPence)) return;
    onConfirm(wholesalePence, finalPence);
  }

  return (
    <div className="mt-3 pt-3 border-t border-border flex items-end gap-2 flex-wrap">
      <div>
        <label className="block text-[10px] font-bold text-ink-3 mb-1">DRIVER'S QUOTE (£)</label>
        <input
          className="w-28 bg-bg rounded-xl px-3 py-2 text-sm"
          value={wholesale}
          onChange={(e) => onWholesaleChange(e.target.value)}
          placeholder="110"
          inputMode="decimal"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-ink-3 mb-1">CHARGE CUSTOMER (£)</label>
        <input
          className="w-28 bg-bg rounded-xl px-3 py-2 text-sm font-semibold"
          value={final}
          onChange={(e) => {
            setFinalTouched(true);
            setFinal(e.target.value);
          }}
          placeholder="135"
          inputMode="decimal"
        />
      </div>
      <button
        onClick={submit}
        disabled={!wholesale || !final}
        className="text-xs font-bold bg-yellow text-navy rounded-xl px-4 py-2 disabled:opacity-50"
      >
        Confirm price
      </button>
    </div>
  );
}
