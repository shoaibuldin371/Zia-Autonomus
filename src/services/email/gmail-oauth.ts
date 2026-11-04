import { encrypt, decrypt } from '@/lib/security/encryption';
import { getSupabaseServerClient } from '@/lib/supabase/client';

export const GMAIL_LOCKED_ACCOUNT = 'ziauldin371@gmail.com';
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export function getGoogleOAuthUrl(baseUrl: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured in environment variables.');
  }

  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/gmail/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges authorization code for tokens, verifies that authenticated user email is ziauldin371@gmail.com,
 * and saves encrypted tokens in Supabase.
 */
export async function handleGoogleOAuthCallback(
  code: string,
  baseUrl: string
): Promise<{ success: boolean; email: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are missing.');
  }

  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/gmail/callback`;

  // 1. Exchange code for access & refresh tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  // 2. Fetch authenticated user profile to strictly verify email
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userRes.ok) {
    throw new Error('Failed to retrieve userinfo from Google API');
  }

  const userInfo = await userRes.json();
  const authenticatedEmail = (userInfo.email || '').toLowerCase().trim();

  // STRICT REQUIREMENT: Only ziauldin371@gmail.com is permitted
  if (authenticatedEmail !== GMAIL_LOCKED_ACCOUNT) {
    throw new Error(
      `Access Denied: Connected Google account "${authenticatedEmail}" is not authorized. Only "${GMAIL_LOCKED_ACCOUNT}" may be connected.`
    );
  }

  // 3. Encrypt sensitive tokens with AES-256-GCM before database storage
  const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;
  const encryptedAccessToken = encrypt(accessToken);

  // Store in Supabase oauth_tokens table
  const supabase = getSupabaseServerClient();
  const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

  await supabase.from('oauth_tokens').upsert({
    provider: 'gmail',
    account_email: GMAIL_LOCKED_ACCOUNT,
    access_token_encrypted: encryptedAccessToken,
    refresh_token_encrypted: encryptedRefreshToken,
    expires_at: expiresAt,
    is_valid: true,
    updated_at: new Date().toISOString(),
  });

  return { success: true, email: authenticatedEmail };
}

/**
 * Retrieves and refreshes a valid Gmail access token
 */
export async function getValidGmailAccessToken(): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('provider', 'gmail')
    .eq('account_email', GMAIL_LOCKED_ACCOUNT)
    .single();

  if (error || !data) {
    throw new Error('Gmail account is not connected. Open Setup & Connections to connect ziauldin371@gmail.com.');
  }

  const expiresAt = new Date(data.expires_at).getTime();
  const now = Date.now();

  // If token is still valid for > 5 minutes, return decrypted access token
  if (expiresAt - now > 5 * 60 * 1000) {
    return decrypt(data.access_token_encrypted);
  }

  // Refresh token
  if (!data.refresh_token_encrypted) {
    throw new Error('No refresh token available. Reconnect Gmail with prompt=consent.');
  }

  const refreshToken = decrypt(data.refresh_token_encrypted);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId || '',
      client_secret: clientSecret || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    // Mark invalid_grant
    await supabase.from('oauth_tokens').update({ is_valid: false }).eq('id', data.id);
    throw new Error('Gmail token refresh failed. Please reconnect ziauldin371@gmail.com.');
  }

  const refreshed = await res.json();
  const newAccessTokenEncrypted = encrypt(refreshed.access_token);
  const newExpiresAt = new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString();

  await supabase.from('oauth_tokens').update({
    access_token_encrypted: newAccessTokenEncrypted,
    expires_at: newExpiresAt,
    is_valid: true,
  }).eq('id', data.id);

  return refreshed.access_token;
}

