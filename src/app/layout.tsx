import './globals.css'
import { Inter } from 'next/font/google'
import Providers from './providers'
import 'katex/dist/katex.min.css'
import ClientLayout from '@/components/ClientLayout'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  metadataBase: new URL('https://jmo-virtual-contest.vercel.app'),
  title: 'JMO Virtual Contest',
  description: '日本数学オリンピック予選の過去問を解いて、実力を試しましょう。',
  openGraph: {
    title: 'JMO Virtual Contest',
    description: '日本数学オリンピック予選の過去問を解いて、実力を試しましょう。',
    url: 'https://jmo-virtual-contest.vercel.app/',
    siteName: 'JMO Virtual Contest',
    images: [
      {
        url: '/ogp-image.png',
        width: 1200,
        height: 630,
        alt: 'JMO Virtual Contest OGP Image',
      },
    ],
    type: 'website',
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
        <link rel="icon" type="image/x-icon" href="/my-favicon.ico" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#5633c2" />
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
