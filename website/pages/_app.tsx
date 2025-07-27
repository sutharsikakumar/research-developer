import type { AppProps } from 'next/app';
import { Outfit } from 'next/font/google';
import '@/app/globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={outfit.variable} style={{ fontFamily: 'var(--font-outfit), -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <Component {...pageProps} />
    </div>
  );
}