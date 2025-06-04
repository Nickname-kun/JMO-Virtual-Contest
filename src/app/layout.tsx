import './globals.css'
import { Inter } from 'next/font/google'
import Providers from './providers'
import 'katex/dist/katex.min.css'
import ClientLayout from '@/components/ClientLayout'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'JMO Virtual Contest',
  description: '日本数学オリンピック予選の過去問を解いて、実力を試しましょう。',
  icons: {
    icon: [
      { url: '/diagram-20250604.svg', type: 'image/svg+xml' }
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive.core.css" />
      </head>
      <body className={inter.className}>
        <Providers>
          <ErrorBoundary>
            <ClientLayout>
              {children}
            </ClientLayout>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
