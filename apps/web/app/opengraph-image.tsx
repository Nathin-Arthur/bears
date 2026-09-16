import { logoImage } from "@/lib/logo-image"

export const alt = "Chicago Bears logo"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Preview image shown when the link is shared.
export default function OpenGraphImage() {
  return logoImage({ ...size, logoWidth: 520 })
}
