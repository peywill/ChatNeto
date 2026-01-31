import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ProfileSetupScreen } from './components/ProfileSetupScreen';
import { ChatList } from './components/ChatList';
import { ChatScreen } from './components/ChatScreen';
import { ContactsScreen } from './components/ContactsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { supabase, signOut } from './lib/auth';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'signup' | 'profile-setup' | 'chat-list' | 'chat' | 'contacts' | 'profile'>('login');
  const [activeChat, setActiveChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: If Supabase takes too long (e.g. network hang), stop loading
    const timer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Session check timed out, forcing load completion');
        setLoading(false);
      }
    }, 5000);

    // Check active session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('Error checking session:', error);
      }

      setSession(session);
      if (session) {
        // Verify if user needs profile setup or go straight to chat list
        // For now, we assume if they have a session, they go to chat list
        setCurrentScreen('chat-list');
      }
      setLoading(false);
    }).catch(err => {
      console.error('Unexpected error during session check:', err);
      if (mounted) setLoading(false);
    }).finally(() => {
      clearTimeout(timer);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      setSession(session);
      
      if (session) {
        // If we are currently on login/signup, move to chat-list
        if (currentScreen === 'login' || currentScreen === 'signup') {
          setCurrentScreen('chat-list');
        }
      } else {
        // If session is gone (logout), force back to login
        setCurrentScreen('login');
        setActiveChat(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []); // Remove dependency on currentScreen to avoid loops

  const handleLogout = async () => {
    try {
      await signOut();
      // State update handled by onAuthStateChange
    } catch (error) {
      console.error('Error signing out:', error);
      // Force local state update even if server fails
      setSession(null);
      setCurrentScreen('login');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500 text-sm">Connecting to ChatNeto...</p>
      </div>
    );
  }

  // ROUTING LOGIC

  // 1. No Session -> Login or Signup
  if (!session) {
    if (currentScreen === 'signup') {
      return (
        <SignupScreen 
          onSignup={(newSession) => {
            // Important: Set screen BEFORE session to ensure correct render path
            setCurrentScreen('profile-setup');
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

  // 2. Authenticated Routes
  if (currentScreen === 'profile-setup') {
    return <ProfileSetupScreen onComplete={() => setCurrentScreen('chat-list')} />;
  }

  if (currentScreen === 'chat' && activeChat) {
    return (
      <ChatScreen
        chatId={activeChat.id}
        participantId={activeChat.participantId}
        participantName={activeChat.name}
        participantAvatar={activeChat.avatar}
        participantIsOnline={activeChat.isOnline}
        onBack={() => {
          setActiveChat(null);
          setCurrentScreen('chat-list');
        }}
      />
    );
  }

  if (currentScreen === 'contacts') {
    return (
      <ContactsScreen
        onBack={() => setCurrentScreen('chat-list')}
        onSelectContact={(chatOrContact) => {
          // The ContactsScreen now returns a chat-ready object (with ID, participantId, etc.)
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

  // Default Authenticated View: Chat List
  return (
    <ChatList
      onSelectChat={(chat) => {
        setActiveChat(chat);
        setCurrentScreen('chat');
      }}
      onOpenContacts={() => setCurrentScreen('contacts')}
      onOpenProfile={() => setCurrentScreen('profile')}
    />
  );
}
