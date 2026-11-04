# Google Cloud & Gmail Setup Guide: Growth System v2

## 1. Google Cloud Console Configuration
1. Open the [Google Cloud Console](https://console.cloud.google.com).
2. Create or select a project (e.g. `Growth-System-Production`).
3. Under **APIs & Services > Library**, enable:
   - **Gmail API**
   - **Places API (New)**

## 2. OAuth Consent Screen (Critical Rule)
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Set User Type to **External**.
3. Under Scopes, add:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
4. **Publish the App:** Set Publishing Status to **"In production"**.
   *(If left in "Testing" mode, Google automatically expires refresh tokens after 7 days, causing disconnects).*

## 3. Create OAuth Client Credentials
1. Navigate to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
2. Application type: **Web application**.
3. Name: `Growth System Console`.
4. Authorized Redirect URIs:
   - Development: `http://localhost:3000/api/auth/gmail/callback`
   - Production: `https://<your-vercel-domain>.vercel.app/api/auth/gmail/callback`
5. Copy the Client ID and Client Secret into your environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## 4. Verification Check
- Only `ziauldin371@gmail.com` is permitted to connect. Connecting any other account will be rejected immediately by the callback handler.
