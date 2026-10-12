import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export const SESSION_COOKIE = "onion_session"
export const SETUP_COOKIE = "onion_setup"

export type StudentRole = "student" | "admin"
export type AdminLevel = "master" | "sub"

export type StudentSession = {
  kind: "student"
  studentId: string
  name: string
  role: StudentRole
}

export type TeacherSession = {
  kind: "teacher"
  email: string
  name: string
  role: "admin"
  adminLevel: AdminLevel
}

export type SessionPayload = StudentSession | TeacherSession

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
  const claims: Record<string, string> =
    payload.kind === "teacher"
      ? {
          kind: "teacher",
          email: payload.email,
          name: payload.name,
          role: "admin",
          adminLevel: payload.adminLevel,
        }
      : {
          kind: "student",
          studentId: payload.studentId,
          name: payload.name,
          role: payload.role,
        }
  const token = await signToken(claims, SESSION_MAX_AGE)
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
    return parseSessionPayload(payload)
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
    return parseSessionPayload(payload)
  } catch {
    return null
  }
}

function parseSessionPayload(payload: Record<string, unknown>): SessionPayload | null {
  const name = String(payload.name ?? "")

  if (payload.kind === "teacher") {
    const email = String(payload.email ?? "")
      .trim()
      .toLowerCase()
    const adminLevel = payload.adminLevel === "master" ? "master" : "sub"

    if (!email) {
      return null
    }

    return {
      kind: "teacher",
      email,
      name: name || email,
      role: "admin",
      adminLevel,
    }
  }

  const studentId = String(payload.studentId ?? "")
  const role = payload.role === "admin" ? "admin" : "student"

  if (!studentId || !name) {
    return null
  }

  return { kind: "student", studentId, name, role }
}
