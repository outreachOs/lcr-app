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
  customer: { name: string; phone: string };
};

const NEXT_STATUS: Record<string, { next: string; label: string } | undefined> = {
  ASSIGNED: { next: "EN_ROUTE", label: "Start Heading There" },
  EN_ROUTE: { next: "ARRIVED", label: "I've Arrived" },
  ARRIVED: { next: "RECOVERED", label: "Vehicle Recovered" },
  RECOVERED: { next: "COMPLETED", label: "Mark Complete" },
};

export default function DriverDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/jobs");
    if (res.ok) setJobs((await res.json()).jobs);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  async function advance(jobId: string, nextStatus: string) {
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    load();
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center text-ink-2">Loading…</main>;

  return (
    <main className="min-h-screen px-6 py-10 max-w-md mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1">Your jobs</h1>
      <p className="text-ink-2 text-sm mb-8">{jobs.length} active job(s).</p>

      <div className="flex flex-col gap-4">
        {jobs.length === 0 && (
          <div className="bg-white border border-border rounded-card p-5 text-ink-2 text-sm">
            No jobs right now — you'll be notified the moment one comes in.
          </div>
        )}
        {jobs.map((job) => {
          const action = NEXT_STATUS[job.status];
          return (
            <div key={job.id} className="bg-white border border-border rounded-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-ink-3 tracking-wide">{job.serviceType}</span>
                <span className="text-[10px] font-bold bg-bg rounded-full px-2 py-1">{job.status}</span>
              </div>
              <div className="font-display font-bold text-sm mb-1">{job.customer.name}</div>
              <div className="text-ink-2 text-xs mb-3">
                {job.pickupAddress} → {job.dropoffAddress}
              </div>
              <div className="text-ink-2 text-xs mb-4">
                {formatPence(job.priceEstimateLow)} – {formatPence(job.priceEstimateHigh)}
              </div>
              {action && (
                <button
                  onClick={() => advance(job.id, action.next)}
                  className="w-full bg-yellow text-navy font-display font-bold text-sm rounded-xl py-3"
                >
                  {action.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
