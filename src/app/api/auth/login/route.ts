import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureDefaultAdmin, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = body.role === "ADMIN" ? "ADMIN" : "VOLUNTEER";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (role === "ADMIN") {
      await ensureDefaultAdmin();
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { volunteer: true },
    });

    if (!user || user.role !== role || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid login details" }, { status: 401 });
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        volunteerId: user.volunteer?.id ?? null,
      },
    });

    setSessionCookie(response, user.id);

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}