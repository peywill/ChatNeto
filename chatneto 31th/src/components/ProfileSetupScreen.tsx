import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { updateProfile, supabase } from '../lib/auth';

interface ProfileSetupScreenProps {
  initialName?: string;
  onComplete: () => void;
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

export function ProfileSetupScreen({ initialName = '', onComplete }: ProfileSetupScreenProps) {
  const [name, setName] = useState(initialName);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarColors[0]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && isMounted.current) {
        setUserId(user.id);
      }
    });
    
    return () => { isMounted.current = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && userId) {
      setLoading(true);
      try {
        // Safety timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timed out.')), 8000)
        );

        await Promise.race([
          updateProfile(userId, {
            name: name,
            avatar: selectedAvatar
          }),
          timeoutPromise
        ]);
        
        if (isMounted.current) {
           onComplete();
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        // Even if it fails, let them proceed, don't block them forever
        if (isMounted.current) {
           onComplete();
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    } else if (!userId) {
       console.error("No user ID found");
       onComplete(); // Escape hatch
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-y-auto">
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
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
