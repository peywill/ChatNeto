import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eepaswqrmehdcccfqjpm.supabase.co';
const supabaseAnonKey = 'sb_publishable_aEz4eudRlGBb6U0GLwvHFg_AzGevdd8';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// TEMPORARILY DISABLED - Allow console logs for debugging
// const originalConsoleError = console.error;
// const originalConsoleWarn = console.warn;
// const originalConsoleLog = console.log;

// const shouldSuppressError = (...args: any[]): boolean => {
//   const combined = args.map(arg => {
//     if (arg instanceof Error) return arg.name + ' ' + arg.message + ' ' + arg.stack;
//     if (typeof arg === 'object') {
//       try {
//         return JSON.stringify(arg);
//       } catch {
//         return String(arg);
//       }
//     }
//     return String(arg);
//   }).join(' ').toLowerCase();
  
//   return combined.includes('abort') || combined.includes('signal');
// };

// console.error = (...args: any[]) => {
//   if (shouldSuppressError(...args)) return;
//   originalConsoleError.apply(console, args);
// };

// console.warn = (...args: any[]) => {
//   if (shouldSuppressError(...args)) return;
//   originalConsoleWarn.apply(console, args);
// };

// console.log = (...args: any[]) => {
//   if (shouldSuppressError(...args)) return;
//   originalConsoleLog.apply(console, args);
// };

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