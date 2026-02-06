# Database Update Instructions for Online Status

## What Changed
We've added online status tracking to your ChatNeto app. This required adding a `last_seen` field to the profiles table.

## How to Update Your Database

### Option 1: Quick Update (Recommended)
Run this SQL command in your Supabase SQL Editor:

```sql
-- Add last_seen column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

### Option 2: Full Schema Recreation
If you want to start fresh, you can:
1. Go to the Supabase SQL Editor
2. Copy the entire contents of `/lib/supabase-setup.sql`
3. Delete all existing tables first (if needed):
   ```sql
   DROP TABLE IF EXISTS contacts CASCADE;
   DROP TABLE IF EXISTS messages CASCADE;
   DROP TABLE IF EXISTS chats CASCADE;
   DROP TABLE IF EXISTS profiles CASCADE;
   ```
4. Paste and run the full schema from `supabase-setup.sql`

## What This Enables

1. **Online Status**: Users are considered "online" if they were active within the last 2 minutes
2. **Automatic Updates**: The app updates your `last_seen` timestamp every 30 seconds while you're logged in
3. **Real-time Display**: Online status is refreshed every 15 seconds in the chat list and contacts screen

## Testing

After updating the database:
1. Log in from two different browsers
2. Both users should show "online" status in the chat screen header
3. The green dot should appear next to online users in the chat list and contacts
4. If a user closes their browser/tab, they'll show as offline after 2 minutes

## Troubleshooting

If online status is not working:
- Make sure you ran the SQL update command
- Check that the `last_seen` column exists in the profiles table
- Try logging out and back in to refresh the data
- Check the browser console for any errors
