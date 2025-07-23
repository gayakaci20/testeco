import './globals.css'
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
import ClientLayout from '@/components/ClientLayout'

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
})
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EcoDeli Admin Dashboard',
  description: 'Admin dashboard for EcoDeli',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AuthProvider>
          <ClientLayout>
                {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
