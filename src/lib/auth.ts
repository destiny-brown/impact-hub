import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { User, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";

const SESSION_COOKIE = "impact_hub_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const PASSWORD_ITERATIONS = 100_000;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_DIGEST = "sha512";

export type AuthUser = Pick<User, "id" | "email" | "fullName" | "role"> & {
  volunteerId: string | null;
};

function getSessionSecret() {
  return process.env.AUTH_SECRET ?? "impact-hub-development-secret";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function timingSafeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString("hex");

  return `${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  const [iterations, salt, storedHash] = storedPassword.split(":");

  if (!iterations || !salt || !storedHash) {
    return false;
  }

  const hash = crypto
    .pbkdf2Sync(password, salt, Number(iterations), PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString("hex");

  return timingSafeEqual(hash, storedHash);
}

export function createSessionCookie(userId: string) {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${userId}.${expiresAt}`;

  return `${payload}.${sign(payload)}`;
}

export function setSessionCookie(response: NextResponse, userId: string) {
  response.cookies.set(SESSION_COOKIE, createSessionCookie(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

async function getSessionUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;

  if (!session) {
    return null;
  }

  const [userId, expiresAt, signature] = session.split(".");
  const payload = `${userId}.${expiresAt}`;

  if (!userId || !expiresAt || !signature || !timingSafeEqual(signature, sign(payload))) {
    return null;
  }

  if (Number(expiresAt) < Date.now()) {
    return null;
  }

  return userId;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { volunteer: true },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    volunteerId: user.volunteer?.id ?? null,
  };
}

export async function requireUser(role?: UserRole) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(role === "ADMIN" ? "/admin/login" : "/volunteer/login");
  }

  if (role && user.role !== role) {
    redirect(user.role === "ADMIN" ? "/dashboard" : "/events");
  }

  return user;
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "You do not have access to this resource" }, { status: 403 });
}

export async function getAuthorizedUser(role?: UserRole) {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  if (role && user.role !== role) {
    return null;
  }

  return user;
}

export async function ensureDefaultAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@impacthub.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminName = process.env.ADMIN_NAME ?? "Charity Admin";
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (existingAdmin) {
    return existingAdmin;
  }

  return prisma.user.create({
    data: {
      email: adminEmail.toLowerCase(),
      fullName: adminName,
      passwordHash: hashPassword(adminPassword),
      role: "ADMIN",
    },
  });
}