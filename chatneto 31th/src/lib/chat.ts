import { supabase } from './supabase';
import type { Chat, Message, Contact, Profile } from './supabase-types';

// Chat functions
export async function getOrCreateChat(userId: string, otherUserId: string): Promise<Chat> {
  try {
    // 1. Try to find existing chat using chat_participants (The "King Key" Way)
    // This is more robust than checking columns on the chats table
    
    // Get all chat IDs for current user
    const { data: myChats } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId);

    if (myChats && myChats.length > 0) {
        const myChatIds = myChats.map(c => c.chat_id);

        // Check if the other user is in any of these chats
        const { data: commonChats } = await supabase
           .from('chat_participants')
           .select('chat_id')
           .eq('user_id', otherUserId)
           .in('chat_id', myChatIds)
           .limit(1);

        if (commonChats && commonChats.length > 0) {
            // Found existing chat!
            const existingChatId = commonChats[0].chat_id;
            
            // Fetch the chat details
            const { data: existingChat } = await supabase
                .from('chats')
                .select('*')
                .eq('id', existingChatId)
                .single();
                
            if (existingChat) return existingChat;
        }
    }

    // 2. Create new chat
    // We try to use the most compatible method
    console.log('Creating new chat...');
    
    // First, create the chat row. 
    // We try to insert with legacy columns if they exist, but if they fail, we fallback?
    // Actually, we can't easily "try/catch" an insert.
    // So we will assume the King Key SQL ran, which does NOT guarantee participant1_id columns.
    // However, Supabase ignores extra fields in JS objects usually? No, it errors.
    
    // SAFEST APPROACH: Just create with minimal fields first.
    // If we need the legacy columns, we'd know.
    
    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({
        last_message: 'New chat',
        last_message_at: new Date().toISOString()
        // We omit participant1_id/2_id here to be safe. 
        // If the table requires them, the King Key SQL would have failed or needs them.
        // But standard chat apps don't need them if using junction table.
      })
      .select()
      .single();

    if (error) {
        // Fallback: If it failed, maybe it REQUIRES participant columns (Legacy Schema)
        console.warn('Standard create failed, trying legacy mode...', error);
        const [p1, p2] = [userId, otherUserId].sort();
        const { data: legacyChat, error: legacyError } = await supabase
            .from('chats')
            .insert({
                participant1_id: p1,
                participant2_id: p2,
                last_message: 'New chat',
                last_message_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (legacyError) throw legacyError;
        
        // Ensure participants are added (Legacy might rely on columns, but we want junction too)
        await supabase
          .from('chat_participants')
          .insert([
            { chat_id: legacyChat.id, user_id: userId },
            { chat_id: legacyChat.id, user_id: otherUserId }
          ]);
          
        return legacyChat;
    }

    // 3. Add to chat_participants table
    if (newChat) {
        await supabase
          .from('chat_participants')
          .insert([
            { chat_id: newChat.id, user_id: userId },
            { chat_id: newChat.id, user_id: otherUserId }
          ]);
    }

    return newChat;
  } catch (error: any) {
    console.error('getOrCreateChat error:', error);
    throw error;
  }
}

export async function getUserChats(userId: string) {
  // This function is deprecated in favor of the logic in ChatList.tsx
  // But we keep it returning empty array to prevent crashes if called
  return [];
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
      return [];
    }
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  // Update last message in chat
  await supabase
    .from('chats')
    .update({ 
        last_message: text,
        last_message_at: new Date().toISOString()
    })
    .eq('id', chatId);

  // Insert message
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
  try {
    await supabase
        .from('messages')
        .update({ read: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId);
  } catch (e) {
      console.log('Error marking read', e);
  }
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

// Subscriptions
export function subscribeToMessages(chatId: string, onMessage: (message: Message) => void) {
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
        onMessage(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
