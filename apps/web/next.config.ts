import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "a.espncdn.com" }],
  },
}

export default nextConfig
