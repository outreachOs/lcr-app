import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DriverStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.nativeEnum(DriverStatus),
});

// PATCH /api/drivers/:id — admin approves, rejects, or suspends a driver.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const driver = await prisma.driver.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      approvedAt: parsed.data.status === "APPROVED" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ driver });
}
