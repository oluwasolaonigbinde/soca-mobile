# Google OAuth Setup (TODO)

OAuth is tested in a **dev build**, not Expo Go. Run `npx expo run:ios` or `npx expo run:android` to test.

## Dashboard Configuration (TODO)

### 1. Supabase Dashboard

1. Go to **Authentication** → **Providers** → **Google**
2. Enable the Google provider
3. Add **Client ID** and **Client Secret** from Google Cloud Console (see below)

### 2. Supabase URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. Add redirect URL(s). Use the output of `makeRedirectUri()` when running the app, e.g.:
   - `socamobile://` (for custom scheme)
   - Or the Expo dev URL when using tunnel: `https://xxx.exp.direct`

### 3. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Create **OAuth 2.0 Client ID** (type: Web application)
3. Add **Authorized redirect URIs** matching Supabase callback URL (from Supabase Dashboard → Authentication → URL Configuration)
4. Copy **Client ID** and **Client Secret** to Supabase Google provider settings

### 4. app.json

Ensure `scheme` is set for deep linking (already `socamobile` in this project).

## Environment

Add to `.env.local` if needed:

```
EXPO_PUBLIC_GOOGLE_AUTH_WEB_CLIENT_ID=your_web_client_id
```

(Used if switching to @react-oauth/google for web; current implementation uses Supabase OAuth.)
