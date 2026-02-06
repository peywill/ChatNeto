# Realtime Not Working - Quick Fix

## The Issue
Your subscriptions are connecting (`SUBSCRIBED` status) but not receiving INSERT events. This means Realtime might not be fully enabled.

## Solution 1: Enable Realtime API (RECOMMENDED)

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **Project Settings** (gear icon in bottom left sidebar)
4. Click **API** in the left menu
5. Scroll down to find **Realtime** settings
6. Look for "Realtime API" or similar toggle
7. Make sure it's **ENABLED**
8. Save if needed

## Solution 2: Check in Database Settings

If you can't find it in API settings, try:

1. Go to **Database** → **Tables**
2. Click on the **messages** table
3. Look for any Realtime or Broadcast settings
4. Enable if available

## Solution 3: Enable via SQL (ALTERNATIVE)

Run this in Supabase SQL Editor:

```sql
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for chats table  
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
```

## Verify It Works

After enabling Realtime, test again:

1. Refresh both browsers
2. Open the chat
3. Send a message
4. You should now see `📨 Received new message via subscription` in the OTHER browser's console

## If Still Not Working

The issue might be with your Supabase plan or project. Check:
- Is your project paused? (Free tier pauses after 7 days of inactivity)
- Are you on the free tier with limits exceeded?
- Check Supabase Status: https://status.supabase.com/
