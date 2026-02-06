import { Check, CheckCheck } from 'lucide-react';

// Define a local interface compatible with the structure passed from ChatScreen
// We can also import it if exported, but local definition avoids circular dependencies if not careful
export interface MessageBubbleProps {
  message: {
    id: string;
    text: string;
    timestamp: string;
    sent?: boolean;
    read?: boolean;
    error?: boolean;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // Format timestamp to HH:MM
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative px-4 py-2 rounded-2xl shadow-sm ${
          message.sent
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-white text-gray-900 rounded-bl-none border border-gray-100'
        }`}
        style={{ 
          maxWidth: '75%',
          minWidth: '60px', // Ensure bubble isn't too tiny
          wordBreak: 'break-word'
        }}
      >
        <p className="break-words mb-3 text-[15px] leading-snug">{message.text}</p>
        
        {/* Timestamp and Status footer */}
        <div className={`absolute bottom-1 right-2 flex items-center gap-0.5 text-[10px] ${
          message.sent ? 'text-blue-100' : 'text-gray-400'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          {message.sent && (
            <span className="ml-0.5">
              {message.read ? (
                <CheckCheck className="w-3.5 h-3.5 opacity-90" />
              ) : (
                <Check className="w-3.5 h-3.5 opacity-90" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
