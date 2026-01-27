import { supabase } from './supabase';
import type { Chat, Message, Contact, Profile } from './supabase-types';

// Chat functions
export async function getOrCreateChat(userId: string, otherUserId: string): Promise<Chat> {
  try {
    // Ensure participant1_id < participant2_id for the unique constraint
    const [participant1, participant2] = [userId, otherUserId].sort();

    // Check if chat exists
    const { data: existingChat } = await supabase
      .from('chats')
      .select('*')
      .eq('participant1_id', participant1)
      .eq('participant2_id', participant2)
      .single();

    if (existingChat) {
      return existingChat;
    }

    // Create new chat
    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({
        participant1_id: participant1,
        participant2_id: participant2,
      })
      .select()
      .single();

    if (error) throw error;
    return newChat;
  } catch (error: any) {
    // Ignore abort errors
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      console.log('Get or create chat aborted (this is normal)');
      throw error; // Re-throw to let caller handle
    }
    throw error;
  }
}

export async function getUserChats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        participant1:profiles!chats_participant1_id_fkey(*),
        participant2:profiles!chats_participant2_id_fkey(*)
      `)
      .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      // Ignore abort errors
      if (error.message?.includes('aborted') || error.name === 'AbortError') {
        console.log('Get chats aborted (this is normal)');
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (error: any) {
    // Ignore abort errors
    if (error.message?.includes('aborted') || error.name === 'AbortError') {
      console.log('Get chats aborted (this is normal)');
      return [];
    }
    throw error;
  }
}

// Message functions
export async function getChatMessages(chatId: string) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      // Ignore abort errors
      if (error.message?.includes('aborted') || error.name === 'AbortError') {
        console.log('Get messages aborted (this is normal)');
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (error: any) {
    // Ignore abort errors
    if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
      console.log('Get messages aborted (this is normal)');
      return [];
    }
    throw error;
  }
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      text,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markMessagesAsRead(chatId: string, userId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('chat_id', chatId)
    .neq('sender_id', userId);

  if (error) throw error;
}

// Contact functions
export async function getUserContacts(userId: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      contact:profiles!contacts_contact_id_fkey(*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

export async function addContact(userId: string, contactId: string) {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      user_id: userId,
      contact_id: contactId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeContact(userId: string, contactId: string) {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('user_id', userId)
    .eq('contact_id', contactId);

  if (error) throw error;
}

export async function searchUsers(query: string, currentUserId: string) {
  try {
    let queryBuilder = supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId);
    
    // Only add search filter if query is not empty
    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
    }
    
    const { data, error } = await queryBuilder
      .order('name', { ascending: true })
      .limit(20);

    if (error) {
      // Ignore abort errors
      if (error.message?.includes('aborted') || error.name === 'AbortError') {
        return [];
      }
      throw error;
    }
    
    // Return all users found (or empty array)
    return data || [];
  } catch (error: any) {
    // Ignore abort errors
    if (error.message?.includes('aborted') || error.name === 'AbortError') {
      return [];
    }
    throw error;
  }
}

// Get a specific user's profile (used for getting chat participant info with last_seen)
export async function getUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.message?.includes('aborted') || error.name === 'AbortError') {
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error: any) {
    if (error.message?.includes('aborted') || error.name === 'AbortError') {
      return null;
    }
    throw error;
  }
}

// Real-time subscriptions
export function subscribeToMessages(chatId: string, onMessage: (message: Message) => void) {
  console.log('🔔 Setting up message subscription for chat:', chatId);
  
  const channel = supabase
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        console.log('🔔 Real-time message received:', payload);
        onMessage(payload.new as Message);
      }
    )
    .subscribe((status) => {
      console.log('🔔 Subscription status:', status);
    });

  return () => {
    console.log('🔔 Unsubscribing from messages:', chatId);
    supabase.removeChannel(channel);
  };
}

export function subscribeToChats(userId: string, onChatUpdate: () => void) {
  const channel = supabase
    .channel(`chats:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chats',
      },
      () => {
        onChatUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
      },
      () => {
        onChatUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}