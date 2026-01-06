// Type definitions for import.meta in Jest environment
declare global {
  interface ImportMeta {
    env: {
      DEV: boolean;
      PROD: boolean;

      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      [key: string]: any;
    };
  }
}

export {};
