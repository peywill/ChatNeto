import { Search, Edit, Menu } from 'lucide-react';
import { ChatListItem } from './ChatListItem';
import { useState } from 'react';
import { ChatNetoLogo } from './ChatNetoLogo';

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online?: boolean;
}

interface ChatListScreenProps {
  chats: Chat[];
  currentUser: { name: string; avatar: string };
  onChatClick: (chatId: string) => void;
  onNewChat: () => void;
  onProfileClick: () => void;
}

export function ChatListScreen({
  chats,
  currentUser,
  onChatClick,
  onNewChat,
  onProfileClick,
}: ChatListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onProfileClick} className="p-1 hover:bg-white/20 rounded transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <ChatNetoLogo className="w-7 h-7" />
            <h1 className="text-xl font-semibold">ChatNeto</h1>
          </div>
          <button 
            onClick={onNewChat} 
            title="New Chat"
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Edit className="w-6 h-6" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/20 text-white placeholder-white/70 focus:outline-none focus:bg-white/30"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>{searchQuery ? 'No chats found' : 'No chats yet'}</p>
            {!searchQuery && (
              <button
                onClick={onNewChat}
                className="mt-4 text-blue-500 hover:underline"
              >
                Start a new chat
              </button>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              onClick={() => onChatClick(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}