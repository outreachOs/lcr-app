import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { estimatePrice } from "@/lib/pricing";
import { geocodePostcode, distanceMiles } from "@/lib/geo";
import { ServiceType } from "@prisma/client";

const createJobSchema = z.object({
  serviceType: z.nativeEnum(ServiceType),
  pickupAddress: z.string().min(3),
  pickupPostcode: z.string().min(5),
  dropoffAddress: z.string().min(3),
  dropoffPostcode: z.string().min(5),
  notes: z.string().optional(),
});

// POST /api/jobs — customer submits a recovery request.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { serviceType, pickupAddress, pickupPostcode, dropoffAddress, dropoffPostcode, notes } = parsed.data;

  // Geocode both postcodes to get a real distance for the estimate. If
  // either fails (bad postcode, network issue) we fall back to the LOCAL
  // band rather than blocking the request — a job with no price band is
  // worse than one with a slightly-off estimate the admin can correct.
  const [pickupGeo, dropoffGeo] = await Promise.all([
    geocodePostcode(pickupPostcode),
    geocodePostcode(dropoffPostcode),
  ]);
  const miles = pickupGeo && dropoffGeo ? distanceMiles(pickupGeo, dropoffGeo) : null;
  const { low, high } = estimatePrice(serviceType, miles);

  const job = await prisma.job.create({
    data: {
      customerId: session.user.id as string,
      serviceType,
      pickupAddress,
      pickupPostcode,
      pickupLat: pickupGeo?.lat,
      pickupLng: pickupGeo?.lng,
      dropoffAddress,
      dropoffPostcode,
      dropoffLat: dropoffGeo?.lat,
      dropoffLng: dropoffGeo?.lng,
      distanceMiles: miles ?? undefined,
      notes,
      priceEstimateLow: low,
      priceEstimateHigh: high,
      statusHistory: { create: { status: "REQUESTED" } },
    },
  });

  return NextResponse.json({ job }, { status: 201 });
}

// GET /api/jobs
//  - ADMIN sees the full dispatch queue
//  - DRIVER sees only jobs assigned to them
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (role === "ADMIN") {
    const jobs = await prisma.job.findMany({
      orderBy: { requestedAt: "desc" },
      include: { customer: true, driver: { include: { user: true } } },
      take: 50,
    });
    return NextResponse.json({ jobs });
  }

  if (role === "DRIVER") {
    const driver = await prisma.driver.findUnique({ where: { userId: session.user.id as string } });
    if (!driver) return NextResponse.json({ jobs: [] });

    const jobs = await prisma.job.findMany({
      where: { driverId: driver.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      orderBy: { requestedAt: "desc" },
      include: { customer: true, driver: { include: { user: true } } },
    });
    return NextResponse.json({ jobs });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
