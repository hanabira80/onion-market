import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"
import { createServiceClient, isSupabaseConfigured, throwIfError } from "@/lib/supabase"

export type WishlistItem = {
  studentId: string
  productId: string
  createdAt: string
}

type WishlistRow = {
  student_id: string
  product_id: string
  created_at: string
}

const FILE = "wishlist.json"

function mapItem(row: WishlistRow): WishlistItem {
  return {
    studentId: row.student_id,
    productId: row.product_id,
    createdAt: row.created_at,
  }
}

async function readAllLocal(): Promise<WishlistItem[]> {
  const parsed = await readJsonFile<WishlistItem[]>(FILE, [])
  return Array.isArray(parsed) ? parsed : []
}

export async function listWishlistByStudent(studentId: string) {
  if (!isSupabaseConfigured()) {
    const items = await readAllLocal()
    return items
      .filter((item) => item.studentId === studentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
  throwIfError(error)
  return ((data ?? []) as WishlistRow[]).map(mapItem)
}

export async function listWishedProductIds(studentId: string) {
  const items = await listWishlistByStudent(studentId)
  return new Set(items.map((item) => item.productId))
}

export async function toggleWishlist(studentId: string, productId: string) {
  if (!isSupabaseConfigured()) {
    return withLock(async () => {
      const items = await readAllLocal()
      const index = items.findIndex(
        (item) => item.studentId === studentId && item.productId === productId
      )

      if (index >= 0) {
        items.splice(index, 1)
        await writeJsonFile(FILE, items)
        return { wished: false }
      }

      items.push({
        studentId,
        productId,
        createdAt: new Date().toISOString(),
      })
      await writeJsonFile(FILE, items)
      return { wished: true }
    })
  }

  const supabase = createServiceClient()
  const { data: existing, error: readError } = await supabase
    .from("wishlist")
    .select("student_id")
    .eq("student_id", studentId)
    .eq("product_id", productId)
    .maybeSingle()
  throwIfError(readError)

  if (existing) {
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("student_id", studentId)
      .eq("product_id", productId)
    throwIfError(error)
    return { wished: false }
  }

  const { error } = await supabase.from("wishlist").insert({
    student_id: studentId,
    product_id: productId,
  })
  throwIfError(error)
  return { wished: true }
}
