import { useEffect, useState, useRef, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { supabase } from './lib/supabase';
import type { Profile } from './lib/supabase-types';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ProfileSetupScreen } from './components/ProfileSetupScreen';
import { ChatListScreen } from './components/ChatListScreen';
import { ChatScreen } from './components/ChatScreen';
import { ContactsScreen } from './components/ContactsScreen';
import { UserProfileScreen } from './components/UserProfileScreen';
import { getProfile, updateProfile, createProfile, signUp, signOut, updateLastSeen, isUserOnline } from './lib/auth';
import { 
  getUserChats, 
  getChatMessages, 
  sendMessage, 
  markMessagesAsRead,
  subscribeToMessages,
  subscribeToChats,
  getUserProfile,
  getOrCreateChat,
  searchUsers
} from './lib/chat';

type Screen = 'login' | 'signup' | 'profile-setup' | 'chat-list' | 'chat' | 'contacts' | 'user-profile';

interface ChatDisplay {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  otherUserId: string;
}

interface MessageDisplay {
  id: string;
  text: string;
  timestamp: string;
  sent: boolean;
  read?: boolean;
  sending?: boolean;
  error?: boolean;
}

interface ContactDisplay {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  online: boolean;
}

function App() {
  useEffect(() => {
    document.title = 'ChatNeto - Connect with friends';
    
    // Also set the viewport height CSS variable for mobile browsers
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
    };
  }, []);

  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tempSignupData, setTempSignupData] = useState<{ email: string; password: string; name: string } | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentOtherUserId, setCurrentOtherUserId] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false); // NEW: Track signup in progress
  const [isMounted, setIsMounted] = useState(true); // Track component mount state
  const [isOnline, setIsOnline] = useState(navigator.onLine); // Track online/offline status
  
  const [chats, setChats] = useState<ChatDisplay[]>([]);
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [contacts, setContacts] = useState<ContactDisplay[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);

  // Memoize formatTimestamp function
  const formatTimestamp = useCallback((timestamp: string | undefined): string => {
    if (!timestamp) return 'Now';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }, []);

  // Memoize loadChats function
  const loadChats = useCallback(async () => {
    if (!user) return;
    
    try {
      const chatsData = await getUserChats(user.id);
      const chatDisplays: ChatDisplay[] = chatsData.map(chat => {
        const otherUser = chat.participant1_id === user.id 
          ? (chat.participant2 as any)
          : (chat.participant1 as any);
        
        return {
          id: chat.id,
          name: otherUser.name || 'Unknown',
          avatar: otherUser.avatar || 'bg-gray-400',
          lastMessage: chat.last_message || 'No messages yet',
          timestamp: formatTimestamp(chat.last_message_at || chat.created_at),
          unread: 0, // TODO: Implement unread count
          online: isUserOnline(otherUser.last_seen),
          otherUserId: otherUser.id,
        };
      });
      
      setChats(chatDisplays);
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        console.log('Load chats aborted (this is normal)');
        return;
      }
      console.error('Error loading chats:', error);
    }
  }, [user, formatTimestamp]);

  // Memoize loadMessages function
  const loadMessages = useCallback(async () => {
    if (!currentChatId || !user) return;
    
    try {
      const messagesData = await getChatMessages(currentChatId);
      const messageDisplays: MessageDisplay[] = messagesData.map(msg => ({
        id: msg.id,
        text: msg.text,
        timestamp: formatTimestamp(msg.created_at),
        sent: msg.sender_id === user.id,
        read: msg.read,
      }));
      
      setMessages(messageDisplays);
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        console.log('Load messages aborted (this is normal)');
        return;
      }
      console.error('Error loading messages:', error);
    }
  }, [currentChatId, user, formatTimestamp]);

  // Memoize loadContacts function
  const loadContacts = useCallback(async () => {
    if (!user) return;
    
    try {
      // Search for all users (excluding current user)
      console.log('🔍 Loading contacts for user:', user.id);
      const users = await searchUsers('', user.id);
      console.log('✅ Found users:', users.length, users);
      
      if (users.length === 0) {
        // No other users found - this is expected for new apps
        console.log('⚠️ No other users found');
        setContacts([]);
        return;
      }
      
      const contactDisplays: ContactDisplay[] = users.map(u => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        phone: u.email, // Using email as phone for display
        online: isUserOnline(u.last_seen),
      }));
      
      console.log('✅ Contacts to display:', contactDisplays);
      setContacts(contactDisplays);
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('❌ Error loading contacts:', error);
      // Set empty array on error
      setContacts([]);
    }
  }, [user]);

  // Check for existing session ONCE on mount
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    async function initializeAuth() {
      try {
        console.log('🔐 Checking for existing session...');
        
        // Set a timeout - if auth doesn't complete in 5 seconds, force show login
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('⏰ Auth initialization timeout - forcing login screen');
            setLoading(false);
            setCurrentScreen('login');
          }
        }, 5000);
        
        // Check if localStorage is available
        try {
          const test = 'test-storage';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          console.log('✅ localStorage is available');
        } catch (e) {
          console.warn('⚠️ localStorage is NOT available - sessions will not persist!');
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('🔐 Session check result:', session ? 'Session found' : 'No session');
        
        if (!isMounted) return; // Component unmounted, ignore
        
        if (session?.user) {
          console.log('🔐 User found in session:', session.user.id);
          console.log('🔐 Loading user profile...');
          const profile = await getProfile(session.user.id);
          
          if (isMounted && profile) {
            console.log('✅ Profile loaded successfully:', profile.name);
            clearTimeout(timeoutId);
            setUser(profile);
            setCurrentScreen('chat-list');
          } else {
            console.log('❌ Profile not found or component unmounted');
            clearTimeout(timeoutId);
            setCurrentScreen('login');
          }
        } else {
          console.log('ℹ️ No active session - showing login screen');
          clearTimeout(timeoutId);
          setCurrentScreen('login');
        }
      } catch (error: any) {
        // Completely ignore abort errors - they're normal during initialization
        // Check all possible AbortError formats
        const errorStr = String(error?.message || error?.reason || error || '').toLowerCase();
        if (error?.name === 'AbortError' || 
            errorStr.includes('abort') || 
            errorStr.includes('signal') ||
            error?.code === 'ABORT_ERR' ||
            error?.code === 20) {
          // Silently ignore - this is normal behavior
          return;
        }
        console.error('Error checking user:', error);
        clearTimeout(timeoutId);
        setCurrentScreen('login');
      } finally {
        if (isMounted) {
          console.log('🔐 Auth initialization complete');
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    }
    
    initializeAuth();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('Auth state changed:', event);
      
      // Skip during signup to avoid race conditions
      if (isSigningUp) {
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getProfile(session.user.id);
        if (isMounted && profile) {
          setUser(profile);
          setCurrentScreen('chat-list');
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setCurrentScreen('login');
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [isSigningUp]); // Add isSigningUp as dependency

  // Load chats when user logs in and set up periodic reload
  useEffect(() => {
    if (user && isMounted && currentScreen === 'chat-list') {
      loadChats();
      
      // Reload chats every 5 seconds to update online status
      const intervalId = setInterval(() => {
        if (isMounted) {
          loadChats();
        }
      }, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [user, loadChats, isMounted, currentScreen]);

  // Load messages when chat is opened
  useEffect(() => {
    if (!currentChatId || !user) return;
    
    // Load initial messages
    loadMessages();
    
    // Reload chats frequently to update online status in the chat header
    const chatReloadInterval = setInterval(() => {
      loadChats();
    }, 3000); // Update online status every 3 seconds
    
    // Set up subscription with stable callback
    const unsubscribe = subscribeToMessages(currentChatId, (newMessage) => {
      console.log('📨 Received new message via subscription:', newMessage);
      console.log('📨 Current user ID:', user.id);
      console.log('📨 Message sender ID:', newMessage.sender_id);
      console.log('📨 Is this my message?', newMessage.sender_id === user.id);
      
      // Add the message to the UI
      setMessages(prev => {
        console.log('📨 Current messages count:', prev.length);
        console.log('📨 Current message IDs:', prev.map(m => m.id));
        
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          console.log('⏭️ Message already exists (ID:', newMessage.id, '), skipping');
          return prev;
        }
        
        console.log('✅ Adding new message to UI (ID:', newMessage.id, ')');
        
        // Format timestamp here to avoid dependency issues
        const date = new Date(newMessage.created_at);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        let timestamp;
        if (days === 0) {
          timestamp = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } else if (days === 1) {
          timestamp = 'Yesterday';
        } else if (days < 7) {
          timestamp = date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
          timestamp = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        const newMessageDisplay = {
          id: newMessage.id,
          text: newMessage.text,
          timestamp: timestamp,
          sent: newMessage.sender_id === user.id,
          read: newMessage.read,
        };
        
        console.log('✅ Message display object:', newMessageDisplay);
        return [...prev, newMessageDisplay];
      });
    });
    
    // FALLBACK: Poll for new messages every 2 seconds if Realtime isn't working
    // This ensures messaging works even if Realtime is disabled
    console.log('⏰ Setting up polling fallback for chat:', currentChatId);
    let lastMessageCount = 0;
    
    const pollInterval = setInterval(async () => {
      if (!currentChatId) return;
      
      try {
        const messagesData = await getChatMessages(currentChatId);
        
        // Only update if we have NEW messages
        if (messagesData.length > lastMessageCount) {
          console.log('⏰ Polling found new messages:', messagesData.length, 'vs', lastMessageCount);
          lastMessageCount = messagesData.length;
          
          const messageDisplays: MessageDisplay[] = messagesData.map(msg => {
            const date = new Date(msg.created_at);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            let timestamp;
            if (days === 0) {
              timestamp = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            } else if (days === 1) {
              timestamp = 'Yesterday';
            } else if (days < 7) {
              timestamp = date.toLocaleDateString('en-US', { weekday: 'short' });
            } else {
              timestamp = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            
            return {
              id: msg.id,
              text: msg.text,
              timestamp: timestamp,
              sent: msg.sender_id === user.id,
              read: msg.read,
            };
          });
          
          setMessages(messageDisplays);
        }
      } catch (error) {
        console.error('⏰ Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    return () => {
      console.log('🔌 Cleaning up subscription and polling for chat:', currentChatId);
      unsubscribe();
      clearInterval(pollInterval);
      clearInterval(chatReloadInterval);
    };
  }, [currentChatId, user?.id, loadChats]); // Only depend on chatId and userId - nothing else!

  // Load contacts - ALWAYS reload when screen changes to contacts
  useEffect(() => {
    if (user && currentScreen === 'contacts') {
      // Force reload contacts every time we navigate to this screen
      setContacts([]); // Clear first
      loadContacts();
    }
  }, [user, currentScreen, loadContacts]);

  // Update user's last_seen timestamp periodically while logged in (every 30 seconds)
  useEffect(() => {
    if (!user) return;
    
    // Update immediately on login
    updateLastSeen(user.id);
    
    // Then update every 30 seconds
    const interval = setInterval(() => {
      updateLastSeen(user.id);
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user]);

  // Refresh online status periodically for chats and contacts (every 15 seconds)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      if (currentScreen === 'chat-list') {
        loadChats();
      } else if (currentScreen === 'contacts') {
        loadContacts();
      }
    }, 15000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user, currentScreen, loadChats, loadContacts]);

  // Online/Offline detection and auto-reconnection
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Internet connection restored!');
      setIsOnline(true);
      
      // Reload current screen data when coming back online
      if (user) {
        if (currentScreen === 'chat-list') {
          loadChats();
        } else if (currentScreen === 'chat') {
          loadMessages();
        } else if (currentScreen === 'contacts') {
          loadContacts();
        }
      }
    };
    
    const handleOffline = () => {
      console.log('📵 Internet connection lost');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, currentScreen, loadChats, loadMessages, loadContacts]);

  // Authentication handlers
  const handleLogin = () => {
    // Auth state change will handle the rest
  };

  const handleSignup = (email: string, password: string, name: string) => {
    setErrorMessage(''); // Clear any previous errors
    setTempSignupData({ email, password, name });
    setCurrentScreen('profile-setup');
    setIsSigningUp(true); // NEW: Set signup in progress
  };

  const handleProfileSetup = async (name: string, avatar: string) => {
    if (!tempSignupData) return;
    
    try {
      setLoading(true); // Show loading state
      console.log('Starting profile setup...');
      const result = await signUp(tempSignupData.email, tempSignupData.password, name, avatar);
      console.log('Signup completed!', result);
      
      // Wait a bit for the profile to be fully created
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Manually get the session and profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        if (profile) {
          console.log('Profile loaded after signup:', profile);
          setUser(profile);
          setCurrentScreen('chat-list');
          setTempSignupData(null);
          setLoading(false);
        } else {
          throw new Error('Profile not found after signup');
        }
      } else {
        throw new Error('No session after signup');
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      setErrorMessage(error.message || 'Failed to create account. Please check console for details.');
      setCurrentScreen('signup');
      setLoading(false);
    } finally {
      setIsSigningUp(false); // NEW: Reset signup in progress
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setCurrentScreen('login');
      setCurrentChatId(null);
      setChats([]);
      setMessages([]);
      setContacts([]);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Navigation handlers
  const handleChatClick = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      // Force update online status when entering a chat
      if (user) updateLastSeen(user.id);
      
      setCurrentChatId(chatId);
      setCurrentOtherUserId(chat.otherUserId);
      setCurrentScreen('chat');
    }
  };

  const handleBackToChats = () => {
    setCurrentChatId(null);
    setCurrentOtherUserId(null);
    setMessages([]);
    setCurrentScreen('chat-list');
  };

  const handleNewChat = () => {
    setCurrentScreen('contacts');
  };

  const handleContactClick = async (contactId: string) => {
    if (!user) return;
    
    try {
      console.log('🔵 Contact clicked:', contactId);
      
      // Check if chat already exists
      const existingChat = chats.find(c => c.otherUserId === contactId);
      if (existingChat) {
        console.log('✅ Found existing chat:', existingChat.id);
        handleChatClick(existingChat.id);
        return;
      }
      
      console.log('🆕 Creating new chat...');
      // Create new chat
      const chat = await getOrCreateChat(user.id, contactId);
      console.log('✅ Chat created:', chat.id);
      
      // Reload chats FIRST to get the full chat data with participants
      await loadChats();
      console.log('✅ Chats reloaded');
      
      // NOW set the current chat and navigate
      setCurrentChatId(chat.id);
      setCurrentOtherUserId(contactId);
      setMessages([]);
      setCurrentScreen('chat');
      console.log('✅ Navigated to chat screen');
    } catch (error) {
      console.error('❌ Error creating chat:', error);
      // Don't navigate if there was an error
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!currentChatId || !user) return;
    
    // Create a temporary ID for the optimistic message
    const tempId = `temp-${Date.now()}`;
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // 1. Optimistically add message to UI
    const optimisticMessage: MessageDisplay = {
      id: tempId,
      text: text,
      timestamp: timestamp,
      sent: true,
      read: false,
      sending: true, // Show as sending
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      console.log('📤 Sending message:', text);
      
      // Update last seen to ensure we appear online
      updateLastSeen(user.id);
      
      const newMessage = await sendMessage(currentChatId, user.id, text);
      console.log('✅ Message sent:', newMessage);
      
      // 2. Update the message with real ID and remove sending state
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? {
              ...msg,
              id: newMessage.id,
              timestamp: formatTimestamp(newMessage.created_at),
              sending: false,
            }
          : msg
      ));
      
      console.log('✅ Message updated in UI');
      
      // The subscription will also receive it, but our dedup logic handles that
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message. Please check your connection.');
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, sending: false, error: true } : msg
      ));
    }
  };

  const handleUpdateProfile = async (name: string, avatar: string) => {
    if (!user) return;
    
    try {
      const updatedProfile = await updateProfile(user.id, { name, avatar });
      setUser(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Get current chat data
  const currentChat = currentChatId && currentOtherUserId 
    ? chats.find(c => c.id === currentChatId)
    : null;
  
  // If we're on the chat screen but don't have chat data yet, fetch it from the database
  const [otherUserProfile, setOtherUserProfile] = useState<Profile | null>(null);
  
  useEffect(() => {
    async function fetchOtherUserProfile() {
      if (currentScreen === 'chat' && currentOtherUserId && !currentChat) {
        console.log('🔍 Fetching other user profile for:', currentOtherUserId);
        const profile = await getUserProfile(currentOtherUserId);
        if (profile) {
          console.log('✅ Loaded other user profile:', profile.name);
          setOtherUserProfile(profile);
        }
      } else {
        setOtherUserProfile(null);
      }
    }
    
    fetchOtherUserProfile();
  }, [currentScreen, currentOtherUserId, currentChat]);
  
  // Create display object for chat - use real data if available, otherwise use fetched profile
  const chatToDisplay = currentChat || (otherUserProfile && currentChatId ? {
    id: currentChatId,
    name: otherUserProfile.name,
    avatar: otherUserProfile.avatar,
    lastMessage: '',
    timestamp: '',
    unread: 0,
    online: isUserOnline(otherUserProfile.last_seen),
    otherUserId: otherUserProfile.id,
  } : null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Toaster position="top-center" />
        <div className="w-full max-w-md mx-auto">
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-white md:relative md:inset-auto md:h-auto">
            <div className="text-gray-500 text-lg mb-2">Loading ChatNeto...</div>
            <div className="text-gray-400 text-sm">Connecting to server</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full md:max-w-md md:h-[600px] md:my-8 relative bg-white md:rounded-lg shadow-xl overflow-hidden">
        <Toaster position="top-center" />
        <div className="absolute inset-0 w-full h-full bg-white overflow-hidden md:relative md:inset-auto md:h-full">
          {/* Offline/Online Banner */}
          {!isOnline && (
            <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 z-50 text-sm md:rounded-t-lg">
              📵 No internet connection
            </div>
          )}
          
          {currentScreen === 'login' && (
            <LoginScreen
              onLogin={handleLogin}
              onSwitchToSignup={() => setCurrentScreen('signup')}
            />
          )}

          {currentScreen === 'signup' && (
            <SignupScreen
              onSignup={handleSignup}
              onSwitchToLogin={() => setCurrentScreen('login')}
              errorMessage={errorMessage}
            />
          )}

          {currentScreen === 'profile-setup' && tempSignupData && (
            <ProfileSetupScreen
              initialName={tempSignupData.name}
              onComplete={handleProfileSetup}
            />
          )}

          {currentScreen === 'chat-list' && user && (
            <ChatListScreen
              chats={chats}
              currentUser={user}
              onChatClick={handleChatClick}
              onNewChat={handleNewChat}
              onProfileClick={() => setCurrentScreen('user-profile')}
            />
          )}

          {currentScreen === 'chat' && chatToDisplay && (
            <ChatScreen
              chatName={chatToDisplay.name}
              chatAvatar={chatToDisplay.avatar}
              messages={messages}
              online={chatToDisplay.online}
              onBack={handleBackToChats}
              onSendMessage={handleSendMessage}
            />
          )}

          {currentScreen === 'contacts' && (
            <ContactsScreen
              contacts={contacts}
              onBack={handleBackToChats}
              onContactClick={handleContactClick}
            />
          )}

          {currentScreen === 'user-profile' && user && (
            <UserProfileScreen
              user={user}
              onBack={handleBackToChats}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;