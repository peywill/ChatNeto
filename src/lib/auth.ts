import { supabase } from './supabase';
import type { Profile } from './supabase-types';

export async function signUp(email: string, password: string, name: string, avatar: string) {
  console.log('🔵 Starting signup for:', email);
  
  try {
    // Sign up the user
    console.log('🔵 Step 1: Creating auth user...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('❌ Signup error:', error);
      throw new Error(`Signup failed: ${error.message}`);
    }
    if (!data.user) {
      throw new Error('No user returned from signup');
    }

    console.log('✅ User created:', data.user.id);

    // Wait for auth to settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if profile already exists (in case of retry)
    console.log('🔵 Step 2: Checking for existing profile...');
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    
    // Ignore abort errors when checking for existing profile
    if (checkError && !checkError.message?.includes('aborted')) {
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

      if (updateError && !updateError.message?.includes('aborted')) {
        console.error('❌ Error updating profile:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }
      console.log('✅ Profile updated successfully!');
    } else {
      console.log('🔵 Step 3: Creating new profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          name: name,
          avatar: avatar,
        });

      if (profileError && !profileError.message?.includes('aborted')) {
        console.error('❌ Error creating profile:', profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }
      console.log('✅ Profile created successfully!');
    }

    console.log('🎉 Signup complete! Returning data...');
    return data;
  } catch (error: any) {
    // Ignore abort errors
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      console.log('Signup aborted (this is normal)');
      throw error;
    }
    console.error('❌ Signup failed:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Ignore abort errors
      if (error.message?.includes('aborted') || error.message?.includes('FetchError')) {
        console.log('Profile fetch aborted (this is normal)');
        return null;
      }
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  } catch (error: any) {
    // Ignore abort errors
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      console.log('Profile fetch aborted (this is normal)');
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

    if (error && !error.message?.includes('aborted')) {
      console.error('Error updating last_seen:', error);
    }
  } catch (error: any) {
    // Silently fail for abort errors
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
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
  
  // Consider user online if they were active within last 5 minutes (increased from 2)
  // This gives more tolerance for the 30-second update interval
  return diffMinutes < 5;
}