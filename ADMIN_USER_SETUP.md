# Admin User Setup Guide

This guide explains how to add admin users (Dillip Sahoo, Aditya Sahoo, and Udit Sahoo) to the system.

## Step 1: Create Users in Supabase Auth

You need to create these users in Supabase Authentication:

### Detailed Steps:

1. **Go to Supabase Dashboard**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in to your account
   - Select your project

2. **Navigate to Authentication**
   - Click on **Authentication** in the left sidebar
   - Click on **Users** in the submenu

3. **Add New User**
   - Click the **Add User** button (top right corner)
   - Select **Create new user** from the dropdown menu

4. **Fill in User Details**

   **User 1: Dillip Sahoo**
   - **Email**: `dillip.sahoo@autoomstudio.com`
   - **Password**: `Dillip@ut00m`
   - **Auto Confirm User**: ✅ **Check this box** (allows immediate login)
   - **Send Invitation Email**: ❌ **Uncheck this box** (since we're setting password manually)

   **User 2: Aditya Sahoo**
   - **Email**: `aditya.sahoo@autoomstudio.com`
   - **Password**: `Aditya@ut00m`
   - **Auto Confirm User**: ✅ **Check this box** (allows immediate login)
   - **Send Invitation Email**: ❌ **Uncheck this box** (since we're setting password manually)

   **User 3: Udit Sahoo**
   - **Email**: `udit.sahoo@autoomstudio.com`
   - **Password**: `Udit@ut00m`
   - **Auto Confirm User**: ✅ **Check this box** (allows immediate login)
   - **Send Invitation Email**: ❌ **Uncheck this box** (since we're setting password manually)

5. **Create User**
   - Click **Create User** button
   - User will be created immediately
   - Repeat for each additional user

6. **Verify User Creation**
   - All users should appear in the users list
   - Status should show "Confirmed" (if Auto Confirm was checked)
   - You should see their email addresses and creation dates

### Visual Guide:

```
Supabase Dashboard
├── Authentication
    └── Users
        └── Add User (button)
            └── Create new user
                ├── Email: dillip.sahoo@autoomstudio.com
                ├── Password: Dillip@ut00m
                ├── Auto Confirm User: ✅ (checked)
                ├── Send Invitation Email: ❌ (unchecked)
                └── Create User (button)
```

### Important Notes:

- **Passwords are automatically hashed** by Supabase (you cannot see them)
- **Auto Confirm User** must be checked for admin users (allows immediate access)
- **Send Invitation Email** should be unchecked (we're setting passwords manually)
- **Password requirements**: Minimum 6 characters (Supabase default)

For more detailed instructions and alternative methods (API, CLI), see `SUPABASE_AUTH_USER_CREATION.md`.

## Step 2: Run SQL Script in Supabase

1. Go to **SQL Editor** in your Supabase Dashboard
2. Click **New Query**
3. Copy and paste the contents of `sql/add-admin-users-dillip-aditya.sql`
4. Click **Run** to execute the script

This script will:
- Add users to the `users` table with admin role
- **Note**: Passwords are NOT stored in the `users` table - authentication is handled by Supabase Auth
- **Note**: The `users` table stores minimal user metadata (email, name, role) - no status or company columns

## Step 3: Verify Users

After running the script, verify the users were created:

```sql
SELECT 
  id,
  email,
  name,
  role,
  status,
  company,
  created_at
FROM users 
WHERE email IN ('dillip.sahoo@autoomstudio.com', 'aditya.sahoo@autoomstudio.com');
```

You should see both users with:
- `role`: 'admin'
- `email`: Their respective email addresses
- `name`: Their respective names

## Step 4: Test Login

1. Go to the application login page
2. Try logging in with any of the following credentials:
   - Email: `dillip.sahoo@autoomstudio.com` / Password: `Dillip@ut00m`
   - Email: `aditya.sahoo@autoomstudio.com` / Password: `Aditya@ut00m`
   - Email: `udit.sahoo@autoomstudio.com` / Password: `Udit@ut00m`

3. You should be able to log in and have admin access

## Notes

- The dev credentials have been updated in `src/services/auth.ts` for local testing
- The SQL script uses `ON CONFLICT` to update existing users if they already exist
- Users are created with admin role and active status by default
- Password hashes are generated using bcrypt with 12 salt rounds

## Troubleshooting

If login doesn't work:

1. **Check Supabase Auth**: Verify users exist in Authentication > Users
2. **Check users table**: Verify users exist in the `users` table with correct role
3. **Check RLS policies**: Ensure RLS policies allow users to read their own data
4. **Check email confirmation**: Ensure users are auto-confirmed in Supabase Auth
5. **Check password**: Verify the password is correct (case-sensitive)

## Security Notes

- **Passwords are stored in Supabase Auth's `auth.users` table** (managed by Supabase, not accessible via SQL)
- **The `users` table only stores metadata** (role, name, email) - NO passwords
- Users must be created in both:
  1. **Supabase Auth** (for password storage and authentication)
  2. **`users` table** (for role and metadata)
- Admin role grants full access to the system
- Passwords are automatically hashed by Supabase using bcrypt
- The `auth.users` table is read-only via SQL (managed by Supabase Dashboard or Auth API)

## Where Are Passwords Stored?

- **Admin Users**: Passwords are stored in Supabase Auth's built-in `auth.users` table
  - Created via: Supabase Dashboard > Authentication > Users
  - Managed by: Supabase Auth API
  - Password hashing: Bcrypt (automatic)
  - Access: Via Supabase Dashboard or Auth API only (not via SQL)

- **Candidates**: Passwords are stored in `candidates.password_hash` column
  - Created via: SQL function or admin interface
  - Managed by: Custom authentication system
  - Password hashing: Base64 with salt (custom implementation)
  - Access: Via SQL or application code

For more details, see `PASSWORD_STORAGE_EXPLANATION.md`.

