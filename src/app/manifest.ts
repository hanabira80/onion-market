import type { MetadataRoute } from "next"

const themeColor = "#FEF9F1"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "양파마켓",
    short_name: "양파마켓",
    description:
      "관심 떨어진 굿즈를 기부하면 포인트를 받고, 학급 몰에서 포인트로 교환하는 교내 마켓.",
    start_url: "/",
    display: "standalone",
    background_color: themeColor,
    theme_color: themeColor,
    lang: "ko",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
