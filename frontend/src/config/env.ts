/// <reference types="vite/client" />

export const env = {
  appName: (import.meta.env.VITE_APP_NAME as string) || 'Taptch',
  appEnv: (import.meta.env.VITE_APP_ENV as string) || 'development',
  apiUrl: (import.meta.env.VITE_API_URL as string) || '/api',
  appUrl: (import.meta.env.VITE_APP_URL as string) || 'http://localhost:5173',
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string) || '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
  isProduction: (import.meta.env.VITE_APP_ENV as string) === 'production',
};
