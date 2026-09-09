"use client";

import { useEffect, useState } from "react";
import { formatPence } from "@/lib/pricing";

type Job = {
  id: string;
  status: string;
  serviceType: string;
  pickupAddress: string;
  dropoffAddress: string;
  priceEstimateLow: number;
  priceEstimateHigh: number;
  priceFinal: number | null;
  driver: { id: string; vehicleDesc: string; vehicleReg: string; ratingAvg: number; user: { name: string } } | null;
};

const STEPS = ["REQUESTED", "ASSIGNED", "EN_ROUTE", "ARRIVED", "RECOVERED", "COMPLETED"];
const STEP_LABEL: Record<string, string> = {
  REQUESTED: "Requested",
  ASSIGNED: "Assigned",
  EN_ROUTE: "En route",
  ARRIVED: "Arrived",
  RECOVERED: "Recovered",
  COMPLETED: "Complete",
};

export default function TrackPage({ params }: { params: { jobId: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/jobs/${params.jobId}`);
      if (cancelled) return;
      if (!res.ok) {
        setError("Couldn't load this job.");
        return;
      }
      const { job } = await res.json();
      setJob(job);
    }

    load();
    // Polling stands in for realtime for now — swap for a websocket/SSE
    // channel in Phase 3 alongside live driver location.
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [params.jobId]);

  if (error) return <main className="min-h-screen flex items-center justify-center text-ink-2">{error}</main>;
  if (!job) return <main className="min-h-screen flex items-center justify-center text-ink-2">Loading…</main>;

  const stepIndex = Math.max(0, STEPS.indexOf(job.status));

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm bg-white rounded-card border border-border p-6 shadow-sm">
        <h1 className="font-display font-bold text-xl mb-1">
          {job.status === "REQUESTED" ? "Finding your nearest driver…" : STEP_LABEL[job.status]}
        </h1>
        <p className="text-ink-2 text-sm mb-5">
          {job.pickupAddress} → {job.dropoffAddress}
        </p>

        <div className="flex items-center mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-4 h-4 rounded-full ${
                    i <= stepIndex ? "bg-yellow" : "bg-bg border-2 border-border"
                  }`}
                />
                <span className={`text-[9px] font-semibold ${i <= stepIndex ? "text-ink" : "text-ink-3"}`}>
                  {STEP_LABEL[s]}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < stepIndex ? "bg-yellow" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {job.driver ? (
          <div className="bg-bg rounded-2xl p-4 mb-5 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-navy text-yellow font-display font-bold flex items-center justify-center">
              {job.driver.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="font-display font-bold text-sm">{job.driver.user.name}</div>
              <div className="text-ink-2 text-xs">{job.driver.vehicleDesc} • {job.driver.vehicleReg}</div>
              <div className="text-ink-2 text-xs">★ {job.driver.ratingAvg.toFixed(1)}</div>
            </div>
          </div>
        ) : (
          <div className="bg-bg rounded-2xl p-4 mb-5 text-ink-2 text-sm">
            We'll assign a driver shortly — this page updates automatically.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-ink-3">{job.priceFinal ? "PRICE CONFIRMED" : "ESTIMATED PRICE"}</div>
            <div className="font-display font-bold text-lg">
              {job.priceFinal
                ? formatPence(job.priceFinal)
                : `${formatPence(job.priceEstimateLow)} – ${formatPence(job.priceEstimateHigh)}`}
            </div>
            {!job.priceFinal && (
              <div className="text-ink-3 text-[11px] mt-0.5">Confirmed once your driver's assessed the job</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
