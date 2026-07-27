import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { AppContainer } from './container/di.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { attachRequestId, requestLogger } from './middleware/request-logger.js';
import { createRoutes } from './routes/index.js';
import { createRegistryRoutes } from './routes/registry.routes.js';

const publicDir = path.resolve(process.cwd(), 'public');

export function createApp(container: AppContainer): express.Application {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(requestLogger);
  app.use(attachRequestId);

  // UI at /registry (separate from REST /patients)
  app.use('/registry', createRegistryRoutes(publicDir));
  app.get(['/dashboard', '/dashboard/'], (_req, res) => {
    res.redirect(302, '/registry');
  });

  app.use(
    createRoutes({
      healthController: container.healthController,
      vapiWebhookController: container.vapiWebhookController,
      agentsController: container.agentsController,
      intentsController: container.intentsController,
      patientsController: container.patientsController,
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
