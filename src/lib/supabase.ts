import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Priority: 1. LocalStorage (Manual Override) -> 2. Hardcoded Default
// We removed import.meta.env to prevent runtime errors in environments where it is undefined.

const DEFAULT_URL = 'https://eepaswqrmehdcccfqjpm.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcGFzd3FybWVoZGNjY2ZxanBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTI0MDIsImV4cCI6MjA4NDA4ODQwMn0.nwo4Ys6BwkQwzZRJIVWoKpUHMRDRBoPFyl_BqBoptGQ';

const getSupabaseConfig = () => {
  // Check if running in browser
  if (typeof window !== 'undefined') {
      try {
          const savedUrl = localStorage.getItem('chatneto-supabase-url');
          const savedKey = localStorage.getItem('chatneto-supabase-key');
          
          if (savedUrl && savedKey && savedUrl.startsWith('https://') && savedUrl.includes('.supabase.co')) {
              console.log('Using custom Supabase connection from LocalStorage');
              return { url: savedUrl, key: savedKey };
          } else if (savedUrl || savedKey) {
             console.warn('Found invalid Supabase credentials in LocalStorage. ignoring.');
             // Optional: Clear them? No, let user see them in settings if they want.
          }
      } catch (e) {
          console.error("Error reading from localStorage", e);
      }
  }

  return { url: DEFAULT_URL, key: DEFAULT_KEY };
};

const config = getSupabaseConfig();
const supabaseUrl = config.url;
const supabaseAnonKey = config.key;

// Suppress window error events for AbortErrors to prevent console noise
if (typeof window !== 'undefined') {
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const errorString = String(message) + ' ' + (error?.message || '');
    if (
      errorString.includes('abort') || 
      errorString.includes('signal') || 
      errorString.includes('failed to fetch') ||
      errorString.includes('network request failed')
    ) {
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
    if (
      errorString.includes('abort') || 
      errorString.includes('signal') ||
      errorString.includes('failed to fetch') ||
      errorString.includes('network request failed')
    ) {
      event.preventDefault(); // Prevent default error handling
      return;
    }
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.call(window, event);
    }
  };
}

// Create Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'implicit',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'chatneto-auth-token',
  },
  global: {
    headers: {
      'X-Client-Info': 'chatneto-app',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

export type { Profile } from './supabase-types';
