import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

export const DATA_DIR = path.join(process.cwd(), "data")

let writeChain = Promise.resolve()

export function withLock<T>(work: () => Promise<T>): Promise<T> {
  const next = writeChain.then(work, work)
  writeChain = next.then(
    () => undefined,
    () => undefined
  )
  return next
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path.join(DATA_DIR, filename), "utf8")
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function writeJsonFile(filename: string, value: unknown) {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(
    path.join(DATA_DIR, filename),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8"
  )
}
