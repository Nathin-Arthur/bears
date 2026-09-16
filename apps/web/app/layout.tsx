import { Geist_Mono, Jersey_25, Roboto, Outfit } from "next/font/google"
import Script from "next/script"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"

const GA_MEASUREMENT_ID = "G-QH1NMMRNB7"

const outfitHeading = Outfit({ subsets: ["latin"], variable: "--font-heading" })

const jerseyNumbers = Jersey_25({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-numbers",
})

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        roboto.variable,
        outfitHeading.variable,
        jerseyNumbers.variable
      )}
    >
      <body>
        <ThemeProvider forcedTheme="dark">{children}</ThemeProvider>

        {/* Google tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  )
}
