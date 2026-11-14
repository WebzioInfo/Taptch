# Google OAuth 2.0 Production Setup Guide for Taptch

This guide explains how to properly configure Google OAuth 2.0 for Taptch to prevent authorization errors such as `Error 401: invalid_client` ("The OAuth client was not found").

---

## 1. Google Cloud Console Configuration

### Step 1: Create or Select a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top navigation bar, select your organization or click the project dropdown.
3. Click **New Project**, name it `Taptch Production` (or `Taptch Local`), and click **Create**.

### Step 2: Configure the OAuth Consent Screen
1. In the left sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **User Type**:
   - Choose **External** (allows any Google account to sign in).
   - Click **Create**.
3. Fill in **App Information**:
   - **App name**: `Taptch`
   - **User support email**: Your support or admin email (e.g., `support@taptch.com`).
   - **App logo**: Optional (can upload `frontend/public/avatar.svg` or Taptch brand logo).
   - **Application home page**: `https://taptch.com` (or `http://localhost:5173` for testing).
   - **Application privacy policy link**: `https://taptch.com/privacy`
   - **Application terms of service link**: `https://taptch.com/terms`
   - **Developer contact information**: Your email.
4. Click **Save and Continue**.
5. In **Scopes**:
   - Click **Add or Remove Scopes**.
   - Select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Click **Update** and then **Save and Continue**.
6. If testing under "Testing" publishing status, add your test Google email under **Test Users**.
7. Once ready for production, click **Publish App** to verify consent for all public users.

---

## 2. Create OAuth 2.0 Client Credentials

1. In the left sidebar, click **Credentials**.
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. Set **Application type** to: `Web application`.
4. Set **Name**: `Taptch Web Client`.
5. Under **Authorized JavaScript origins**:
   Add the following URIs:
   - `http://localhost:5173` (Frontend dev server)
   - `http://localhost:4000` (Backend API dev server)
   - `https://taptch.com` (Production frontend)
   - `https://api.taptch.com` (Production backend API)
6. Under **Authorized redirect URIs**:
   Add the exact callback URIs that match your backend endpoint:
   - `http://localhost:4000/api/auth/oauth/google/callback` (Local dev callback)
   - `https://api.taptch.com/api/auth/oauth/google/callback` (Production API callback)
7. Click **CREATE**.
8. A modal dialog will appear with your:
   - **Client ID** (e.g., `123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`)
   - **Client Secret** (e.g., `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`)

---

## 3. Configure Taptch Environment Variables

### Backend Configuration (`backend/.env`)
Edit `backend/.env` (and set production secrets on your hosting provider / Dokploy / Coolify):

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/oauth/google/callback
```

> **Note on Safety:** If `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` are not set or are empty, Taptch safely redirects users back to `/login?error=google_not_configured` with an intuitive diagnostic alert instead of throwing Google's unbranded `401: invalid_client` error.

---

## 4. Verification Checklist

1. **Verify Backend Env**: Ensure `GOOGLE_CLIENT_ID` is not empty in `backend/.env`.
2. **Start Backend**: `cd backend && npm run start:dev`
3. **Start Frontend**: `cd frontend && npm run dev`
4. **Initiate Login**: Navigate to `http://localhost:5173/login`, click **"Continue with Google"**.
5. Google will open the official OAuth account chooser with `Taptch` branding.
6. Upon authentication, Google redirects to `http://localhost:4000/api/auth/oauth/google/callback`, which creates or logs in the user, generates session JWT tokens, and redirects to `http://localhost:5173/dashboard`.

