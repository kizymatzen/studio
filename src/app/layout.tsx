import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Using GeistSans as primary as per existing, Geist_Mono can be removed if not used explicitly.
import './globals.css';
import { ClientProviders } from '@/components/core/client-providers';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Little Steps',
  description: 'Parenting support app for children aged 2 to 5.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <ClientProviders>
          {children}
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
