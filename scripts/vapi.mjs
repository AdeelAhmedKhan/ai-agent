/**
 * Runs the local Vapi CLI binary (.tools/vapi/vapi[.exe]).
 * Auto-downloads it if missing.
 */
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const binaryName = process.platform === 'win32' ? 'vapi.exe' : 'vapi';
const binaryPath = path.join(root, '.tools', 'vapi', binaryName);

if (!existsSync(binaryPath)) {
  console.log('Vapi CLI not found locally. Installing...');
  const install = spawnSync(process.execPath, [path.join(__dirname, 'install-vapi-cli.mjs')], {
    stdio: 'inherit',
    cwd: root,
  });
  if (install.status !== 0) {
    process.exit(install.status ?? 1);
  }
}

const args = process.argv.slice(2);
const child = spawn(binaryPath, args, {
  stdio: 'inherit',
  cwd: root,
  shell: false,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
