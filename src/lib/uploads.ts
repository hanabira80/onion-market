import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products")
const MAX_BYTES = 2 * 1024 * 1024

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export async function saveProductImage(file: File): Promise<string | { error: string }> {
  if (file.size === 0) {
    return { error: "사진 파일이 비어 있어요." }
  }

  if (file.size > MAX_BYTES) {
    return { error: "사진은 2MB 이하로 올려 주세요." }
  }

  const ext = TYPES[file.type]
  if (!ext) {
    return { error: "JPG, PNG, WEBP만 올릴 수 있어요." }
  }

  const filename = `${crypto.randomUUID()}.${ext}`
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()))
  return `/uploads/products/${filename}`
}
