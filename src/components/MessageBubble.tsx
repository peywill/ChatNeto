import { Check, CheckCheck } from 'lucide-react';
import { Message } from './ChatScreen';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`px-4 py-2 rounded-2xl ${
          message.sent
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-gray-200 text-gray-900 rounded-bl-sm'
        }`}
        style={{ 
          maxWidth: '75%',
          wordBreak: 'break-word'
        }}
      >
        <p className="break-words">{message.text}</p>
        <div className={`flex items-center gap-1 justify-end mt-1 text-xs ${
          message.sent ? 'text-white/70' : 'text-gray-600'
        }`}>
          <span>{message.timestamp}</span>
          {message.sent && (
            message.read ? (
              <CheckCheck className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )
          )}
        </div>
      </div>
    </div>
  );
}