import { env } from './config/index.js';
import { createApp } from './app.js';
import { createContainer } from './container/di.js';
import { logger } from './lib/logger.js';
import { startNgrokTunnel } from './lib/ngrok.js';
import { startServer } from './server.js';

async function main(): Promise<void> {
  const container = createContainer();
  const app = createApp(container);
  await startServer(app);
  await startNgrokTunnel(env.PORT);
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
