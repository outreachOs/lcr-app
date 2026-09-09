import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { JobStatus } from "@prisma/client";

// GET /api/jobs/:id — used by the customer tracking screen (poll) and the
// admin dashboard. Anyone signed in can read a job; tighten to
// "customer who owns it, its assigned driver, or an admin" before launch.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { name: true } },
      driver: { include: { user: { select: { name: true } } } },
      statusHistory: { orderBy: { at: "asc" } },
    },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // wholesaleQuote is AB's margin, never the customer's business — strip it
  // out for anyone who isn't admin, regardless of what the client asks for.
  const safeJob = role === "ADMIN" ? job : { ...job, wholesaleQuote: undefined };

  return NextResponse.json({ job: safeJob });
}

const patchSchema = z.object({
  driverId: z.string().optional(), // admin: assign a driver
  status: z.nativeEnum(JobStatus).optional(), // driver: move the job forward
  wholesaleQuote: z.number().int().optional(), // admin: what the driver quoted (reference only, never shown to the customer)
  priceFinal: z.number().int().optional(), // admin: what the customer is actually charged
});

// PATCH /api/jobs/:id — three callers:
//  - ADMIN sets driverId to assign a job (Phase 1's manual dispatch)
//  - ADMIN sets wholesaleQuote / priceFinal once the driver's quoted the job —
//    this is the in-app replacement for "ring the customer back"
//  - the assigned DRIVER advances status (EN_ROUTE → ARRIVED → RECOVERED → COMPLETED)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { driverId, status, wholesaleQuote, priceFinal } = parsed.data;

  if ((driverId || typeof priceFinal === "number" || typeof wholesaleQuote === "number") && role !== "ADMIN") {
    return NextResponse.json({ error: "Only admin can assign a driver or set the price" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (driverId) {
    data.driverId = driverId;
    data.status = "ASSIGNED" satisfies JobStatus;
    data.assignedAt = new Date();
  }
  if (status) {
    data.status = status;
    if (status === "COMPLETED") data.completedAt = new Date();
    if (status === "CANCELLED") data.cancelledAt = new Date();
  }
  if (typeof wholesaleQuote === "number") data.wholesaleQuote = wholesaleQuote;
  if (typeof priceFinal === "number") data.priceFinal = priceFinal;

  const job = await prisma.job.update({
    where: { id: params.id },
    data: {
      ...data,
      statusHistory: (data.status as string | undefined)
        ? { create: { status: data.status as JobStatus } }
        : undefined,
    },
  });

  return NextResponse.json({ job });
}
