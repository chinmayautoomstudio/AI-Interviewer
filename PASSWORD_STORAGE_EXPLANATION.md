# Password Storage Explanation

## Overview

This application uses **two different authentication systems** depending on the user type:

1. **Admin Users** (HR Managers, Recruiters, Admins) - Use **Supabase Auth**
2. **Candidates** - Use **Custom Authentication** with passwords stored in `candidates` table

---

## 1. Admin Users (Dillip, Aditya, etc.)

### Where Passwords Are Stored

**Passwords are stored in Supabase Auth's built-in `auth.users` table**, NOT in the custom `users` table.

### How It Works

1. **Password Storage**:
   - When you create a user in Supabase Dashboard (Authentication > Users), Supabase stores the password in its secure `auth.users` table
   - Passwords are automatically hashed using bcrypt by Supabase
   - This table is managed by Supabase and is not directly accessible via SQL

2. **Authentication Flow**:
   ```typescript
   // In src/services/auth.ts
   // Step 1: Authenticate with Supabase Auth
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password,
   });
   
   // Step 2: After successful auth, get user metadata from custom 'users' table
   const { data: adminUser } = await supabase
     .from('users')
     .select('*')
     .eq('email', email)
     .single();
   ```

3. **Database Structure**:
   - **`auth.users`** (Supabase managed): Stores passwords, email, encrypted credentials
   - **`users`** (Custom table): Stores metadata (role, name, email, created_at, last_login)

### Why Two Tables?

- **`auth.users`**: Handles authentication, password storage, session management
- **`users`**: Stores application-specific data (roles, permissions, profile info)

### How to Manage Admin User Passwords

1. **Create User**:
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Add User" > "Create new user"
   - Enter email and password
   - Supabase automatically hashes and stores the password

2. **Reset Password**:
   - Use Supabase Dashboard > Authentication > Users
   - Click on user > "Reset Password"
   - Or use Supabase Auth API: `supabase.auth.admin.updateUserById()`

3. **View Users**:
   - Supabase Dashboard > Authentication > Users
   - See all users with their email, creation date, last sign-in, etc.
   - **Note**: You cannot see passwords (they're hashed)

---

## 2. Candidates

### Where Passwords Are Stored

**Passwords are stored in the `candidates` table as `password_hash`**.

### How It Works

1. **Password Storage**:
   - Passwords are hashed and stored in the `candidates.password_hash` column
   - Uses base64 encoding with a salt (see `src/services/candidateAuth.ts`)

2. **Authentication Flow**:
   ```typescript
   // In src/services/candidateAuth.ts
   // Step 1: Find candidate by username
   const { data: candidate } = await supabase
     .from('candidates')
     .select('*')
     .eq('username', username)
     .single();
   
   // Step 2: Verify password hash
   if (!this.verifyPassword(password, candidate.password_hash)) {
     return { error: 'Invalid password' };
   }
   ```

3. **Database Structure**:
   - **`candidates` table**: Stores candidate data including `password_hash`, `username`, etc.

### How to Manage Candidate Passwords

1. **Generate Credentials**:
   - Use SQL function: `generate_candidate_credentials(candidate_id)`
   - Or use the admin interface to generate credentials
   - This creates a username and password for the candidate

2. **Reset Password**:
   - Update `candidates.password_hash` column directly
   - Or regenerate credentials using the SQL function

---

## Summary

| User Type | Password Storage | Authentication Method | Management |
|-----------|-----------------|----------------------|------------|
| **Admin Users** | `auth.users` (Supabase Auth) | Supabase Auth API | Supabase Dashboard |
| **Candidates** | `candidates.password_hash` | Custom authentication | SQL or Admin Interface |

---

## Important Notes

1. **Security**:
   - Admin user passwords are managed by Supabase (industry-standard security)
   - Candidate passwords are hashed but use a simpler method (base64 with salt)
   - For production, consider migrating candidates to Supabase Auth as well

2. **Password Hashing**:
   - **Admin users**: Bcrypt (handled by Supabase Auth)
   - **Candidates**: Base64 encoding with salt (custom implementation)

3. **Access**:
   - `auth.users` table is **read-only** via SQL (managed by Supabase)
   - `users` table is **custom** and can be modified via SQL
   - `candidates` table is **custom** and can be modified via SQL

4. **For Dillip and Aditya**:
   - Their passwords (`Dillip@ut00m`, `Aditya@ut00m`) are stored in **Supabase Auth**
   - Create them in: **Supabase Dashboard > Authentication > Users**
   - The `users` table only stores their role and metadata (no password)

---

## Related Files

- `src/services/auth.ts` - Admin authentication (uses Supabase Auth)
- `src/services/candidateAuth.ts` - Candidate authentication (custom)
- `sql/add-admin-users-dillip-aditya.sql` - Adds users to `users` table (metadata only)
- `ADMIN_USER_SETUP.md` - Setup instructions for admin users

