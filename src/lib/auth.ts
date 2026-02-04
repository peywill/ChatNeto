import { supabase } from './supabase';
export { supabase };
import type { Profile } from './supabase-types';

export async function signUp(email: string, password: string, name: string, avatar: string) {
  console.log('🔵 Starting signup for:', email);
  
  try {
    // Sign up the user
    console.log('🔵 Step 1: Creating auth user...');
    
    // Create a timeout promise to race against the actual signup
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timed out')), 20000)
    );

    const { data, error } = await Promise.race([
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            avatar_url: avatar,
          }
        }
      }),
      timeoutPromise
    ]) as any;

    if (error) {
      console.error('❌ Signup error:', error);
      throw new Error(`Signup failed: ${error.message}`);
    }
    if (!data.user) {
      throw new Error('No user returned from signup');
    }

    console.log('✅ User created:', data.user.id);

    // Wait a brief moment for auth to propagate locally
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if profile already exists (in case of retry or trigger creation)
    console.log('🔵 Step 2: Checking for existing profile...');
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    
    // Ignore abort/network errors when checking for existing profile
    if (checkError && 
        !checkError.message?.includes('aborted') && 
        !checkError.message?.includes('fetch') &&
        !checkError.message?.includes('Failed to fetch')
    ) {
      console.error('Error checking profile:', checkError);
    }

    if (existingProfile) {
      console.log('⚠️ Profile already exists, updating it...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: name,
          avatar: avatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id);

      if (updateError && 
          !updateError.message?.includes('aborted') &&
          !updateError.message?.includes('fetch')
      ) {
        console.error('❌ Error updating profile:', updateError);
        // We don't throw here because the user is created and we can fix profile later
      } else {
        console.log('✅ Profile updated successfully!');
      }
    } else {
      console.log('🔵 Step 3: Creating new profile manually...');
      // Note: We might have a database trigger that does this automatically too
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          name: name,
          avatar: avatar,
        });

      if (profileError && 
          !profileError.message?.includes('aborted') &&
          !profileError.message?.includes('fetch') &&
          // Ignore duplicate key error if trigger already created it
          !profileError.message?.includes('duplicate key')
      ) {
        console.error('❌ Error creating profile:', profileError);
        // Don't throw, let them login
      } else {
        console.log('✅ Profile created successfully!');
      }
    }

    console.log('🎉 Signup complete! Returning data...');
    return data;
  } catch (error: any) {
    // Gracefully handle network/abort errors
    if (
      error?.name === 'AbortError' || 
      error?.message?.includes('aborted') ||
      error?.message?.includes('Failed to fetch') ||
      error?.name === 'AuthRetryableFetchError'
    ) {
      console.log('Signup network issue (potentially transient):', error.message);
      // If we got this far, it's possible the user WAS created but the response was lost.
      // We will rethrow a more friendly error
      throw new Error('Network connection unstable. Please try logging in if account creation succeeded.');
    }
    console.error('❌ Signup failed:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    if (error?.message?.includes('fetch') || error?.name === 'AuthRetryableFetchError') {
       throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    // Ignore errors during signout (best effort)
    console.warn('Signout warning:', error);
  }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    // Add retry logic or timeout
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Ignore abort/fetch errors
      if (
        error.message?.includes('aborted') || 
        error.message?.includes('FetchError') ||
        error.message?.includes('Failed to fetch')
      ) {
        console.log('Profile fetch network issue (ignoring)');
        return null;
      }
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  } catch (error: any) {
    // Ignore abort errors
    if (
        error?.name === 'AbortError' || 
        error?.message?.includes('aborted') ||
        error?.message?.includes('fetch')
    ) {
      console.log('Profile fetch aborted/failed (ignoring)');
      return null;
    }
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateProfile(userId: string, updates: { name?: string; avatar?: string; bio?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update user's last_seen timestamp to track online status
export async function updateLastSeen(userId: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId);

    if (error && !error.message?.includes('aborted') && !error.message?.includes('fetch')) {
      console.error('Error updating last_seen:', error);
    }
  } catch (error: any) {
    // Silently fail for abort/network errors
    if (
        error?.name === 'AbortError' || 
        error?.message?.includes('aborted') ||
        error?.message?.includes('fetch')
    ) {
      return;
    }
    console.error('Error updating last_seen:', error);
  }
}

// Check if a user is online (seen within last 2 minutes)
export function isUserOnline(lastSeen: string | undefined): boolean {
  if (!lastSeen) return false;
  
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
  
  // Consider user online if they were active within last 10 minutes (increased from 5)
  // This gives more tolerance for mobile browsers backgrounding the app
  return diffMinutes < 10;
}
