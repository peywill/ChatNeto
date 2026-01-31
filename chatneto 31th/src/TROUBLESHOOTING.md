# ChatNeto - Troubleshooting Guide

## Problem: "Email not confirmed" or Signup Not Working

### Solution: Disable Email Confirmation in Supabase

**Follow these exact steps:**

1. Open your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **ChatNeto project**
3. Click **Authentication** in the left sidebar
4. Under the **Configuration** section, click **Providers**
5. Scroll down and find **Email** in the list
6. Click on **Email** to expand it
7. Find the toggle/switch labeled **"Confirm email"** or **"Enable email confirmations"**
8. **Turn it OFF** (switch should be gray/disabled)
9. Click **Save** button at the bottom
10. **Important:** Scroll down and make sure it actually saved!

---

## Problem: Profiles showing "-" in Supabase Dashboard OR SQL Error

### Solution: Fix Row Level Security (RLS) Policies

**Go to SQL Editor in Supabase and run this CORRECTED code (NO ERRORS):**

```sql
-- Drop old policies only if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;
  DROP POLICY IF EXISTS "Allow anon and auth to insert profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
END $$;

-- Create new policies
CREATE POLICY "Allow anon and auth to insert profiles"
ON profiles FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

**This will show "Success. No rows returned" - that's CORRECT!** ✅

---

## Problem: "Duplicate key value violates unique constraint"

**This is NOW FIXED!** The app now checks if a profile exists and updates it instead of trying to create a duplicate.

Just create a new account and it will work! ✅

---

## How to Test After Fixing

1. **Use a FRESH email** you haven't tried before (e.g., `newtest@gmail.com`)
2. Go to your preview link
3. Click "Create Account"
4. Fill in:
   - Full name: Any name
   - Email: A new email
   - Password: At least 6 characters
5. Click "Create Account"
6. Choose an avatar color
7. Click "Continue"
8. **You should now see the Chat List screen!**

---

## How to Chat with Someone

1. **Open TWO browsers:**
   - Browser 1: Normal window (User A)
   - Browser 2: Incognito/Private window (User B)
   
2. **Create TWO accounts:**
   - User A: `user1@test.com`
   - User B: `user2@test.com`

3. **In User A's browser:**
   - Click the **pencil icon** (top right)
   - You'll see User B in the contacts list
   - Click on User B
   - Start chatting!

4. **The pencil icon is here:**
   ```
   [Menu]  ChatNeto  [✏️ Pencil]
   ```
   It's in the top-right corner of the blue header

---

## Common Issues

### Issue: "Failed to create profile"
- **Fix:** Run the SQL code above to fix RLS policies

### Issue: Loading forever after signup
- **Fix:** Disable email confirmation (see top of this guide)

### Issue: Can't delete old test users
- **Fix:** This is normal - just create new accounts with different emails

### Issue: Error messages not showing
- **Fix:** The app now shows errors ON SCREEN in red boxes

---

## Still Not Working?

If you still have issues:

1. **Check Supabase Project Settings:**
   - Make sure your project is not paused
   - Check that you copied the correct API keys

2. **Try a completely different email domain:**
   - Instead of Gmail, try: Outlook, Yahoo, or a custom domain

3. **Clear browser cache and try again**

---

## Expected Behavior

✅ **Signup should:**
- Take 2-3 seconds
- Show "Creating account..." button text
- Automatically go to chat list screen
- NO email confirmation needed

✅ **Chat List should:**
- Show empty state: "No chats yet"
- Have "Start a new chat" button
- Have pencil icon in top right
- Have menu icon in top left

✅ **Contacts should:**
- Show all other users in the system
- Let you click to start a chat
- Show their names and avatar colors

---

Last updated: After fixing RLS policies and adding visual error messages