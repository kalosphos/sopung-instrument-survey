import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "sopung_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  return process.env.SESSION_SECRET || "local-dev-session-secret-change-me";
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(session) {
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readSessionToken(token) {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || sign(body) !== signature) return null;

  try {
    const session = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!session.expiresAt || Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const jar = await cookies();
  return readSessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function setAdminSession(session) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, createSessionToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session?.kakaoId) {
    return null;
  }
  return session;
}
