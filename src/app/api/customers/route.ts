import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7),
  password: z.string().min(8),
});

// POST /api/customers — quick account creation on the request screen.
// A production build would use OTP-over-SMS instead of a password for
// customers (faster, no "forgot password" flow) — noted in the README.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return NextResponse.json({ error: "That phone number is already registered — sign in instead." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, phone, passwordHash, role: "CUSTOMER" },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
