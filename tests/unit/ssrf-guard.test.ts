import { describe, it, expect } from 'vitest';
import { isPrivateOrReservedIP, safeFetch } from '@/lib/security/ssrf-guard';

describe('SSRF Guard & Network Isolation', () => {
  it('detects private and loopback IPv4 addresses', () => {
    expect(isPrivateOrReservedIP('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIP('127.255.255.255')).toBe(true);
    expect(isPrivateOrReservedIP('10.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIP('172.16.0.1')).toBe(true);
    expect(isPrivateOrReservedIP('172.31.255.255')).toBe(true);
    expect(isPrivateOrReservedIP('192.168.1.1')).toBe(true);
    expect(isPrivateOrReservedIP('169.254.169.254')).toBe(true); // Cloud metadata
    expect(isPrivateOrReservedIP('0.0.0.0')).toBe(true);
  });

  it('permits public IP addresses', () => {
    expect(isPrivateOrReservedIP('8.8.8.8')).toBe(false);
    expect(isPrivateOrReservedIP('1.1.1.1')).toBe(false);
    expect(isPrivateOrReservedIP('142.250.190.46')).toBe(false);
  });

  it('detects private and loopback IPv6 addresses', () => {
    expect(isPrivateOrReservedIP('::1')).toBe(true);
    expect(isPrivateOrReservedIP('fe80::1')).toBe(true);
    expect(isPrivateOrReservedIP('fc00::1')).toBe(true);
  });

  it('rejects non-http/https protocols', async () => {
    await expect(safeFetch('ftp://example.com')).rejects.toThrow('Forbidden protocol');
    await expect(safeFetch('file:///etc/passwd')).rejects.toThrow('Forbidden protocol');
    await expect(safeFetch('gopher://example.com')).rejects.toThrow('Forbidden protocol');
  });

  it('blocks localhost and internal domains', async () => {
    await expect(safeFetch('http://localhost:3000')).rejects.toThrow('Forbidden host');
    await expect(safeFetch('http://metadata.google.internal')).rejects.toThrow('Forbidden host');
    await expect(safeFetch('http://service.internal')).rejects.toThrow('Forbidden host');
  });

  it('blocks direct private IP requests', async () => {
    await expect(safeFetch('http://169.254.169.254/latest/meta-data/')).rejects.toThrow('SSRF Guard');
    await expect(safeFetch('http://192.168.1.1')).rejects.toThrow('SSRF Guard');
  });
});
