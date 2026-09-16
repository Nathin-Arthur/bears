import { logoImage } from "@/lib/logo-image"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// iOS fills transparent icon backgrounds with black, so draw the logo on
// Bears navy instead.
export default function AppleIcon() {
  return logoImage({ ...size, logoWidth: 140 })
}
