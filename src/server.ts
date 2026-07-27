import type { Server } from 'node:http';
import type { Application } from 'express';
import { env } from './config/index.js';
import { logger } from './lib/logger.js';

export function startServer(app: Application): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
          llmProvider: env.LLM_PROVIDER,
        },
        'Voice AI Agent backend listening',
      );
      resolve(server);
    });

    server.on('error', reject);

    const shutdown = (signal: string) => {
      logger.info({ signal }, 'Shutting down gracefully');
      server.close((error) => {
        if (error) {
          logger.error({ err: error }, 'Error during shutdown');
          process.exit(1);
        }
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  });
}
