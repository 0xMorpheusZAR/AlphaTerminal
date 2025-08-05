import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import { TickerBar } from '@/components/ticker-bar';
import { NavigationTabs } from '@/components/navigation-tabs';
import { cn } from '@/lib/utils';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'AlphaTerminal | Professional Crypto Analytics',
  description: 'Bloomberg-style cryptocurrency market dashboard with real-time data',
  keywords: ['crypto', 'bitcoin', 'ethereum', 'trading', 'bloomberg', 'terminal'],
  authors: [{ name: 'AlphaTerminal Team' }],
  creator: 'AlphaTerminal',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://alphaterminal.com',
    title: 'AlphaTerminal | Professional Crypto Analytics',
    description: 'Bloomberg-style cryptocurrency market dashboard',
    siteName: 'AlphaTerminal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlphaTerminal',
    description: 'Professional crypto analytics dashboard',
    creator: '@alphaterminal',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body 
        className={cn(
          'min-h-screen bg-bloomberg-black font-mono antialiased',
          jetbrainsMono.variable
        )}
      >
        <Providers>
          {/* Fixed Bloomberg-style ticker bar - 60px height */}
          <div className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-bloomberg-darker border-b border-bloomberg-border">
            <TickerBar />
          </div>
          
          {/* Navigation tabs below ticker */}
          <div className="fixed top-[60px] left-0 right-0 z-40 h-[48px] bg-bloomberg-dark border-b border-bloomberg-border">
            <NavigationTabs />
          </div>
          
          {/* Main content area with padding for fixed headers */}
          <main className="pt-[108px] min-h-screen bg-bloomberg-black">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}