/**
 * Start only an ngrok tunnel to an already-running local server.
 * Usage: npm run tunnel
 *
 * Requires NGROK_AUTHTOKEN in .env. Optional NGROK_DOMAIN.
 */
import { config as loadDotenv } from 'dotenv';
import ngrok from '@ngrok/ngrok';

loadDotenv();

const port = Number(process.env.PORT ?? 3000);
const authtoken = process.env.NGROK_AUTHTOKEN;
const domain = process.env.NGROK_DOMAIN;

if (!authtoken) {
  console.error('NGROK_AUTHTOKEN is required. Get one at https://dashboard.ngrok.com/get-started/your-authtoken');
  process.exit(1);
}

const listener = await ngrok.forward({
  addr: port,
  authtoken,
  ...(domain ? { domain } : {}),
});

const publicUrl = listener.url();
if (!publicUrl) {
  console.error('ngrok did not return a public URL');
  process.exit(1);
}

const vapiWebhookUrl = `${publicUrl.replace(/\/$/, '')}/webhooks/vapi`;

console.log('\n========================================');
console.log('ngrok public URL :', publicUrl);
console.log('Vapi Server URL  :', vapiWebhookUrl);
console.log('Forwarding to    :', `http://localhost:${port}`);
console.log('========================================');
console.log('\nLeave this process running. Ctrl+C to stop.\n');

process.stdin.resume();
