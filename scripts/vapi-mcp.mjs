/**
 * Starts @vapi-ai/mcp-server with token from:
 * VAPI_TOKEN | VAPI_API_KEY | project .env
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadDotEnv() {
  const envPath = path.join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const token = process.env.VAPI_TOKEN || process.env.VAPI_API_KEY;
if (!token || token === 'your-vapi-api-key') {
  console.error(
    '[vapi-mcp] Set VAPI_API_KEY (or VAPI_TOKEN) in .env — get a key from https://dashboard.vapi.ai/org/api-keys',
  );
  process.exit(1);
}

process.env.VAPI_TOKEN = token;

const require = createRequire(import.meta.url);
let serverEntry;
try {
  serverEntry = require.resolve('@vapi-ai/mcp-server');
} catch {
  console.error('[vapi-mcp] Missing @vapi-ai/mcp-server. Run: npm install');
  process.exit(1);
}

const child = spawn(process.execPath, [serverEntry], {
  stdio: 'inherit',
  env: process.env,
  cwd: root,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
