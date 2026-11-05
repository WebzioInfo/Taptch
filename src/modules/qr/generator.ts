import QRCode from 'qrcode';
import { QRDesignConfig } from './types';

/**
 * Parses hex color (e.g. '#FFFFFF' or '#121212') into RGB components [0-255].
 */
export function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace('#', '').trim();
  if (sanitized.length === 3) {
    const r = parseInt(sanitized[0] + sanitized[0], 16);
    const g = parseInt(sanitized[1] + sanitized[1], 16);
    const b = parseInt(sanitized[2] + sanitized[2], 16);
    return [r, g, b];
  }
  const r = parseInt(sanitized.slice(0, 2), 16) || 0;
  const g = parseInt(sanitized.slice(2, 4), 16) || 0;
  const b = parseInt(sanitized.slice(4, 6), 16) || 0;
  return [r, g, b];
}

/**
 * Calculates relative luminance according to WCAG 2.1 specifications.
 */
export function calculateRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors.
 * Contrast ratio is between 1:1 (lowest) and 21:1 (highest).
 */
export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  const fgLuminance = calculateRelativeLuminance(hexToRgb(fgHex));
  const bgLuminance = calculateRelativeLuminance(hexToRgb(bgHex));
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Validates whether the design has sufficient contrast for high-speed camera decodability (>= 4.5:1).
 */
export function isDesignScannable(fgHex: string, bgHex: string): { isScannable: boolean; contrast: number } {
  const contrast = calculateContrastRatio(fgHex, bgHex);
  return {
    isScannable: contrast >= 4.5,
    contrast,
  };
}

/**
 * Generates an SVG string representation of a dynamic QR code.
 */
export async function generateQRSvg(
  content: string,
  config?: Partial<QRDesignConfig>
): Promise<string> {
  const fg = config?.fgColor || '#000000';
  const bg = config?.bgColor || '#FFFFFF';
  
  // Enforce high error correction whenever a center logo or custom styling is specified
  const errorCorrectionLevel = config?.centerLogoUrl ? 'H' : config?.errorCorrectionLevel || 'M';

  const svgString = await QRCode.toString(content, {
    type: 'svg',
    errorCorrectionLevel,
    margin: 4, // Strict quiet zone preservation
    color: {
      dark: fg,
      light: bg,
    },
  });

  return svgString;
}

/**
 * Generates a PNG DataURL representation of a dynamic QR code for canvas rendering or raster export.
 */
export async function generateQRPngDataUrl(
  content: string,
  config?: Partial<QRDesignConfig>,
  width: number = 512
): Promise<string> {
  const fg = config?.fgColor || '#000000';
  const bg = config?.bgColor || '#FFFFFF';
  const errorCorrectionLevel = config?.centerLogoUrl ? 'H' : config?.errorCorrectionLevel || 'M';

  const dataUrl = await QRCode.toDataURL(content, {
    width,
    errorCorrectionLevel,
    margin: 4,
    color: {
      dark: fg,
      light: bg,
    },
  });

  return dataUrl;
}

