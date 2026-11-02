import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'hi', 'ml'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async () => {
  // Static / default locale for now (can read headers or cookies where appropriate,
  // but public profile hot paths don't use dynamic headers per Rule 13)
  const locale: Locale = 'en';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

