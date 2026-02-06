import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Info, MessageSquare } from 'lucide-react';
import { supabase, isUserOnline } from '../lib/auth';

interface PartnerProfileScreenProps {
  userId: string;
  onBack: () => void;
  onSendMessage: () => void;
}

export function PartnerProfileScreen({ userId, onBack, onSendMessage }: PartnerProfileScreenProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        if (mounted && data) {
            setProfile(data);
        }
      } catch (err: any) {
        // Suppress network/fetch errors
        const msg = err?.message || '';
        if (
            !msg.includes('fetch') && 
            !msg.includes('network') && 
            !msg.includes('aborted') &&
            err?.name !== 'TypeError'
        ) {
            console.error("Error loading partner profile:", err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProfile();
    return () => { mounted = false; };
  }, [userId]);

  const formatLastSeen = (ts: string) => {
      if (!ts) return 'Long ago';
      const date = new Date(ts);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
      
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes/60)} hours ago`;
      return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
      return (
          <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 text-gray-500">
              <p>User not found.</p>
              <button onClick={onBack} className="mt-4 text-blue-500 hover:underline">Go Back</button>
          </div>
      );
  }

  const isOnline = isUserOnline(profile.last_seen);
  
  // Default bio since we don't have it in DB yet
  const bio = "Hey there! I am using ChatNeto.";
  const email = profile.email || "Hidden"; 

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header with Back Button */}
      <div className="bg-white p-4 flex items-center gap-3 border-b border-gray-100 shadow-sm z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">User Info</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        
        {/* Banner / Avatar Area */}
        <div className="bg-white py-10 flex flex-col items-center border-b border-gray-100 mb-2">
           <div className={`w-32 h-32 ${profile.avatar?.includes('http') ? '' : (profile.avatar || 'bg-blue-400')} rounded-full flex items-center justify-center text-white text-4xl font-medium shadow-lg overflow-hidden mb-4 relative ring-4 ring-gray-50`}>
              {profile.avatar?.includes('http') ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                  <span>{(profile.name || '?').charAt(0).toUpperCase()}</span>
              )}
           </div>
           
           <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
           
           <p className={`text-sm mt-1 ${isOnline ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>
               {isOnline ? 'online' : `last seen ${formatLastSeen(profile.last_seen)}`}
           </p>
        </div>

        {/* Info List */}
        <div className="bg-white px-4 py-2 space-y-1 border-y border-gray-100">
           
           {/* Bio */}
           <div className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0">
               <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                   <Info className="w-5 h-5" />
               </div>
               <div className="flex-1">
                   <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Bio</p>
                   <p className="text-gray-900 text-sm leading-relaxed">{bio}</p>
               </div>
           </div>

           {/* Email */}
           <div className="flex items-center gap-4 p-4 border-b border-gray-50 last:border-0">
               <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                   <Mail className="w-5 h-5" />
               </div>
               <div className="flex-1">
                   <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Username</p>
                   <p className="text-gray-900 text-sm">{email}</p>
               </div>
           </div>

           {/* Send Message Action */}
           <div 
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-blue-50 transition-colors group" 
                onClick={onSendMessage}
           >
               <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                   <MessageSquare className="w-5 h-5" />
               </div>
               <div className="flex-1">
                   <p className="text-blue-600 font-medium">Send Message</p>
               </div>
           </div>
        </div>
        
      </div>
    </div>
  );
}
