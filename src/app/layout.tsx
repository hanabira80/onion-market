import type { Metadata, Viewport } from "next"
import { Noto_Sans_KR } from "next/font/google"

import "./globals.css"

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const siteName = "양파마켓"
const description =
  "관심 떨어진 굿즈를 기부하면 포인트를 받고, 학급 몰에서 포인트로 교환하는 교내 마켓."

export const dynamic = "force-dynamic"

const themeColor = "#FEF9F1"

export const viewport: Viewport = {
  themeColor,
}

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description,
  applicationName: siteName,
  icons: {
    icon: [{ url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: siteName,
    description,
    locale: "ko_KR",
    type: "website",
    siteName,
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
