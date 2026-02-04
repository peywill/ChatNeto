import { Chat } from './ChatListScreen';

interface ChatListItemProps {
  chat: Chat;
  onClick: () => void;
}

export function ChatListItem({ chat, onClick }: ChatListItemProps) {
  // Format the timestamp for the list view
  const formatListTime = (isoString: string) => {
    try {
      if (!isoString) return '';
      const date = new Date(isoString);
      const now = new Date();
      
      const isToday = date.getDate() === now.getDate() &&
                      date.getMonth() === now.getMonth() &&
                      date.getFullYear() === now.getFullYear();
      
      if (isToday) {
        // Show time for today (e.g. 10:45 PM)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.getDate() === yesterday.getDate() &&
                          date.getMonth() === yesterday.getMonth() &&
                          date.getFullYear() === yesterday.getFullYear();
                          
      if (isYesterday) {
        return 'Yesterday';
      }
      
      // Show date for older messages (e.g. 1/30/26)
      return date.toLocaleDateString();
      
    } catch (e) {
      return '';
    }
  };

  return (
    <button
      onClick={onClick}
      title={`${chat.name} - ${chat.lastMessage}`}
      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
    >
      <div className="relative">
        {/* Avatar handling: check if it's a URL or a color class */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0 overflow-hidden ${chat.avatar.startsWith('http') ? '' : chat.avatar}`}>
          {chat.avatar.startsWith('http') ? (
            <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
          ) : (
             // Fallback if avatar is just a color class
            <span className="text-lg font-medium">{chat.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        {chat.online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium truncate text-gray-900">{chat.name}</span>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {formatListTime(chat.timestamp)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 truncate pr-2">{chat.lastMessage}</p>
          {chat.unread > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center flex-shrink-0 px-1">
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
