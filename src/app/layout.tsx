import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'BusStop Alert - Smart Transit Stop Alarm',
  description: 'Never miss your bus stop again. Real-time GPS passenger tracking and destination alarms.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BusAlert',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FCF9F1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} min-h-screen bg-cream text-main flex flex-col antialiased selection:bg-gold-light selection:text-main`}>
        <Header />
        <main className="flex-1 w-full max-w-lg mx-auto px-4 py-3 pb-24">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
