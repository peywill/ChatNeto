import { useState, useEffect } from 'react';
import { ContactsScreenUI, Contact } from './ContactsScreenUI';
import { supabase } from '../lib/auth';
import { getOrCreateChat } from '../lib/chat';

interface ContactsScreenProps {
  onBack: () => void;
  onSelectContact: (chat: any) => void;
}

export function ContactsScreen({ onBack, onSelectContact }: ContactsScreenProps) {
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
        // In a real app, you'd fetch from a 'contacts' table, but for now getting all users is fine for testing
        const { data: profiles, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id);

        if (fetchError) throw fetchError;

        if (profiles && mounted) {
          const formattedContacts = profiles.map(p => ({
            id: p.id,
            name: p.name || 'Unknown',
            avatar: p.avatar || 'bg-gray-400',
            phone: p.email || '', // Use email as phone/handle
            email: p.email || '',
            online: false 
          }));
          setContacts(formattedContacts);
        }
      } catch (err: any) {
        console.error('Error fetching contacts:', err);
        if (mounted) setError('Failed to load contacts.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchContacts();
    return () => { mounted = false; };
  }, []);

  const handleContactClick = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use the centralized chat creation logic
      // This handles all the complexity of database columns vs tables
      const newChat = await getOrCreateChat(user.id, contactId);

      onSelectContact({
        id: newChat.id,
        participantId: contact.id,
        name: contact.name,
        avatar: contact.avatar
      });

    } catch (err: any) {
      console.error('Error creating chat:', err);
      alert(`Failed to start chat: ${err.message}`);
    }
  };

  if (loading) return <div className="h-full w-full flex items-center justify-center bg-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}<br/><button onClick={onBack} className="text-blue-500 underline mt-2">Back</button></div>;

  return <ContactsScreenUI contacts={contacts} onBack={onBack} onContactClick={handleContactClick} />;
}