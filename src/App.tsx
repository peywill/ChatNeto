import { useState, useEffect, useRef } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ProfileSetupScreen } from './components/ProfileSetupScreen';
import { ChatList } from './components/ChatList';
import { ChatScreen } from './components/ChatScreen';
import { ContactsScreen } from './components/ContactsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { PartnerProfileScreen } from './components/PartnerProfileScreen';
import { supabase, signOut, updateLastSeen, isUserOnline } from './lib/auth';
import { usePresence } from './lib/presence';

type ScreenState = 'login' | 'signup' | 'profile-setup' | 'chat-list' | 'chat' | 'contacts' | 'profile' | 'partner-profile';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('login');
  const [activeChat, setActiveChat] = useState<any>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track online users globally
  const onlineUsers = usePresence();

  // Keep track of current screen in a ref
  const currentScreenRef = useRef(currentScreen);
  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    let mounted = true;

    // Safety timeout
    const timer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Session check timed out, forcing load completion');
        setLoading(false);
      }
    }, 10000);

    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
         if (error.message?.includes('fetch') || error.message?.includes('network')) {
             console.warn('Session check network retry needed (ignoring log)');
         } else {
             console.error('Error checking session:', error);
         }
      }

      setSession(session);
      if (session) {
        setCurrentScreen('chat-list');
      }
      setLoading(false);
    }).catch(err => {
      if (!err?.message?.includes('fetch') && !err?.message?.includes('network')) {
          console.error('Unexpected error during session check:', err);
      }
      if (mounted) setLoading(false);
    }).finally(() => {
      clearTimeout(timer);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('Auth event:', event);
      setSession(session);
      
      if (session) {
        const current = currentScreenRef.current;
        if (current === 'login' || current === 'signup') {
          setCurrentScreen('chat-list');
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentScreen('login');
        setActiveChat(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Heartbeat to update last_seen
  useEffect(() => {
    if (!session?.user?.id) return;

    const updateStatus = () => {
        updateLastSeen(session.user.id).catch(() => {});
    };

    // Update immediately
    updateStatus();

    // Then every 2 minutes
    const interval = setInterval(updateStatus, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const handleLogout = async () => {
    setSession(null);
    setCurrentScreen('login');
    setActiveChat(null);
    try {
      localStorage.clear();
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderContent = () => {
    if (loading) {
        return (
          <div className="h-full w-full flex flex-col items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500 text-sm">Connecting to ChatNeto...</p>
          </div>
        );
    }

    if (!session) {
        if (currentScreen === 'signup') {
          return (
            <SignupScreen 
              onSignup={(newSession) => {
                setCurrentScreen('chat-list');
                setSession(newSession);
              }} 
              onSwitchToLogin={() => setCurrentScreen('login')} 
            />
          );
        }
        return (
          <LoginScreen 
            onLogin={(newSession) => {
              setCurrentScreen('chat-list');
              setSession(newSession);
            }} 
            onSwitchToSignup={() => setCurrentScreen('signup')} 
          />
        );
    }

    if (currentScreen === 'profile-setup') {
        return (
          <ProfileSetupScreen 
            userId={session?.user?.id}
            onComplete={() => setCurrentScreen('chat-list')} 
          />
        );
    }

    if (currentScreen === 'partner-profile' && viewingProfileId) {
        return (
            <PartnerProfileScreen
                userId={viewingProfileId}
                onBack={() => {
                   // If we have an active chat, go back to it, otherwise chat list
                   if (activeChat) setCurrentScreen('chat');
                   else setCurrentScreen('chat-list');
                }}
                onSendMessage={() => {
                   // If we are already in a context where activeChat exists and matches, go there.
                   // But if we came from Contacts?
                   if (activeChat && activeChat.participantId === viewingProfileId) {
                       setCurrentScreen('chat');
                   } else {
                       // We need to start a chat? 
                       // For now, assume we came from ChatScreen so activeChat is set.
                       // If not, just go back to chat list.
                       setCurrentScreen('chat-list');
                   }
                }}
            />
        );
    }

    if (currentScreen === 'chat' && activeChat) {
        // Determine online status based on Realtime OR Database Last Seen
        const isOnline = 
            (activeChat.participantId && onlineUsers.has(activeChat.participantId)) || 
            (activeChat.lastSeen && isUserOnline(activeChat.lastSeen));

        return (
          <ChatScreen
            chatId={activeChat.id}
            participantId={activeChat.participantId}
            participantName={activeChat.name}
            participantAvatar={activeChat.avatar}
            participantIsOnline={!!isOnline}
            onBack={() => {
              setActiveChat(null);
              setCurrentScreen('chat-list');
            }}
            onViewProfile={(userId) => {
                setViewingProfileId(userId);
                setCurrentScreen('partner-profile');
            }}
          />
        );
    }

    if (currentScreen === 'contacts') {
        return (
          <ContactsScreen
            onlineUsers={onlineUsers}
            onBack={() => setCurrentScreen('chat-list')}
            onSelectContact={(chatOrContact) => {
              setActiveChat(chatOrContact);
              setCurrentScreen('chat');
            }}
          />
        );
    }

    if (currentScreen === 'profile') {
        return (
          <ProfileScreen
            onBack={() => setCurrentScreen('chat-list')}
            onLogout={handleLogout}
          />
        );
    }

    return (
        <ChatList
          onlineUsers={onlineUsers}
          onSelectChat={(chat) => {
            setActiveChat(chat);
            setCurrentScreen('chat');
          }}
          onOpenContacts={() => setCurrentScreen('contacts')}
          onOpenProfile={() => setCurrentScreen('profile')}
        />
    );
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center font-sans">
      <div className="w-full h-[100dvh] sm:h-[800px] sm:max-w-md sm:rounded-xl sm:shadow-2xl overflow-hidden bg-white relative">
        {renderContent()}
      </div>
    </div>
  );
}
