// Free, keyless UK postcode geocoding via postcodes.io — no Mapbox/Google
// account needed just to price a job by distance. Live map tiles and
// turn-by-turn tracking (Phase 3) still use Mapbox; this is only for the
// straight-line distance that drives the price estimate.
//
// Note: this needs outbound network access at runtime, which Vercel has —
// it just isn't reachable from the sandbox this scaffold was built in, so
// it's untested end-to-end. Test it once deployed; the pricing falls back
// to a sensible default if a postcode won't geocode (see pricing.ts).

export type LatLng = { lat: number; lng: number };

export async function geocodePostcode(postcode: string): Promise<LatLng | null> {
  try {
    const clean = postcode.trim().replace(/\s+/g, "");
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
    if (!res.ok) return null;
    const body = await res.json();
    if (body?.status !== 200 || !body?.result) return null;
    return { lat: body.result.latitude, lng: body.result.longitude };
  } catch {
    return null;
  }
}

// Haversine distance in miles between two points.
export function distanceMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8; // Earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
