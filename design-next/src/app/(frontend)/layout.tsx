import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'Hayat AI — Care you can understand',
  description: 'A multilingual healthcare accessibility platform prototype.',
  icons: { icon: '/hayat-logo-192.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="min-h-screen antialiased"><div id="root">{children}</div></body></html>
}
