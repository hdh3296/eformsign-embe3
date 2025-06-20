import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import config from '@/lib/config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: config.app.name,
  description: '디지털 계약서 발송 시스템',
  keywords: ['디지털', '계약서', 'eformsign', 'SMS', '전자서명'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}