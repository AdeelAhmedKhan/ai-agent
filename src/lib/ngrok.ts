import ngrok from '@ngrok/ngrok';
import { env } from '../config/index.js';
import { logger } from './logger.js';

export interface NgrokTunnelInfo {
  publicUrl: string;
  vapiWebhookUrl: string;
}

/**
 * Opens an ngrok HTTPS tunnel to the local Express port for Vapi webhooks.
 * Disabled unless ENABLE_NGROK=true (dev only).
 *
 * Vapi Server URL to paste in the dashboard:
 *   {publicUrl}/webhooks/vapi
 */
export async function startNgrokTunnel(port: number): Promise<NgrokTunnelInfo | null> {
  if (!env.ENABLE_NGROK) {
    return null;
  }

  if (env.NODE_ENV === 'production') {
    logger.warn('ENABLE_NGROK is ignored in production');
    return null;
  }

  if (!env.NGROK_AUTHTOKEN) {
    throw new Error('ENABLE_NGROK=true requires NGROK_AUTHTOKEN (https://dashboard.ngrok.com/get-started/your-authtoken)');
  }

  const listener = await ngrok.forward({
    addr: port,
    authtoken: env.NGROK_AUTHTOKEN,
    ...(env.NGROK_DOMAIN ? { domain: env.NGROK_DOMAIN } : {}),
  });

  const publicUrl = listener.url();
  if (!publicUrl) {
    throw new Error('ngrok did not return a public URL');
  }

  const vapiWebhookUrl = `${publicUrl.replace(/\/$/, '')}/webhooks/vapi`;

  logger.info(
    {
      publicUrl,
      vapiWebhookUrl,
      domain: env.NGROK_DOMAIN ?? 'ephemeral',
    },
    'ngrok tunnel ready — set this as the Vapi Server URL',
  );

  // Keep console-visible for quick copy/paste during local setup
  console.log('\n========================================');
  console.log('ngrok public URL :', publicUrl);
  console.log('Vapi Server URL  :', vapiWebhookUrl);
  console.log('Auth             : Bearer', env.VAPI_WEBHOOK_SECRET);
  console.log('========================================\n');

  return { publicUrl, vapiWebhookUrl };
}
