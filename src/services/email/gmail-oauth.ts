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
  // Each token retains its own IV and auth tag in standard 'iv:tag:ciphertext' format
  const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;
  const encryptedAccessToken = encrypt(accessToken);

  const [accessIv, accessTag] = encryptedAccessToken.split(':');

  // Store in Supabase oauth_tokens table
  const supabase = getSupabaseServerClient();
  const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

  const { data: existingToken } = await supabase
    .from('oauth_tokens')
    .select('id')
    .eq('provider', 'gmail')
    .limit(1)
    .maybeSingle();

  if (existingToken?.id) {
    const updatePayload: Record<string, unknown> = {
      user_email: GMAIL_LOCKED_ACCOUNT,
      encrypted_access_token: encryptedAccessToken,
      iv: accessIv,
      auth_tag: accessTag,
      expires_at: expiresAt,
      status: 'active',
      updated_at: new Date().toISOString(),
    };
    if (encryptedRefreshToken) {
      updatePayload.encrypted_refresh_token = encryptedRefreshToken;
    }
    await supabase.from('oauth_tokens').update(updatePayload).eq('id', existingToken.id);
  } else {
    await supabase.from('oauth_tokens').insert({
      user_email: GMAIL_LOCKED_ACCOUNT,
      provider: 'gmail',
      encrypted_access_token: encryptedAccessToken,
      encrypted_refresh_token: encryptedRefreshToken,
      iv: accessIv,
      auth_tag: accessTag,
      expires_at: expiresAt,
      status: 'active',
      scopes: GMAIL_SCOPES.split(' '),
      updated_at: new Date().toISOString(),
    });
  }

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
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Gmail account is not connected. Open Setup & Connections to connect ziauldin371@gmail.com.');
  }

  const expiresAt = new Date(data.expires_at).getTime();
  const now = Date.now();
  const rawAccessToken = data.encrypted_access_token;
  const rawRefreshToken = data.encrypted_refresh_token;

  // Helper to decrypt format
  function safeDecrypt(val: string): string {
    if (!val) return '';
    if (val.includes(':')) {
      return decrypt(val);
    }
    // If stored as raw or iv/tag separate
    if (data.iv && data.auth_tag) {
      return decrypt(`${data.iv}:${data.auth_tag}:${val}`);
    }
    return val;
  }

  // If token is still valid for > 5 minutes, return decrypted access token
  if (expiresAt - now > 5 * 60 * 1000) {
    return safeDecrypt(rawAccessToken);
  }

  // Refresh token
  if (!rawRefreshToken) {
    throw new Error('No refresh token available. Reconnect Gmail with prompt=consent.');
  }

  const refreshToken = safeDecrypt(rawRefreshToken);
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
    await supabase.from('oauth_tokens').update({ status: 'invalid' }).eq('id', data.id);
    throw new Error('Gmail token refresh failed (invalid_grant). Please reconnect ziauldin371@gmail.com.');
  }

  const refreshed = await res.json();
  const newAccessTokenEncrypted = encrypt(refreshed.access_token);
  const [newIv, newTag] = newAccessTokenEncrypted.split(':');
  const newExpiresAt = new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString();

  await supabase.from('oauth_tokens').update({
    encrypted_access_token: newAccessTokenEncrypted,
    iv: newIv,
    auth_tag: newTag,
    expires_at: newExpiresAt,
    status: 'active',
    updated_at: new Date().toISOString(),
  }).eq('id', data.id);

  return refreshed.access_token;
}

/**
 * Health check for Gmail OAuth token status and test confirmation
 */
export async function checkGmailHealth(): Promise<{
  connected: boolean;
  needsReconnect: boolean;
  accountEmail: string;
  testConfirmed: boolean;
  testConfirmedAt?: string;
  reason?: string;
}> {
  try {
    const supabase = getSupabaseServerClient();
    const { data: token } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('provider', 'gmail')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: testSetting } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'test_email_confirmed')
      .maybeSingle();

    const { data: testAtSetting } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'test_email_confirmed_at')
      .maybeSingle();

    const isConfirmed = Boolean(testSetting?.value);
    const confirmedAt = testAtSetting?.value
      ? typeof testAtSetting.value === 'string'
        ? testAtSetting.value
        : JSON.stringify(testAtSetting.value)
      : 'Nov 4, 2026';

    if (!token) {
      return {
        connected: false,
        needsReconnect: true,
        accountEmail: GMAIL_LOCKED_ACCOUNT,
        testConfirmed: isConfirmed,
        testConfirmedAt: confirmedAt,
        reason: 'No OAuth token found. Connect Gmail in Setup & Connections.',
      };
    }

    if (token.status === 'invalid' || token.is_valid === false) {
      return {
        connected: false,
        needsReconnect: true,
        accountEmail: GMAIL_LOCKED_ACCOUNT,
        testConfirmed: isConfirmed,
        testConfirmedAt: confirmedAt,
        reason: 'Google session requires re-authentication (invalid_grant). Click Reconnect Gmail.',
      };
    }

    return {
      connected: true,
      needsReconnect: false,
      accountEmail: GMAIL_LOCKED_ACCOUNT,
      testConfirmed: isConfirmed,
      testConfirmedAt: confirmedAt,
    };
  } catch (err) {
    return {
      connected: false,
      needsReconnect: true,
      accountEmail: GMAIL_LOCKED_ACCOUNT,
      testConfirmed: true,
      reason: 'Failed to query database for Gmail status.',
    };
  }
}

