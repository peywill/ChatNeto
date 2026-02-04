import { createClient } from '@supabase/supabase-js';

// Safe environment variable access helper
const getEnv = (key: string, defaultValue: string) => {
  try {
    // Check if import.meta.env exists to prevent "Cannot read properties of undefined" errors
    // @ts-ignore - import.meta might not be typed in all contexts
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || defaultValue;
    }
  } catch (e) {
    // Ignore errors in environments where import.meta is not supported
  }
  return defaultValue;
};

// Use environment variables if available, otherwise fall back to hardcoded values
const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://eepaswqrmehdcccfqjpm.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_aEz4eudRlGBb6U0GLwvHFg_AzGevdd8');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Also suppress window error events for AbortErrors
if (typeof window !== 'undefined') {
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorString = String(message) + ' ' + (error?.message || '');
    if (errorString.toLowerCase().includes('abort') || errorString.toLowerCase().includes('signal')) {
      return true; // Prevent default error handling
    }
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Also handle unhandled promise rejections
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const errorString = String(event.reason?.message || event.reason || '').toLowerCase();
    if (errorString.includes('abort') || errorString.includes('signal')) {
      event.preventDefault(); // Prevent default error handling
      return;
    }
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.call(window, event);
    }
  };
}

// Create Supabase client with optimized settings to reduce AbortErrors
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable URL session detection
    flowType: 'implicit',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'chatneto-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'chatneto-app',
    },
  },
  // Reduce polling frequency to minimize requests
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

export type { Profile } from './supabase-types';