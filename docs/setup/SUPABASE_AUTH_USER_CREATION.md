# How to Add Users with Passwords in Supabase Auth

This guide explains how to create users with passwords in Supabase Auth using the Supabase Dashboard.

## Method 1: Using Supabase Dashboard (Recommended)

### Step-by-Step Instructions

1. **Access Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in to your account
   - Select your project

2. **Navigate to Authentication**
   - Click on **Authentication** in the left sidebar
   - Click on **Users** in the submenu

3. **Add New User**
   - Click the **Add User** button (usually in the top right)
   - Select **Create new user** from the dropdown

4. **Fill in User Details**
   - **Email**: Enter the user's email address (e.g., `dillip.sahoo@autoomstudio.com`)
   - **Password**: Enter the password (e.g., `Dillip@ut00m`)
   - **Auto Confirm User**: ✅ **Check this box** (allows user to login immediately)
   - **Send Invitation Email**: ❌ **Uncheck this box** (since you're setting the password manually)

5. **Create User**
   - Click **Create User** button
   - The user will be created immediately with the password you specified

6. **Verify User Creation**
   - You should see the user in the users list
   - The user will have:
     - Email address
     - Status: "Confirmed" (if Auto Confirm was checked)
     - Created date
     - Last sign-in date (will be empty until first login)

## Method 2: Using Supabase Auth API (Programmatic)

### Using JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (server-side only!)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key (never expose in client!)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create user with password
async function createUser(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true, // Auto confirm email
  });

  if (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }

  console.log('User created:', data.user);
  return { success: true, user: data.user };
}

// Usage
await createUser('dillip.sahoo@autoomstudio.com', 'Dillip@ut00m');
await createUser('aditya.sahoo@autoomstudio.com', 'Aditya@ut00m');
```

### Using cURL (REST API)

```bash
curl -X POST 'https://your-project-id.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dillip.sahoo@autoomstudio.com",
    "password": "Dillip@ut00m",
    "email_confirm": true
  }'
```

## Method 3: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Create user (requires service role key)
supabase auth users create \
  --email dillip.sahoo@autoomstudio.com \
  --password Dillip@ut00m \
  --email-confirm true
```

## Important Notes

### Security Considerations

1. **Service Role Key**: 
   - The service role key has admin access to your Supabase project
   - **NEVER expose it in client-side code** (browser, React app, etc.)
   - Only use it in server-side code (Node.js, serverless functions, etc.)
   - Store it in environment variables (`.env` file)

2. **Password Requirements**:
   - Minimum length: 6 characters (Supabase default)
   - Recommended: Use strong passwords with uppercase, lowercase, numbers, and special characters
   - Example: `Dillip@ut00m` (meets requirements)

3. **Auto Confirm User**:
   - If checked: User can login immediately without email confirmation
   - If unchecked: User must confirm email before they can login
   - For admin users: Always check this (they should have immediate access)

### Password Storage

- Passwords are **automatically hashed** by Supabase using bcrypt
- Passwords are stored in Supabase's `auth.users` table (not accessible via SQL)
- You **cannot retrieve** the original password (only reset it)
- You **cannot see** the password hash in the dashboard

### User Management

#### View Users
- Go to **Authentication** > **Users** in Supabase Dashboard
- See all users with their email, status, creation date, last sign-in

#### Reset Password
1. Go to **Authentication** > **Users**
2. Click on the user
3. Click **Reset Password** button
4. Enter new password
5. User will be able to login with new password immediately

#### Delete User
1. Go to **Authentication** > **Users**
2. Click on the user
3. Click **Delete User** button
4. Confirm deletion
5. User will be removed from Supabase Auth

#### Update User Email
1. Go to **Authentication** > **Users**
2. Click on the user
3. Click **Edit** button
4. Update email address
5. Save changes

## Complete Setup for Dillip, Aditya, and Udit

### Step 1: Create Users in Supabase Auth

1. Go to **Supabase Dashboard** > **Authentication** > **Users**
2. Click **Add User** > **Create new user**

**User 1: Dillip Sahoo**
- Email: `dillip.sahoo@autoomstudio.com`
- Password: `Dillip@ut00m`
- Auto Confirm User: ✅ (checked)
- Send Invitation Email: ❌ (unchecked)

**User 2: Aditya Sahoo**
- Email: `aditya.sahoo@autoomstudio.com`
- Password: `Aditya@ut00m`
- Auto Confirm User: ✅ (checked)
- Send Invitation Email: ❌ (unchecked)

**User 3: Udit Sahoo**
- Email: `udit.sahoo@autoomstudio.com`
- Password: `Udit@ut00m`
- Auto Confirm User: ✅ (checked)
- Send Invitation Email: ❌ (unchecked)

### Step 2: Add Users to `users` Table

Run the SQL script in Supabase SQL Editor:

```sql
-- See sql/add-admin-users-dillip-aditya.sql
INSERT INTO users (email, name, role, created_at, updated_at) 
VALUES 
  (
    'dillip.sahoo@autoomstudio.com',
    'Dillip Sahoo',
    'admin',
    NOW(),
    NOW()
  ),
  (
    'aditya.sahoo@autoomstudio.com',
    'Aditya Sahoo',
    'admin',
    NOW(),
    NOW()
  ),
  (
    'udit.sahoo@autoomstudio.com',
    'Udit Sahoo',
    'admin',
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();
```

### Step 3: Verify Setup

1. **Check Supabase Auth**:
   - Go to **Authentication** > **Users**
   - Verify both users exist with status "Confirmed"

2. **Check `users` Table**:
   - Go to **Table Editor** > **users**
   - Verify both users exist with role "admin"

3. **Test Login**:
   - Go to your application login page
   - Try logging in with any of the following:
     - Email: `dillip.sahoo@autoomstudio.com` / Password: `Dillip@ut00m`
     - Email: `aditya.sahoo@autoomstudio.com` / Password: `Aditya@ut00m`
     - Email: `udit.sahoo@autoomstudio.com` / Password: `Udit@ut00m`
   - Should successfully authenticate and show admin access

## Troubleshooting

### User Cannot Login

1. **Check Email Confirmation**:
   - If user is not confirmed, they cannot login
   - Go to **Authentication** > **Users** > Click user > Check status
   - If status is "Unconfirmed", either:
     - Check "Auto Confirm User" when creating user
     - Or manually confirm the user in dashboard

2. **Check Password**:
   - Verify password is correct (case-sensitive)
   - Try resetting password in dashboard

3. **Check `users` Table**:
   - User must exist in both Supabase Auth AND `users` table
   - Verify user exists in `users` table with correct email
   - Verify user has correct role (admin)

4. **Check RLS Policies**:
   - Verify RLS policies allow users to read their own data
   - Check if admin users can access the `users` table

### Password Reset

1. **Via Dashboard**:
   - Go to **Authentication** > **Users**
   - Click on user
   - Click **Reset Password**
   - Enter new password
   - Save changes

2. **Via API**:
   ```typescript
   await supabaseAdmin.auth.admin.updateUserById(userId, {
     password: 'new_password'
   });
   ```

### User Not Found in `users` Table

- Run the SQL script to add user to `users` table
- Verify email matches exactly (case-sensitive)
- Check for typos in email address

## Best Practices

1. **Use Strong Passwords**:
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, special characters
   - Avoid common words or patterns

2. **Auto Confirm Admin Users**:
   - Admin users should have immediate access
   - Always check "Auto Confirm User" for admin users

3. **Don't Send Invitation Emails**:
   - If you're setting passwords manually, uncheck "Send Invitation Email"
   - This prevents confusion with email links

4. **Use Service Role Key Safely**:
   - Only use in server-side code
   - Never expose in client-side code
   - Store in environment variables

5. **Verify Both Tables**:
   - Always create user in both Supabase Auth AND `users` table
   - Supabase Auth: For authentication
   - `users` table: For application metadata (role, permissions)

## Related Files

- `sql/add-admin-users-dillip-aditya.sql` - SQL script to add users to `users` table
- `ADMIN_USER_SETUP.md` - Complete setup guide for admin users
- `PASSWORD_STORAGE_EXPLANATION.md` - Explanation of password storage
- `src/services/auth.ts` - Authentication service code

