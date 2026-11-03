# Activate Luma authentication

The sign-in, sign-up, confirmation, password-reset and sign-out flows use Supabase Auth. Without public project settings the forms show a setup notice and cannot submit. There is no fake login.

## 1. Create a project

1. Open https://supabase.com/dashboard and create your account.
2. Choose New project, select your organization, name it `luma`, and choose a region near your users.
3. Create and privately save a strong database password. Do not put it in frontend code or send it in chat.
4. Wait until the project is ready.

## 2. Connect the website

1. From the project Connect dialog or Settings, find the Project URL and **publishable** API key (`sb_publishable_...`).
2. In this `frontend` folder, copy `.env.example` to `.env.local`.
3. Replace both placeholder values with your project settings:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
   ```

4. Never put `sb_secret_...`, a service-role key, database password, or an AI API key in a `VITE_` variable. Vite exposes these variables to the browser.
5. Stop your running development server using Ctrl+C in its terminal. Start it again with `npm run dev` from this frontend folder. Open the URL it prints.

## 3. Configure email and redirects

1. Under Authentication → URL Configuration set Site URL to `http://localhost:5173`.
2. Add `http://localhost:5173/` to allowed Redirect URLs. If the development server uses a different port, use that exact origin in both places.
3. In Authentication → Sign In / Providers, enable email/password sign-in and keep email confirmation enabled.
4. Configure a password minimum of at least 8 characters (match or strengthen the UI requirement).
5. Supabase's default email service is limited and may only deliver to authorized team addresses. For real users, configure custom SMTP under Authentication before testing public signup. Do not disable email confirmation merely to work around email delivery.
6. When deploying, replace the Site URL with your HTTPS website URL, add its exact redirect URL, and configure the two public environment variables in the hosting platform. Rebuild the frontend.

## 4. Verify with your own test account

1. Open the website while signed out: the workspace should be hidden.
2. Select Create an account, enter your email and a password, then confirm the password.
3. Check the confirmation email (including spam), open the link, and verify that your workspace appears.
4. Refresh: the session should persist. The documents are still local preview data and reset on refresh.
5. Sign out: the workspace should disappear. Try signing in with a wrong password, then with the correct password.
6. Sign out and select Forgot password. Request a link, open the newest email link, enter a new password twice, and save it.
7. Sign out and verify the new password works and the old password fails. An expired link should let you request a new one.
8. Repeat in another browser/account to verify sign-out/account changes clear in-memory documents and conversations. Do not paste real private documents yet.

## What this milestone does and what comes next

Supabase manages users, password verification, confirmation emails, session persistence/refresh and reset links. The frontend hides the workspace unless a session is available. Sign-out affects this browser.

This is not server authorization for documents. No private storage or document API is connected yet. The next milestone must verify the signed-in user's token on the backend and enforce ownership with Row Level Security in Postgres and Storage. Never trust a user ID supplied by the browser. Documents and conversations currently exist only in memory.

Before public release: configure SMTP, production redirect URLs, rate limits/CAPTCHA appropriate to usage, and verify two-account isolation after storage is implemented.

Official references:
- https://supabase.com/docs/guides/auth/quickstarts/react
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/auth/auth-smtp
