import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { VehicleType } from "@prisma/client";

const applySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  vehicleType: z.nativeEnum(VehicleType),
  vehicleDesc: z.string().min(2),
  vehicleReg: z.string().min(2),
  coverageArea: z.string().min(2),
  password: z.string().min(8),
});

// POST /api/drivers — "Register interest" form. Creates a User(role=DRIVER)
// with a Driver profile in PENDING status; nothing happens with it until an
// admin approves it from the dashboard (Phase 2).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, phone, vehicleType, vehicleDesc, vehicleReg, coverageArea, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return NextResponse.json({ error: "That phone number is already registered" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      passwordHash,
      role: "DRIVER",
      driver: {
        create: { vehicleType, vehicleDesc, vehicleReg, coverageArea },
      },
    },
    include: { driver: true },
  });

  return NextResponse.json({ driver: user.driver }, { status: 201 });
}

// GET /api/drivers — admin: list applicants/drivers to review and approve.
export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const drivers = await prisma.driver.findMany({
    orderBy: { appliedAt: "desc" },
    include: { user: { select: { name: true, phone: true } } },
  });

  return NextResponse.json({ drivers });
}
