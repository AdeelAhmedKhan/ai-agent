import path from 'node:path';
import express, { Router } from 'express';

/**
 * Patient registry UI — separate from REST `/patients` API.
 * Mount at `/registry`. Static assets: `public/registry/`.
 */
export function createRegistryRoutes(publicDir: string): Router {
  const router = Router();
  const registryDir = path.join(publicDir, 'registry');

  router.get('/', (_req, res) => {
    res.sendFile(path.join(registryDir, 'index.html'));
  });

  router.use(express.static(registryDir, { index: false }));

  return router;
}
