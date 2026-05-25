import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AppProviders } from '@/providers/app-providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: { default: 'School Van Admin', template: '%s | School Van' },
  description: 'Enterprise school transportation management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
