import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scryptAsync = promisify(scrypt)

const MIN_LENGTH = 8

export function validateNewPassword(
  password: string,
  confirm: string
): string | null {
  if (password.length < MIN_LENGTH) {
    return `비밀번호는 ${MIN_LENGTH}자 이상이어야 해요.`
  }

  if (password !== confirm) {
    return "비밀번호 확인이 같지 않아요."
  }

  return null
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return `${salt.toString("hex")}:${derived.toString("hex")}`
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":")
  if (!saltHex || !hashHex) {
    return false
  }

  const salt = Buffer.from(saltHex, "hex")
  const expected = Buffer.from(hashHex, "hex")
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer

  if (derived.length !== expected.length) {
    return false
  }

  return timingSafeEqual(derived, expected)
}
