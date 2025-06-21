import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import config from '@/lib/config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: config.app.name,
  description: '간편하고 안전한 디지털 계약서 자동 발송 서비스. eformsign API 연동으로 실시간 SMS 계약서 전송이 가능합니다.',
  keywords: ['디지털', '계약서', 'eformsign', 'SMS', '전자서명', '계약서발송', '자동화'],
  authors: [{ name: 'eformsign Integration Team' }],
  openGraph: {
    title: 'eformsign 디지털 계약서 발송 시스템',
    description: '간편하고 안전한 디지털 계약서 자동 발송 서비스 - 회원가입_신청서 실시간 발송',
    type: 'website',
    locale: 'ko_KR',
    siteName: config.app.name,
    images: [
      {
        url: '/og-image.png',
        width: 1024,
        height: 1024,
        alt: 'eformsign 디지털 계약서 발송 시스템 - Digital Contract System',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eformsign 디지털 계약서 발송 시스템',
    description: '간편하고 안전한 디지털 계약서 자동 발송 서비스',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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