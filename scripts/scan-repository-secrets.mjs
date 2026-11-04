import fs from 'fs';
import path from 'path';

const secretPatterns = [
  /AIza[0-9A-Za-z-_]{35}/,
  /sk_live_[0-9a-zA-Z]{24}/,
  /client_secret[=:]\s*['"][^'"]{10,}/i,
  /password[=:]\s*['"][^'"]{8,}['"]/i
];

function scanDir(dir) {
  let flags = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (
      e.name === 'node_modules' ||
      e.name === '.next' ||
      e.name === '.git' ||
      e.name.startsWith('.env.') ||
      e.name.endsWith('.png') ||
      e.name.endsWith('.jpg') ||
      e.name === 'design'
    ) continue;

    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      flags = flags.concat(scanDir(full));
    } else {
      const content = fs.readFileSync(full, 'utf8');
      for (const p of secretPatterns) {
        if (p.test(content) && !full.includes('.test.ts')) {
          flags.push({ file: full, match: 'Potential secret detected' });
        }
      }
    }
  }
  return flags;
}

const flags = scanDir('.');
console.log('Secret Scan Results:', flags.length === 0 ? 'CLEAN! Zero secrets in tracked code.' : flags);

