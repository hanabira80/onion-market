import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export const SESSION_COOKIE = "onion_session"
export const SETUP_COOKIE = "onion_setup"

export type StudentRole = "student" | "admin"

export type SessionPayload = {
  studentId: string
  name: string
  role: StudentRole
}

export type SetupPurpose = "setup" | "login" | "reset"

export type SetupPayload = {
  studentId: string
  purpose: SetupPurpose
}

const SESSION_MAX_AGE = 60 * 60 * 24 * 7
const SETUP_MAX_AGE = 60 * 10

function getSecret() {
  const secret = process.env.SESSION_SECRET

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.")
  }

  return new TextEncoder().encode(secret)
}

async function signToken(payload: Record<string, string>, maxAge: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(getSecret())
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await signToken(payload, SESSION_MAX_AGE)
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, cookieOptions(SESSION_MAX_AGE))
}

export async function clearSession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, getSecret())
    const studentId = String(payload.studentId ?? "")
    const name = String(payload.name ?? "")
    const role = payload.role === "admin" ? "admin" : "student"

    if (!studentId || !name) {
      return null
    }

    return { studentId, name, role }
  } catch {
    return null
  }
}

export async function createSetup(payload: SetupPayload) {
  const token = await signToken(payload, SETUP_MAX_AGE)
  const jar = await cookies()
  jar.set(SETUP_COOKIE, token, cookieOptions(SETUP_MAX_AGE))
}

export async function clearSetup() {
  const jar = await cookies()
  jar.delete(SETUP_COOKIE)
}

export async function readSetup(): Promise<SetupPayload | null> {
  const jar = await cookies()
  const token = jar.get(SETUP_COOKIE)?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, getSecret())
    const studentId = String(payload.studentId ?? "")
    const purpose = payload.purpose

    if (
      !studentId ||
      (purpose !== "setup" && purpose !== "login" && purpose !== "reset")
    ) {
      return null
    }

    return { studentId, purpose }
  } catch {
    return null
  }
}

export async function readSessionFromToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, getSecret())
    const studentId = String(payload.studentId ?? "")
    const name = String(payload.name ?? "")
    const role = payload.role === "admin" ? "admin" : "student"

    if (!studentId || !name) {
      return null
    }

    return { studentId, name, role }
  } catch {
    return null
  }
}
