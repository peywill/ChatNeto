import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { updateProfile, supabase } from '../lib/auth';

interface ProfileSetupScreenProps {
  initialName?: string;
  userId?: string;
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

export function ProfileSetupScreen({ initialName = '', userId: propUserId, onComplete }: ProfileSetupScreenProps) {
  const [name, setName] = useState(initialName);
  const [selectedAvatar, setSelectedAvatar] = useState(avatarColors[0]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    const loadUserData = async () => {
      let currentUserId = userId;
      
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted.current) {
          setUserId(user.id);
          currentUserId = user.id;
        }
      }

      if (currentUserId) {
        try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUserId)
              .single();
              
            if (profile && isMounted.current) {
              if (profile.name && !name) setName(profile.name);
              if (profile.avatar) setSelectedAvatar(profile.avatar);
            }
        } catch (e: any) {
            if (!e?.message?.includes('fetch')) {
                console.error("Error loading user data for setup:", e);
            }
        }
      }
    };

    loadUserData();
    
    return () => { isMounted.current = false; };
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && userId) {
      setLoading(true);
      try {
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
      } catch (error: any) {
        if (!error?.message?.includes('fetch') && !error?.message?.includes('timed out')) {
            console.error('Error updating profile:', error);
        }
        if (isMounted.current) {
           onComplete();
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    } else if (!userId) {
       onComplete(); 
    }
  };

  const getAvatarText = (n: string) => {
     if (!n) return '';
     return n.trim();
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
            <div className={`w-24 h-24 ${selectedAvatar} rounded-full mb-6 flex items-center justify-center text-white text-3xl font-semibold overflow-hidden`}>
              {name ? (
                  <span className="text-sm text-center px-2 break-words leading-tight">
                    {getAvatarText(name)}
                  </span>
              ) : (
                  <User className="w-12 h-12" />
              )}
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
