import { Edit, User, LogOut } from 'lucide-react';
import { format } from 'date-fns';

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
  onProfileClick 
}: ChatListScreenProps) {
  
  const getAvatarText = (name: string) => {
    if (!name) return '?';
    return name.trim();
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-3 flex justify-between items-center shadow-md flex-shrink-0 z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onProfileClick}>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold border-2 border-transparent hover:border-white/50 transition-all overflow-hidden">
             {currentUser.avatar && currentUser.avatar.startsWith('bg-') ? (
                 <div className={`w-full h-full rounded-full ${currentUser.avatar} flex items-center justify-center`}>
                    <span className="text-[8px] font-medium leading-tight px-1 text-center break-words w-full">
                        {getAvatarText(currentUser.name)}
                    </span>
                 </div>
             ) : (
                 <span className="text-[8px] font-medium leading-tight px-1 text-center break-words w-full">
                    {getAvatarText(currentUser.name)}
                 </span>
             )}
          </div>
          <h1 className="text-xl font-bold truncate max-w-[150px]">{currentUser.name}</h1>
        </div>
        <button 
          onClick={onNewChat}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="New Chat"
        >
          <Edit className="w-6 h-6" />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <Edit className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500">No chats yet</p>
            <p className="text-sm mt-1">Tap the pencil icon to start messaging</p>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onChatClick(chat.id)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <div className="relative">
                <div className={`w-14 h-14 ${chat.avatar} rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden`}>
                  <span className="text-[10px] font-medium leading-tight px-1 text-center break-words w-full">
                    {getAvatarText(chat.name)}
                  </span>
                </div>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-gray-900 truncate pr-2">{chat.name}</h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {chat.timestamp && !isNaN(new Date(chat.timestamp).getTime()) 
                      ? format(new Date(chat.timestamp), 'HH:mm') 
                      : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 truncate max-w-[180px]">
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
