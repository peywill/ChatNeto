# ChatNeto Project Context

## Overview
ChatNeto is a Telegram-style mobile chat application built with React, Tailwind CSS, and Supabase. It focuses on speed, simplicity, and a minimalist design (flat, light colors).

## Tech Stack
- **Frontend:** React, Tailwind CSS v4, Lucide React (icons)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Hosting:** Cloudflare Pages
- **Repository:** peywill/ChatNeto

## Critical Configuration

### Authentication
- **Method:** Email/Password (No phone number)
- **Email Verification:** **DISABLED** in Supabase Dashboard.
  - *Logic:* The app is coded to expect immediate login upon signup.
  - *Code:* `LoginScreen.tsx` and `SignupScreen.tsx` have been modified to ignore "email not verified" errors and treat successful signups as active sessions.
  - *Logout:* `App.tsx` handles logout by forcibly clearing `localStorage` and resetting state to prevent session crossover between users.

### Database Schema (Supabase)
The app relies on the following tables:
1. **profiles**
   - `id` (uuid, PK, references auth.users)
   - `email` (text)
   - `name` (text)
   - `avatar` (text, stores class names like 'bg-red-400')
   - `last_seen` (timestamp)
   - `bio` (text)

2. **contacts**
   - `id` (uuid, PK)
   - `owner_id` (uuid, references profiles.id)
   - `contact_id` (uuid, references profiles.id)
   - `created_at` (timestamp)

3. **chats**
   - `id` (uuid, PK)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

4. **chat_participants**
   - `chat_id` (uuid, references chats.id)
   - `user_id` (uuid, references profiles.id)

5. **messages**
   - `id` (uuid, PK)
   - `chat_id` (uuid, references chats.id)
   - `sender_id` (uuid, references profiles.id)
   - `text` (text)
   - `created_at` (timestamp)
   - `read` (boolean, default false)

## Current Application State

### 1. Navigation Flow
- **App.tsx** acts as the router.
- **Logic:** `Session Check` -> `Login/Signup` -> `Profile Setup` (if new) -> `Chat List`.
- **State Management:** Uses React `useState` and `useEffect` with `useRef` guards (`isMounted`) to prevent memory leaks during async operations.

### 2. Key Components
- **Login/Signup:** Optimized for speed. Timeout protection added (8s) to prevent infinite hanging.
- **ChatList:** Fetches user's chats, partners, and last messages. Auto-refreshes every 5s.
- **ChatScreen:** Real-time messaging using Supabase subscriptions.
- **ContactsScreen:** specific logic to find users by exact email match.

### 3. Recent Fixes (Do Not Revert)
- **Infinite Loading:** Added timeout logic to all auth calls. If Supabase hangs, the app forces a UI update.
- **Session Conflict:** Logout now executes `localStorage.clear()` to ensure one user's session doesn't bleed into another's on shared devices/browsers.
- **Identity:** `ChatList` strictly filters `chat_participants` to ensure the "partner" is never the current user.

## Instructions for New Assistant
1. **Do not enable email verification.** The user wants a frictionless flow.
2. **Respect the folder structure.** All components are in `/components`, auth logic in `/lib/auth.ts`.
3. **Images:** Use `figma:asset` imports or standard generic avatars (Tailwind colors).
4. **Icons:** Use `lucide-react`.

## Deployment
- Connected to GitHub. Updates are pushed automatically to Cloudflare Pages.
