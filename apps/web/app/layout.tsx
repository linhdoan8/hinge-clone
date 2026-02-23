import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Hinge Clone - Designed to be Deleted',
  description:
    'A dating app designed to be deleted. Find meaningful connections, not endless swiping.',
  keywords: ['dating', 'relationships', 'hinge', 'connections', 'love'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1A1A2E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-hinge-dark text-white min-h-screen">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1E2A4A',
              color: '#FFFFFF',
              border: '1px solid rgba(108, 71, 255, 0.2)',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#6C47FF',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
