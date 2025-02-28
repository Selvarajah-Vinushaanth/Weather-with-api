import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Weather World',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/R.ico" />
        {/* Add other head elements here */}
      </head>
      <body>{children}</body>
    </html>
  )
}
