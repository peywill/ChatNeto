import { Chat } from './ChatListScreen';

interface ChatListItemProps {
  chat: Chat;
  onClick: () => void;
}

export function ChatListItem({ chat, onClick }: ChatListItemProps) {
  return (
    <button
      onClick={onClick}
      title={`${chat.name} - ${chat.lastMessage}`}
      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
    >
      <div className="relative">
        <div className={`w-12 h-12 ${chat.avatar} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
          {chat.name.charAt(0).toUpperCase()}
        </div>
        {chat.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium truncate">{chat.name}</span>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{chat.timestamp}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
          {chat.unread > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}