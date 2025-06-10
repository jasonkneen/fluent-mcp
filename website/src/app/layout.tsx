import type { Metadata } from 'next'
import { Orbitron, Tektur } from 'next/font/google'
import './globals.css'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
})

const tektur = Tektur({
  subsets: ['latin'],
  variable: '--font-tektur',
})

export const metadata: Metadata = {
  title: 'MCP Servlets - Orchestrate AI Workflows',
  description: 'Platform-agnostic MCP server framework for workflow orchestration across any AI system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${orbitron.variable} ${tektur.variable} font-tektur`}>
        {children}
      </body>
    </html>
  )
}