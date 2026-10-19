const MAX_EDGE = 1280
const TARGET_BYTES = 450 * 1024
const INPUT_MAX_BYTES = 12 * 1024 * 1024
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.5, 0.4]
const EDGE_STEPS = [1280, 960, 720]

export class ImageTooLargeError extends Error {
  constructor() {
    super("image-too-large")
    this.name = "ImageTooLargeError"
  }
}

function replaceExtension(filename: string, ext: string) {
  return filename.replace(/\.[^.]+$/, "") + `.${ext}`
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

async function pickOutputType(): Promise<"image/webp" | "image/jpeg"> {
  const probe = document.createElement("canvas")
  probe.width = 2
  probe.height = 2
  const webp = await canvasToBlob(probe, "image/webp", 0.8)
  return webp?.type === "image/webp" ? "image/webp" : "image/jpeg"
}

function drawToCanvas(
  bitmap: ImageBitmap,
  edge: number
): HTMLCanvasElement | null {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return null
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

export async function compressProductImage(file: File): Promise<File> {
  if (file.size > INPUT_MAX_BYTES) {
    throw new ImageTooLargeError()
  }

  if (!file.type.startsWith("image/")) {
    return file
  }

  const bitmap = await createImageBitmap(file)
  try {
    const outputType = await pickOutputType()
    const ext = outputType === "image/webp" ? "webp" : "jpg"
    let best: Blob | null = null

    for (const edge of EDGE_STEPS) {
      const canvas = drawToCanvas(bitmap, edge)
      if (!canvas) {
        return file
      }

      for (const quality of QUALITY_STEPS) {
        const blob = await canvasToBlob(canvas, outputType, quality)
        if (!blob) {
          continue
        }
        best = blob
        if (blob.size <= TARGET_BYTES) {
          return new File([blob], replaceExtension(file.name, ext), {
            type: outputType,
            lastModified: Date.now(),
          })
        }
      }
    }

    if (best && best.size < file.size) {
      return new File([best], replaceExtension(file.name, ext), {
        type: outputType,
        lastModified: Date.now(),
      })
    }

    return file
  } finally {
    bitmap.close()
  }
}
