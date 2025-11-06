
import './globals.css' 
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import NextAuthSessionProvider from '@/components/NextAuthSessionProvider'
import { ThemeProvider } from "../providers/ThemeProvider";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chat Box',
  description: 'Realtime chat built with Next.js and Socket.IO',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-white dark:bg-gray-900 transition-colors duration-300">
       <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <NextAuthSessionProvider>
            <main>{children}</main>
        </NextAuthSessionProvider>
        </ThemeProvider>
      </body>
    
    </html>
  )
}