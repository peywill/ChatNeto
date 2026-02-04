import { useState, useEffect } from 'react';
import { supabase } from './auth';

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 1. Get current user
    let myUserId: string | null = null;
    let channel: any = null;

    const setupPresence = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        myUserId = user.id;

        // 2. Create a presence channel
        channel = supabase.channel('online-users', {
          config: {
            presence: {
              key: user.id,
            },
          },
        });

        // 3. Listen for sync events
        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const userIds = new Set<string>();
            
            // State object keys are the presence keys (user IDs in our case)
            Object.keys(state).forEach(key => {
              userIds.add(key);
            });
            
            setOnlineUsers(userIds);
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
              try {
                await channel.track({
                  online_at: new Date().toISOString(),
                });
              } catch (e: any) {
                // Suppress track errors (often network related)
                const msg = e?.message || '';
                if (
                    !msg.includes('fetch') && 
                    !msg.includes('network') &&
                    e?.name !== 'TypeError'
                ) {
                    console.warn('Presence track error:', e);
                }
              }
            }
          });
      } catch (err) {
        // Ignore setup errors
      }
    };

    setupPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return onlineUsers;
}
