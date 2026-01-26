import { useState } from 'react';
import { Camera, User } from 'lucide-react';

interface ProfileSetupScreenProps {
  initialName: string;
  onComplete: (name: string, avatar: string) => void;
}

const avatarColors = [
  'bg-red-400',
  'bg-blue-400',
  'bg-green-400',
  'bg-yellow-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-indigo-400',
  'bg-orange-400',
];

export function ProfileSetupScreen({ initialName, onComplete }: ProfileSetupScreenProps) {
  const [name, setName] = useState(initialName);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarColors[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name, selectedAvatar);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-white overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl mb-2 font-semibold text-gray-800">Profile Setup</h1>
          <p className="text-gray-500 text-sm">
            Customize your profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 ${selectedAvatar} rounded-full mb-6 flex items-center justify-center text-white text-3xl font-semibold`}>
              {name.charAt(0).toUpperCase() || <User className="w-12 h-12" />}
            </div>
            <p className="text-sm text-gray-600 mb-3">Choose avatar color</p>
            <div className="grid grid-cols-4 gap-3 max-w-xs">
              {avatarColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedAvatar(color)}
                  className={`w-14 h-14 ${color} rounded-full shadow-sm transition-transform active:scale-95 ${
                    selectedAvatar === color ? 'ring-4 ring-blue-500 ring-offset-2 scale-110' : ''
                  }`}
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
          </div>

          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}