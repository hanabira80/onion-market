import { readFile } from "node:fs/promises"
import path from "node:path"

export async function GET() {
  const html = await readFile(path.join(process.cwd(), "src/content/welcome.html"), "utf8")

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
