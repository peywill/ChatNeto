// Type definitions for Supabase tables

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  bio?: string;
  last_seen?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Chat {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message?: string;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  read: boolean;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  created_at?: string;
}