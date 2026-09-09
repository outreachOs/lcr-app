import { ServiceType } from "@prisma/client";

// Pricing, from AB directly (2026-09-09):
//   - Customer's up-front ESTIMATE should scale with distance: roughly £120
//     for local jobs, £160–£200 out to nearby cities. He didn't give a
//     figure for longer runs — the FAR tier below is my extrapolation,
//     flagged so it's easy to spot and correct.
//   - The FINAL price isn't a formula — AB gets a wholesale quote from the
//     driver by phone, then adds his own margin on top: +£20–30 on a
//     standard job, +£40–60 on a bigger one (his example: LWB jobs profit
//     £40–60). He decides the exact number each time, so the app suggests
//     the midpoint and lets him overwrite it rather than enforcing a rule.
//
// Every number here is one place to tune — nothing else in the app encodes
// pricing logic.

export type DistanceTier = "LOCAL" | "NEARBY" | "FAR";

export function distanceTier(miles: number | null): DistanceTier {
  if (miles == null) return "LOCAL"; // geocoding failed or wasn't run — safest default, admin can correct the final price anyway
  if (miles <= 12) return "LOCAL";
  if (miles <= 40) return "NEARBY";
  return "FAR";
}

// "Bigger" jobs — the ones AB said carry a bigger margin (LWB / specialist
// recovery) — get a wider, higher band. Same distance tiers apply; the gap
// between STANDARD and BIGGER here mirrors his +£20-30 vs +£40-60 split.
const STANDARD_SERVICES: ServiceType[] = ["CAR", "VAN"];

const ESTIMATE_BANDS: Record<DistanceTier, { standard: [number, number]; bigger: [number, number] }> = {
  // pence: [low, high]
  LOCAL: { standard: [11000, 13000], bigger: [15000, 18000] },
  NEARBY: { standard: [16000, 20000], bigger: [20000, 25000] },
  // FAR has no figure from AB yet — extrapolated from the LOCAL→NEARBY step. Confirm before this sees real customers.
  FAR: { standard: [22000, 28000], bigger: [28000, 34000] },
};

export function estimatePrice(serviceType: ServiceType, miles: number | null) {
  const tier = distanceTier(miles);
  const bigger = !STANDARD_SERVICES.includes(serviceType);
  const [low, high] = ESTIMATE_BANDS[tier][bigger ? "bigger" : "standard"];
  return { low, high, tier };
}

// Default markup suggested when AB enters the driver's wholesale quote —
// the midpoint of what he told me, editable before confirming.
export function suggestedMarkup(serviceType: ServiceType): number {
  const bigger = !STANDARD_SERVICES.includes(serviceType);
  return bigger ? 5000 : 2500; // pence — £50 vs £25 midpoint
}

export function suggestFinalPrice(wholesalePence: number, serviceType: ServiceType): number {
  return wholesalePence + suggestedMarkup(serviceType);
}

export function formatPence(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}
