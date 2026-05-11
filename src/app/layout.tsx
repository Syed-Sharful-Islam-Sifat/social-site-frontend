import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Buddy Script',
  description: 'Social networking platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
