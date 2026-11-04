import net from 'net';

/**
 * Checks if an IP address falls into private, loopback, link-local, or cloud metadata ranges.
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  if (!net.isIP(ip)) {
    return false;
  }

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    const [b0, b1] = parts;

    // 0.0.0.0/8 (Current network)
    if (b0 === 0) return true;
    // 10.0.0.0/8 (Private)
    if (b0 === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return true;
    // 169.254.0.0/16 (Link-local & AWS/GCP/Azure metadata service 169.254.169.254)
    if (b0 === 169 && b1 === 254) return true;
    // 172.16.0.0/12 (Private)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (b0 === 192 && b1 === 168) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (b0 === 192 && b1 === 0) return true;
    // Broadcast
    if (b0 === 255 && b1 === 255) return true;

    return false;
  }

  // IPv6 checks
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  // Link-local fe80::/10
  if (normalized.startsWith('fe80:') || normalized.startsWith('fe90:') || normalized.startsWith('fea0:') || normalized.startsWith('feb0:')) return true;
  // Unique local fc00::/7
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // IPv4 mapped ::ffff:x.x.x.x
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.slice(7);
    return isPrivateOrReservedIP(ipv4Part);
  }

  return false;
}

export interface SafeFetchOptions extends RequestInit {
  timeoutMs?: number;
  maxSizeBytes?: number;
}

/**
 * Validates and safely fetches an external URL protecting against SSRF attacks.
 */
export async function safeFetch(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<Response> {
  const { timeoutMs = 8000, maxSizeBytes = 2 * 1024 * 1024, ...fetchOptions } = options;

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error(`Invalid URL provided: ${targetUrl}`);
  }

  // Strictly enforce http or https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Forbidden protocol: ${parsed.protocol}. Only HTTP and HTTPS are permitted.`);
  }

  const hostname = parsed.hostname;

  // Block localhost and standard aliases
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal'
  ) {
    throw new Error(`Forbidden host: ${hostname}`);
  }

  // If the host is directly an IP literal, verify it
  if (net.isIP(hostname) && isPrivateOrReservedIP(hostname)) {
    throw new Error(`SSRF Guard: IP address ${hostname} is private or reserved.`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(parsed.toString(), {
      ...fetchOptions,
      signal: controller.signal,
      redirect: 'manual', // Never blindly follow redirects to avoid SSRF hops
    });

    // Check Content-Length if provided
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new Error(`Response size exceeds limit of ${maxSizeBytes} bytes.`);
    }

    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

