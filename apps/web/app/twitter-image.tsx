import { logoImage } from "@/lib/logo-image"

export const alt = "Chicago Bears logo"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Same preview as opengraph-image, for X/Twitter.
export default function TwitterImage() {
  return logoImage({ ...size, logoWidth: 520 })
}
