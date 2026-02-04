import { supabase } from './supabase';
import type { Chat, Message, Contact, Profile } from './supabase-types';

// Chat functions
export async function getOrCreateChat(userId: string, otherUserId: string): Promise<Chat> {
  console.log(`🔵 getOrCreateChat: ${userId} <-> ${otherUserId}`);
  try {
    // 1. Try to find existing chat using chat_participants
    const { data: myChats } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId);

    if (myChats && myChats.length > 0) {
        const myChatIds = myChats.map(c => c.chat_id);

        // Try to find a chat where the other user is also a participant
        const { data: commonChats } = await supabase
           .from('chat_participants')
           .select('chat_id')
           .eq('user_id', otherUserId)
           .in('chat_id', myChatIds)
           .limit(1);

        if (commonChats && commonChats.length > 0) {
            const existingChatId = commonChats[0].chat_id;
            const { data: existingChat } = await supabase
                .from('chats')
                .select('*')
                .eq('id', existingChatId)
                .maybeSingle(); 
                
            if (existingChat) {
                console.log('✅ Found existing chat via participants:', existingChatId);
                return existingChat;
            }
        }
    }

    // 2. Fallback: Create new chat
    console.log('🔵 Creating new chat...');
    
    // Sort participants to ensure consistency (P1 < P2) for 1-on-1 chats
    const [p1, p2] = [userId, otherUserId].sort();

    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({
        participant1_id: p1,
        participant2_id: p2,
        last_message: 'New chat',
        last_message_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (error) {
         if (!error.message?.includes('fetch')) {
             console.error("Chat creation error:", error);
         }
         throw error;
    }

    if (!newChat) {
        throw new Error('Chat created but could not be retrieved (RLS policy?)');
    }

    // 3. Add participants
    const { error: partError } = await supabase
      .from('chat_participants')
      .insert([
        { chat_id: newChat.id, user_id: userId },
        { chat_id: newChat.id, user_id: otherUserId }
      ]);
      
    if (partError) {
        if (!partError.message?.includes('fetch')) {
            console.error('Error adding participants:', partError);
        }
    }

    return newChat;

  } catch (error: any) {
    if (!error?.message?.includes('fetch') && !error?.message?.includes('network')) {
        console.error('getOrCreateChat error:', error);
    }
    throw error;
  }
}

export async function getUserChats(userId: string) {
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
  await supabase
    .from('chats')
    .update({ 
        last_message: text,
        last_message_at: new Date().toISOString()
    })
    .eq('id', chatId);

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
        .neq('sender_id', userId)
        .eq('read', false); // Only update unread ones
  } catch (e: any) {
      if (!e?.message?.includes('fetch')) {
          console.log('Error marking read', e);
      }
  }
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

// Subscriptions
// UPDATED: Now handles messages, updates (read receipts), and typing
export function subscribeToChat(
  chatId: string, 
  callbacks: {
    onMessage: (message: Message) => void;
    onMessageUpdate: (message: Message) => void;
    onTyping: (userId: string) => void;
  }
) {
  const channel = supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        callbacks.onMessage(payload.new as Message);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        callbacks.onMessageUpdate(payload.new as Message);
      }
    )
    .on(
      'broadcast',
      { event: 'typing' },
      (payload) => {
        if (payload.payload && payload.payload.userId) {
          callbacks.onTyping(payload.payload.userId);
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
    sendTyping: (userId: string) => {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId },
      });
    }
  };
}

// Deprecated: kept for backward compatibility if needed, but subscribeToChat is preferred
export function subscribeToMessages(chatId: string, onMessage: (message: Message) => void) {
  return subscribeToChat(chatId, {
    onMessage,
    onMessageUpdate: () => {},
    onTyping: () => {}
  }).unsubscribe;
}
