import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sent: boolean;
  read?: boolean;
  sending?: boolean;
  error?: boolean;
}

interface ChatScreenProps {
  chatName: string;
  chatAvatar: string;
  messages: Message[];
  online?: boolean;
  onBack: () => void;
  onSendMessage: (text: string) => void;
}

export function ChatScreen({
  chatName,
  chatAvatar,
  messages,
  online,
  onBack,
  onSendMessage,
}: ChatScreenProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-3 flex items-center gap-3">
        <button onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="relative">
          <div className={`w-10 h-10 ${chatAvatar} rounded-full flex items-center justify-center text-white`}>
            {chatName.charAt(0).toUpperCase()}
          </div>
          {online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{chatName}</div>
          <div className="text-xs text-white/80">{online ? 'online' : 'offline'}</div>
        </div>
        <button>
          <MoreVertical className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-2 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={message.sending ? "opacity-70" : ""}>
              <MessageBubble message={message} />
              {message.error && (
                <div className="text-xs text-red-500 text-right px-2">Failed to send</div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        {/* Extra space at bottom so last message isn't hidden behind input */}
        <div className="h-24" />
      </div>

      {/* Input Bar - Fixed at bottom with safe area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 pb-20 safe-bottom">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Message"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}