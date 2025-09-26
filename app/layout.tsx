import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import './globals.css';
import '@/lib/polyfills'; // Import polyfills for Edge Runtime compatibility
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Prompt Hub',
  description: 'The premier platform for AI prompts and agents',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#1A1A1A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex min-h-screen flex-col bg-bg`}>
        <AuthModalProvider>
          <Navigation />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AuthModalProvider>
      </body>
    </html>
  );
}
