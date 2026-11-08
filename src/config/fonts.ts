import { Geist, Geist_Mono } from 'next/font/google';

/**
 * TAPTCH Premium Typography System
 * Primary font: Geist Sans (variable font, geometric & humanist balance)
 * Monospace font: Geist Mono (technical, tabular, cryptographic & serial numbers)
 */

export const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  adjustFontFallback: true,
});

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
  adjustFontFallback: true,
});

