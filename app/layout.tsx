import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'skydevs',
  description: 'Created with v0',
  generator: 'skydevs',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
