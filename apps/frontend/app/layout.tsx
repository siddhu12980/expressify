import "./globals.css"
import { AppProviders } from "@/components/app-providers"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
