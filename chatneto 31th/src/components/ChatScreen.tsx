import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MoreVertical, Trash2, User } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { supabase } from '../lib/auth';
import { getChatMessages, sendMessage, subscribeToMessages, markMessagesAsRead } from '../lib/chat';

export interface Message {
  id: string;
  text: string;
  created_at: string;
  sender_id: string;
  chat_id: string;
  sent?: boolean;
  read?: boolean;
  sending?: boolean;
  error?: boolean;
}

interface ChatScreenProps {
  chatId: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantIsOnline?: boolean;
  onBack: () => void;
}

export function ChatScreen({
  chatId,
  participantId,
  participantName,
  participantAvatar,
  participantIsOnline,
  onBack,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(false);
    if (menuOpen) {
        document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // Initial load and subscription
  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function loadChat() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        if (mounted) setCurrentUserId(user.id);

        // Load existing messages
        const initialMessages = await getChatMessages(chatId);
        if (mounted) {
          setMessages(initialMessages as Message[]);
          setLoading(false);
          setTimeout(scrollToBottom, 100);
        }

        // Mark as read
        await markMessagesAsRead(chatId, user.id);

        // Subscribe to new messages
        unsubscribe = subscribeToMessages(chatId, (newMessage) => {
           if (mounted) {
             setMessages(prev => {
                if (prev.find(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage as unknown as Message];
             });
             if (newMessage.sender_id !== user.id) {
                 markMessagesAsRead(chatId, user.id);
             }
           }
        });

      } catch (err) {
        console.error("Failed to load chat", err);
        if (mounted) setLoading(false);
      }
    }

    loadChat();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUserId) return;

    const text = inputText.trim();
    setInputText(''); 

    const tempId = `temp-${Date.now()}`;
    const optimisiticMessage: Message = {
      id: tempId,
      text: text,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      chat_id: chatId,
      sending: true
    };

    setMessages(prev => [...prev, optimisiticMessage]);

    try {
      await sendMessage(chatId, currentUserId, text);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } catch (err) {
      console.error("Failed to send", err);
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, sending: false, error: true } : m
      ));
    }
  };

  const handleDeleteChat = async () => {
     if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
         // In a real app, we would call a delete API. 
         // For now, we'll just clear the local view and go back.
         // Implementing full delete requires cascading deletes in DB which is risky for a prototype.
         alert("Chat deletion would happen here.");
         onBack();
     }
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-3 flex items-center gap-3 shadow-md z-10 relative">
        <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="relative">
          <div className={`w-10 h-10 ${participantAvatar.includes('http') ? '' : 'bg-white/20'} rounded-full flex items-center justify-center text-white overflow-hidden`}>
             {participantAvatar.includes('http') ? (
                 <img src={participantAvatar} alt={participantName} className="w-full h-full object-cover" />
             ) : (
                 <span className="text-lg font-medium">{participantName.charAt(0).toUpperCase()}</span>
             )}
          </div>
          {participantIsOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-lg">{participantName}</div>
          <div className="text-xs text-blue-100">{participantIsOnline ? 'online' : 'offline'}</div>
        </div>
        
        {/* Menu Button */}
        <div className="relative">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                }}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
            
            {/* Dropdown Menu */}
            {menuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-xl py-1 text-gray-800 z-50 border border-gray-100 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button 
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        onClick={() => alert("Profile View Coming Soon")}
                    >
                        <User className="w-4 h-4 text-gray-500" />
                        <span>View Profile</span>
                    </button>
                    <button 
                        className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                        onClick={handleDeleteChat}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Chat</span>
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-2 space-y-3 bg-[#e4ebf5]">
        {loading ? (
           <div className="flex justify-center pt-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
            <div className="bg-white p-4 rounded-full mb-3 shadow-sm">
                <Send className="w-8 h-8 text-blue-400" />
            </div>
            <p>No messages yet</p>
            <p className="text-sm mt-1">Send a message to start chatting</p>
          </div>
        ) : (
          messages.map((message) => {
             const isMe = message.sender_id === currentUserId;
             return (
                <div key={message.id} className={message.sending ? "opacity-70" : ""}>
                  <MessageBubble message={{
                      id: message.id,
                      text: message.text,
                      timestamp: message.created_at,
                      sent: isMe,
                      read: message.read,
                      error: message.error
                  }} />
                </div>
             );
          })
        )}
        <div ref={messagesEndRef} />
        <div className="h-4" />
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 safe-bottom">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message"
            className="flex-1 px-5 py-3 border border-gray-200 bg-gray-50 rounded-full focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md transform active:scale-95 duration-100"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
