import { ArrowLeft, Search } from 'lucide-react';
import { useState } from 'react';

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  online?: boolean;
}

interface ContactsScreenUIProps {
  contacts: Contact[];
  onBack: () => void;
  onContactClick: (contactId: string) => void;
}

export function ContactsScreenUI({ contacts, onBack, onContactClick }: ContactsScreenUIProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-blue-500 text-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">New Chat</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/20 text-white placeholder-white/70 focus:outline-none focus:bg-white/30"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p>{searchQuery ? 'No contacts found' : 'No contacts yet'}</p>
            {searchQuery && (
              <p className="text-sm mt-2">Try searching with a different name or email</p>
            )}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => onContactClick(contact.id)}
              title={`${contact.name} - ${contact.email}`}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
            >
              <div className="relative">
                <div className={`w-12 h-12 ${contact.avatar} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium truncate">{contact.name}</div>
                <div className="text-sm text-gray-500 truncate">{contact.email}</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}