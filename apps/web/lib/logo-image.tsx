import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

// The logo file is 372.5 × 247.8.
const LOGO_ASPECT = 247.83927 / 372.53104

// Renders the Bears logo centered on Bears navy, for icons and share images.
export async function logoImage({
  width,
  height,
  logoWidth,
}: {
  width: number
  height: number
  logoWidth: number
}) {
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
      {/* ImageResponse renders plain <img>; next/image doesn't work here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        width={logoWidth}
        height={Math.round(logoWidth * LOGO_ASPECT)}
        alt=""
      />
    </div>,
    { width, height }
  )
}
