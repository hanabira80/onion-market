import { readJsonFile, withLock, writeJsonFile } from "@/lib/json-store"

export type WishlistItem = {
  studentId: string
  productId: string
  createdAt: string
}

const FILE = "wishlist.json"

async function readAll(): Promise<WishlistItem[]> {
  const parsed = await readJsonFile<WishlistItem[]>(FILE, [])
  return Array.isArray(parsed) ? parsed : []
}

export async function listWishlistByStudent(studentId: string) {
  const items = await readAll()
  return items
    .filter((item) => item.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function listWishedProductIds(studentId: string) {
  const items = await listWishlistByStudent(studentId)
  return new Set(items.map((item) => item.productId))
}

export async function toggleWishlist(studentId: string, productId: string) {
  return withLock(async () => {
    const items = await readAll()
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
