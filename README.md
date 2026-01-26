# ChatNeto 💬

A real-time chat application built with React, Tailwind CSS, and Supabase. Clean Telegram-style design with full authentication and real-time messaging.

## Features

- 🔐 **Email/Password Authentication** - Secure user signup and login
- 💬 **Real-time Messaging** - Instant message delivery with Supabase real-time
- 👥 **Contacts & User Search** - Find and chat with other users
- 🎨 **Custom Avatars** - Choose from colorful avatar options
- 📱 **Mobile-First Design** - Optimized for mobile devices
- ✨ **Clean UI** - Telegram-inspired minimalist interface
- 💾 **Persistent Data** - All messages and chats saved in Supabase
- 🔄 **Auto-Login** - Sessions persist across browser refreshes

## Tech Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 16+ installed
- A Supabase account (free tier works great!)

### 1. Clone & Install

\`\`\`bash
# Install dependencies
npm install
\`\`\`

### 2. Set Up Supabase

See [SUPABASE_SETUP_INSTRUCTIONS.md](./SUPABASE_SETUP_INSTRUCTIONS.md) for detailed setup steps.

**Quick version:**
1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from `/lib/supabase-setup.sql` in Supabase SQL Editor
3. Copy your Project URL and anon key from Project Settings → API
4. Create `.env` file with your credentials (see below)

### 3. Environment Variables

Create a `.env` file in the root directory:

\`\`\`env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 4. Run Locally

\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:5173 in your browser.

## Deployment to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

### Manual Deploy

1. **Install Vercel CLI**
   \`\`\`bash
   npm install -g vercel
   \`\`\`

2. **Deploy**
   \`\`\`bash
   vercel
   \`\`\`

3. **Add Environment Variables**
   
   In your Vercel project dashboard:
   - Go to **Settings** → **Environment Variables**
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

4. **Redeploy**
   \`\`\`bash
   vercel --prod
   \`\`\`

## Project Structure

\`\`\`
/
├── components/           # React components
│   ├── ChatListScreen.tsx    # Main chat list
│   ├── ChatScreen.tsx        # Individual chat view
│   ├── LoginScreen.tsx       # Login page
│   ├── SignupScreen.tsx      # Signup page
│   ├── ProfileSetupScreen.tsx # Avatar selection
│   ├── ContactsScreen.tsx    # User contacts/search
│   └── UserProfileScreen.tsx # User profile & settings
├── lib/                  # Utilities and services
│   ├── supabase.ts           # Supabase client & types
│   ├── auth.ts               # Authentication functions
│   ├── chat.ts               # Chat & messaging functions
│   └── supabase-setup.sql    # Database schema
├── styles/
│   └── globals.css           # Global styles
├── App.tsx               # Main app component
└── .env                  # Environment variables (not in git)
\`\`\`

## Database Schema

The app uses 4 main tables in Supabase:

- **profiles** - User information (extends auth.users)
- **chats** - One-to-one conversation rooms
- **messages** - Individual chat messages
- **contacts** - User contact lists

All tables have Row Level Security (RLS) enabled for data protection.

## Features in Detail

### Authentication
- Sign up with email, password, and name
- Custom avatar color selection
- Automatic profile creation
- Session persistence

### Messaging
- Real-time message delivery
- Message timestamps
- Read receipts (UI ready)
- Chat history

### Contacts
- Search users by name or email
- View all registered users
- Start new conversations

### Profile
- Edit name and avatar
- View email
- Logout functionality

## Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own chats
- ✅ Secure authentication with Supabase Auth
- ✅ Environment variables for credentials
- ✅ SQL injection protection

## Testing

1. **Create two test accounts** (use incognito for the second)
2. **Search for users** in the contacts screen
3. **Start a chat** by clicking on a contact
4. **Send messages** back and forth
5. **Test real-time** by keeping both accounts open

## Customization

### Change Colors
Edit `/styles/globals.css` to customize the color scheme.

### Add Features
- Online status indicators
- Typing indicators
- Message reactions
- File/image sharing
- Group chats
- Push notifications

## Troubleshooting

**Messages not appearing?**
- Check browser console for errors
- Verify Supabase credentials in `.env`
- Check Supabase dashboard for database errors

**Can't sign up?**
- Make sure SQL schema was run successfully
- Check that RLS policies are enabled
- Verify email is unique

**Real-time not working?**
- Check Supabase project status
- Verify internet connection
- Check browser console for WebSocket errors

## License

MIT

## Support

For issues or questions:
1. Check [SUPABASE_SETUP_INSTRUCTIONS.md](./SUPABASE_SETUP_INSTRUCTIONS.md)
2. Review Supabase dashboard for database errors
3. Check browser console for client-side errors

---

Built with ❤️ using React, Tailwind CSS, and Supabase
