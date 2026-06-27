import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const phone = String(body.phone ?? "").trim();
    const location = String(body.location ?? "").trim();
    const bio = String(body.bio ?? "").trim();

    if (!fullName || !email || !password || !phone || !location) {
      return NextResponse.json({ error: "Name, email, password, phone, and location are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json({ error: "An account already exists for this email" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash: hashPassword(password),
        role: "VOLUNTEER",
        volunteer: {
          create: {
            fullName,
            email,
            phone,
            location,
            bio: bio || null,
          },
        },
      },
      include: { volunteer: true },
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          volunteerId: user.volunteer?.id ?? null,
        },
      },
      { status: 201 },
    );

    setSessionCookie(response, user.id);

    return response;
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json({ error: "Failed to create volunteer account" }, { status: 500 });
  }
}