import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// iOS fills transparent icon backgrounds with black, so draw the logo on
// Bears navy instead.
export default async function AppleIcon() {
  const svg = await readFile(join(process.cwd(), "public/bears-logo.svg"))
  const logo = `data:image/svg+xml;base64,${svg.toString("base64")}`

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b162a",
      }}
    >
      <img src={logo} width={140} height={93} alt="" />
    </div>,
    size
  )
}
