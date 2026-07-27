/**
 * Dev entry that forces ENABLE_NGROK before loading the app.
 * Usage: npm run dev:tunnel
 */
process.env.ENABLE_NGROK = 'true';

await import('../index.js');
