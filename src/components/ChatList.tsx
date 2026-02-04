import { useState, useEffect, useRef, useMemo } from 'react';
import { ChatListScreen, Chat } from './ChatListScreen';
import { supabase, isUserOnline } from '../lib/auth';

interface ChatListProps {
  onlineUsers: Set<string>;
  onSelectChat: (chat: any) => void;
  onOpenContacts: () => void;
  onOpenProfile: () => void;
}

export function ChatList({ onlineUsers, onSelectChat, onOpenContacts, onOpenProfile }: ChatListProps) {
  const [chats, setChats] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState({ name: '', avatar: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMounted = useRef(true);
  
  // 1. Fetch Data Logic
  const fetchChats = async () => {
    // Optimization: Don't fetch if tab is hidden (saves battery and reduces errors)
    if (document.hidden && chats.length > 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parallelize Profile and Chats fetching
      const [profileResult, participationsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('chat_participants').select('chat_id').eq('user_id', user.id)
      ]);

      const profile = profileResult.data;
      if (profile && isMounted.current) {
        setCurrentUser({ 
          name: profile.name || 'User', 
          avatar: profile.avatar || 'bg-blue-400' 
        });
      }

      const myParticipations = participationsResult.data;
      if (!myParticipations || myParticipations.length === 0) {
        if (isMounted.current) {
            setChats([]);
            setLoading(false);
        }
        return;
      }

      const myChatIds = myParticipations.map(c => c.chat_id);

      // Fetch Participants for these chats
      const { data: allParticipants } = await supabase
         .from('chat_participants')
         .select('chat_id, user_id')
         .in('chat_id', myChatIds);
         
      if (!allParticipants) throw new Error('Failed to load participants');

      // Identify Partners
      const partnerRows = allParticipants.filter(p => p.user_id !== user.id);
      const partnerUserIds = [...new Set(partnerRows.map(p => p.user_id))];
      
      // Fetch Partner Profiles (including last_seen)
      let profilesMap: Record<string, any> = {};
      if (partnerUserIds.length > 0) {
          const { data: profiles } = await supabase
              .from('profiles')
              .select('*')
              .in('id', partnerUserIds);
          
          if (profiles) {
              profiles.forEach(p => profilesMap[p.id] = p);
          }
      }

      // Fetch Messages in Parallel
      const chatPromises = myChatIds.map(async (chatId) => {
          const partnerRow = partnerRows.find(p => p.chat_id === chatId);
          const partnerId = partnerRow?.user_id;
          const partnerProfile = partnerId ? profilesMap[partnerId] : null;

          // Default values
          let lastMsgText = 'No messages yet';
          let lastMsgTime = '1970-01-01T00:00:00Z';
          let unreadCount = 0;

          try {
              const [msgRes, unreadRes] = await Promise.all([
                  supabase.from('messages')
                    .select('text, created_at')
                    .eq('chat_id', chatId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle(),
                  supabase.from('messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('chat_id', chatId)
                    .eq('read', false)
                    .neq('sender_id', user.id)
              ]);

              if (msgRes.data) {
                  lastMsgText = msgRes.data.text;
                  lastMsgTime = msgRes.data.created_at;
              }
              if (unreadRes.count) {
                  unreadCount = unreadRes.count;
              }
          } catch (e: any) {
              const msg = e?.message || '';
              if (!msg.includes('fetch') && !msg.includes('abort')) {
                  console.warn(`Failed to fetch details for chat ${chatId}`, e);
              }
          }

          return {
              id: chatId,
              name: partnerProfile?.name || 'Unknown User',
              avatar: partnerProfile?.avatar || 'bg-gray-400',
              lastMessage: lastMsgText,
              timestamp: lastMsgTime,
              unread: unreadCount,
              online: false, // Computed in render
              isOnline: false, // Computed in render
              participantId: partnerId,
              lastSeen: partnerProfile?.last_seen // Store for fallback
          };
      });

      const formattedChats = await Promise.all(chatPromises);

      // Sort by newest
      formattedChats.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      if (isMounted.current) {
        setChats(formattedChats);
        setLoading(false);
      }

    } catch (err: any) {
      const msg = err?.message || '';
      const isAbort = err?.name === 'AbortError' || msg.includes('aborted');
      const isNetwork = msg.includes('fetch') || msg.includes('network') || err?.name === 'TypeError';
      
      if (!isAbort && !isNetwork) {
          console.error('Error fetching chats:', err);
      }
      
      if (isMounted.current) {
          if (chats.length === 0 && !isAbort) {
               setError('Failed to load chats');
          }
          setLoading(false);
      }
    }
  };

  // 2. Lifecycle
  useEffect(() => {
    isMounted.current = true;
    
    // Initial fetch
    fetchChats();
    
    // Poll every 15s
    const interval = setInterval(fetchChats, 15000);

    // Smart Polling: Refresh immediately when tab becomes visible
    const handleVisibilityChange = () => {
        if (!document.hidden) {
            // console.log('Tab visible, refreshing chats...');
            fetchChats();
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        isMounted.current = false;
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, []);

  // 3. Compute Display Data (merging online status from Realtime + DB)
  const displayChats = useMemo(() => {
      return chats.map(chat => {
          const presenceOnline = chat.participantId ? onlineUsers.has(chat.participantId) : false;
          const dbOnline = isUserOnline(chat.lastSeen);
          
          const isOnline = presenceOnline || dbOnline;
          
          return {
              ...chat,
              online: isOnline,
              isOnline: isOnline
          };
      });
  }, [chats, onlineUsers]);

  if (loading && chats.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && chats.length === 0) {
      return (
          <div className="p-8 text-center text-red-600 bg-red-50 h-full flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold mb-2">Connection Issue</h3>
              <p className="max-w-md text-sm mb-4">We're having trouble connecting to your chats.</p>
              <button 
                onClick={() => { setLoading(true); setError(null); fetchChats(); }}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                Retry
              </button>
          </div>
      );
  }

  return (
    <ChatListScreen
      chats={displayChats}
      currentUser={currentUser}
      onChatClick={(chatId) => {
        const chat = displayChats.find(c => c.id === chatId);
        if (chat) onSelectChat(chat);
      }}
      onNewChat={onOpenContacts}
      onProfileClick={onOpenProfile}
    />
  );
}
