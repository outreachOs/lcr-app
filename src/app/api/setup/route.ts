import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SETUP_SECRET isn't set in this deployment's environment variables." }, { status: 500 });
  }

  const params = req.nextUrl.searchParams;
  if (params.get("secret") !== secret) {
    return NextResponse.json({ error: "Wrong or missing secret." }, { status: 401 });
  }

  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    return NextResponse.json({ message: "An admin already exists — this route only sets up the first one. Sign in at /login." });
  }

  const name = params.get("name");
  const phone = params.get("phone");
  const password = params.get("password");
  if (!name || !phone || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Add ?name=...&phone=...&password=... to the URL — password needs at least 8 characters." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, phone, passwordHash, role: "ADMIN" } });

  return NextResponse.json({ message: `Admin account created for ${name}. Sign in at /login with the phone and password you just set.` });
}