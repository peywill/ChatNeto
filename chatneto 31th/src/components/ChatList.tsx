import { useState, useEffect, useRef } from 'react';
import { ChatListScreen, Chat } from './ChatListScreen';
import { supabase } from '../lib/auth';
import { usePresence } from '../lib/presence';

interface ChatListProps {
  onSelectChat: (chat: any) => void;
  onOpenContacts: () => void;
  onOpenProfile: () => void;
}

export function ChatList({ onSelectChat, onOpenContacts, onOpenProfile }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentUser, setCurrentUser] = useState({ name: '', avatar: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom hook to track who is online
  const onlineUsers = usePresence();
  
  // Use ref to track mounted state
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    // Safety timeout in case initial fetch hangs forever
    const safetyTimer = setTimeout(() => {
      if (isMounted.current && loading) {
        console.warn('ChatList fetch timed out');
        setLoading(false);
        // Don't set error, just show empty list which is better than infinite spinner
      }
    }, 5000);
    
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted.current) return;

        // 1. Fetch My Profile
        // Added timeout to profile fetch too
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        const { data: profile } = await profilePromise;
          
        if (profile && isMounted.current) {
          setCurrentUser({ 
            name: profile.name || 'User', 
            avatar: profile.avatar || 'bg-blue-400' 
          });
        }

        // 2. Fetch My Chats
        const { data: myParticipations, error: myChatsError } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);

        if (myChatsError) throw myChatsError;

        if (!myParticipations || myParticipations.length === 0) {
          if (isMounted.current) {
            setChats([]);
            setLoading(false);
          }
          return;
        }

        const myChatIds = myParticipations.map(c => c.chat_id);

        // 3. Fetch Participants to find partners
        const { data: allParticipants, error: participantsError } = await supabase
           .from('chat_participants')
           .select('chat_id, user_id')
           .in('chat_id', myChatIds);
           
        if (participantsError) throw participantsError;

        // 4. Identify Partners
        const partnerRows = allParticipants.filter(p => p.user_id !== user.id);
        const partnerUserIds = [...new Set(partnerRows.map(p => p.user_id))];

        // 5. Fetch Partner Profiles
        let profilesMap: Record<string, any> = {};
        if (partnerUserIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .in('id', partnerUserIds);
            
            if (profiles) {
                profiles.forEach(p => {
                    profilesMap[p.id] = p;
                });
            }
        }

        // 6. Fetch Last Messages 
        const formattedChats: Chat[] = [];

        for (const chatId of myChatIds) {
            const partnerRow = partnerRows.find(p => p.chat_id === chatId);
            const partnerProfile = partnerRow ? profilesMap[partnerRow.user_id] : null;
            const partnerId = partnerRow?.user_id;

            // Fetch last message
            const { data: lastMsg } = await supabase
                .from('messages')
                .select('text, created_at, read, sender_id')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            // Count unread messages 
            const { count: unreadCount } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('chat_id', chatId)
                .eq('read', false)
                .neq('sender_id', user.id);

            formattedChats.push({
                id: chatId,
                name: partnerProfile?.name || 'Unknown User',
                avatar: partnerProfile?.avatar || 'bg-gray-400',
                lastMessage: lastMsg?.text || 'No messages yet',
                timestamp: lastMsg?.created_at || '1970-01-01T00:00:00Z', 
                unread: unreadCount || 0,
                online: partnerId ? onlineUsers.has(partnerId) : false,
                participantId: partnerId,
            });
        }

        // Sort: Newest timestamp first
        formattedChats.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });
        
        if (isMounted.current) setChats(formattedChats);

      } catch (err: any) {
        console.error('Error in ChatList:', err);
        if (isMounted.current) setError(err.message);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      }
    };

    fetchData();
    
    const interval = setInterval(() => {
        if (document.visibilityState === 'visible' && isMounted.current) {
           // We do a simplified fetch here or rely on subscription?
           // For now re-running full fetch is expensive but safe
           // Better to optimize later.
           fetchData();
        }
    }, 5000); 

    return () => {
        isMounted.current = false;
        clearInterval(interval);
        clearTimeout(safetyTimer);
    };
  }, [onlineUsers]); 

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
      return (
          <div className="p-8 text-center text-red-600 bg-red-50 h-full flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold mb-2">Database Error</h3>
              <p className="max-w-md text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                Retry
              </button>
          </div>
      );
  }

  return (
    <ChatListScreen
      chats={chats}
      currentUser={currentUser}
      onChatClick={(chatId) => {
        const chat = chats.find(c => c.id === chatId);
        if (chat) onSelectChat(chat);
      }}
      onNewChat={onOpenContacts}
      onProfileClick={onOpenProfile}
    />
  );
}
