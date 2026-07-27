/**
 * Downloads the official Vapi CLI binary into .tools/vapi/
 * Needed on Windows because `npm i -g @vapi-ai/cli` postinstall
 * fails to match the Windows_x86_64 asset name.
 */
import { createWriteStream, existsSync, mkdirSync, chmodSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '.tools', 'vapi');

const platformMap = {
  'win32-x64': 'Windows_x86_64',
  'win32-arm64': 'Windows_x86_64',
  'darwin-x64': 'Darwin_x86_64',
  'darwin-arm64': 'Darwin_arm64',
  'linux-x64': 'Linux_x86_64',
  'linux-arm64': 'Linux_arm64',
};

const key = `${process.platform}-${process.arch}`;
const assetPlatform = platformMap[key];
if (!assetPlatform) {
  console.error(`Unsupported platform: ${key}`);
  process.exit(1);
}

const asset = `cli_${assetPlatform}.tar.gz`;
const url = `https://github.com/VapiAI/cli/releases/latest/download/${asset}`;
const archivePath = path.join(outDir, asset);
const binaryName = process.platform === 'win32' ? 'vapi.exe' : 'vapi';
const binaryPath = path.join(outDir, binaryName);

mkdirSync(outDir, { recursive: true });

if (existsSync(binaryPath)) {
  console.log(`Vapi CLI already installed at ${binaryPath}`);
  process.exit(0);
}

console.log(`Downloading ${url} ...`);
const response = await fetch(url);
if (!response.ok || !response.body) {
  console.error(`Download failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}

await pipeline(Readable.fromWeb(response.body), createWriteStream(archivePath));
execFileSync('tar', ['-xzf', archivePath, '-C', outDir], { stdio: 'inherit' });

if (!existsSync(binaryPath)) {
  console.error(`Expected binary not found after extract: ${binaryPath}`);
  process.exit(1);
}

if (process.platform !== 'win32') {
  chmodSync(binaryPath, 0o755);
}

console.log(`Vapi CLI installed: ${binaryPath}`);
console.log('Use: npm run vapi -- --help');
