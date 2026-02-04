import { useState, useEffect } from 'react';
import { UserProfileScreen } from './UserProfileScreen';
import { supabase, updateProfile } from '../lib/auth';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export function ProfileScreen({ onBack, onLogout }: ProfileScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
            
          setUser({
            name: profile?.name || authUser.email?.split('@')[0],
            email: authUser.email,
            avatar: profile?.avatar || 'bg-blue-400'
          });
        }
      } catch (error) {
        console.error("Error loading profile", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleUpdate = async (name: string, avatar: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await updateProfile(authUser.id, { name, avatar });
        setUser({ ...user, name, avatar });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <UserProfileScreen
      user={user}
      onBack={onBack}
      onUpdateProfile={handleUpdate}
      onLogout={onLogout}
    />
  );
}