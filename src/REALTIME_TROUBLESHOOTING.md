# Real-time Messaging Troubleshooting Guide

## Step 1: Enable Realtime in Supabase

**CRITICAL**: Supabase Realtime must be enabled for your database tables.

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Find the `messages` table in the list
4. Make sure **Realtime** is **ENABLED** (toggle should be ON/green)
5. Also enable Realtime for the `chats` table
6. Click **Save** if you made any changes

**If Realtime was disabled, this is likely the cause of your issue!**

## Step 2: Check Browser Console Logs

With the detailed logging I just added, you should see these logs when testing:

### When opening a chat:
```
🔔 Setting up message subscription for chat: [chat-id]
🔔 Subscription status: SUBSCRIBED
```

### When sending a message (Sender's browser):
```
📤 Sending message: [your message]
✅ Message sent: [message object]
✅ Message added to UI
📨 Received new message via subscription: [message object]
📨 Current user ID: [your user id]
📨 Message sender ID: [your user id]
📨 Is this my message? true
📨 Current messages count: [number]
⏭️ Message already exists (ID: [message-id]), skipping
```

### When receiving a message (Receiver's browser):
```
📨 Received new message via subscription: [message object]
📨 Current user ID: [receiver user id]
📨 Message sender ID: [sender user id]
📨 Is this my message? false
📨 Current messages count: [number]
✅ Adding new message to UI (ID: [message-id])
✅ Message display object: [object]
```

## Step 3: Common Issues and Solutions

### Issue: No subscription logs at all
**Cause**: Realtime is not enabled
**Solution**: Follow Step 1 above

### Issue: Subscription status shows "CHANNEL_ERROR" or "TIMED_OUT"
**Cause**: Realtime connection failed
**Solutions**:
- Check your Supabase project status (make sure it's not paused)
- Verify your internet connection
- Try refreshing the page
- Check Supabase status page: https://status.supabase.com/

### Issue: Message sends but receiver never gets subscription event
**Causes**:
1. Receiver's subscription not set up (both users must have the chat open)
2. Realtime not enabled for messages table
3. Database RLS policies blocking the message

**Solutions**:
- Make sure both users have the chat screen open
- Enable Realtime (Step 1)
- Check RLS policies in Supabase

### Issue: Sender sees only 3 messages then stops
**Cause**: This was likely caused by the duplicate detection logic
**Solution**: The enhanced logging will help us identify the exact issue

## Step 4: Test Real-time Manually

You can test if Realtime is working by running this in your browser console while on the chat screen:

```javascript
// This should show the active Realtime channels
console.log(window.supabase?.getChannels?.());
```

## Step 5: Verify RLS Policies

Run this SQL query in Supabase SQL Editor to verify the messages policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

You should see policies allowing:
- SELECT for users in the chat
- INSERT for users in the chat

## Step 6: Test with Console Open

1. Open browser 1 and login as User A
2. Open browser 2 and login as User B  
3. Open Developer Console (F12) in BOTH browsers
4. User A opens chat with User B
5. User B opens chat with User A
6. User A sends a message
7. Check console logs in BOTH browsers
8. Send screenshots of the console logs if issues persist

## What to Look For

✅ **Working Correctly**:
- Subscription status: "SUBSCRIBED" in both browsers
- Sender sees message immediately (optimistic update)
- Receiver sees "📨 Received new message via subscription" log
- Message appears in receiver's UI

❌ **Not Working**:
- No subscription logs
- Subscription status: "CHANNEL_ERROR" 
- Receiver doesn't see "📨 Received new message" log
- Messages only appear after page refresh
