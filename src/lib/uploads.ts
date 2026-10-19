import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase"

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products")
const BUCKET = "product-images"
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

  if (!isSupabaseConfigured()) {
    const filename = `${crypto.randomUUID()}.${ext}`
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(LOCAL_UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()))
    return `/uploads/products/${filename}`
  }

  const storagePath = `products/${crypto.randomUUID()}.${ext}`
  const supabase = createServiceClient()
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    return { error: "사진을 올리지 못했어요." }
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}
