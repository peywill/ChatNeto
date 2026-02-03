import { useState, useEffect } from 'react';
import { ContactsScreenUI, Contact } from './ContactsScreenUI';
import { supabase, isUserOnline } from '../lib/auth';
import { getOrCreateChat } from '../lib/chat';

interface ContactsScreenProps {
  onlineUsers?: Set<string>;
  onBack: () => void;
  onSelectContact: (chat: any) => void;
}

export function ContactsScreen({ onlineUsers, onBack, onSelectContact }: ContactsScreenProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchContacts() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch all profiles except self
        const { data: profiles, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id);

        if (fetchError) throw fetchError;

        if (profiles && mounted) {
          const formattedContacts = profiles.map(p => {
             const presenceOnline = onlineUsers ? onlineUsers.has(p.id) : false;
             const dbOnline = isUserOnline(p.last_seen);
             
             return {
                id: p.id,
                name: p.name || 'Unknown',
                avatar: p.avatar || 'bg-gray-400',
                phone: p.email || '', 
                email: p.email || '',
                online: presenceOnline || dbOnline
             };
          });
          setContacts(formattedContacts);
        }
      } catch (err: any) {
        // Suppress network errors from console
        const msg = err?.message || '';
        if (
             msg.includes('fetch') || 
             msg.includes('network') || 
             msg.includes('aborted') ||
             err?.name === 'TypeError' ||
             err?.name === 'AbortError'
        ) {
            // Ignored
        } else {
            console.error('Error fetching contacts:', err);
        }
        
        if (mounted) setError('Failed to load contacts.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchContacts();
    return () => { mounted = false; };
  }, [onlineUsers]);

  const handleContactClick = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newChat = await getOrCreateChat(user.id, contactId);

      onSelectContact({
        id: newChat.id,
        participantId: contact.id,
        name: contact.name,
        avatar: contact.avatar,
        online: contact.online
      });

    } catch (err: any) {
      const msg = err?.message || '';
      const isNetwork = msg.includes('fetch') || msg.includes('network') || err?.name === 'TypeError';
      
      if (!isNetwork) {
         console.error('Error creating chat:', err);
      }
      
      if (isNetwork) {
         alert('Network connection failed. Please check your internet.');
      } else {
         alert(`Failed to start chat: ${msg || 'Unknown error'}`);
      }
    }
  };

  if (loading) return <div className="h-full w-full flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}<br/><button onClick={onBack} className="text-blue-500 underline mt-2">Back</button></div>;

  return <ContactsScreenUI contacts={contacts} onBack={onBack} onContactClick={handleContactClick} />;
}
