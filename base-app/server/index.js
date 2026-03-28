import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import cors from '@fastify/cors';
import { getDb } from './db/migrate.js';
 
// import authRoutes    from './routes/auth.js';
// import listingRoutes from './routes/listings.js';
// import offerRoutes   from './routes/offers.js';
// import userRoutes    from './routes/users.js';
// import watchRoutes   from './routes/watchlist.js';
// import reviewRoutes  from './routes/reviews.js';
 
const app = Fastify({ logger: process.env.NODE_ENV !== 'production' });
 
// ── Plugins ──────────────────────────────────────────────────────────────────
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});
 
await app.register(cookie);
 
await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'bazaar-dev-secret-change-in-prod-32ch',
  cookie: { cookieName: 'token', signed: false },
});
 
// ── Auth decorator ────────────────────────────────────────────────────────────
app.decorate('authenticate', async (req, reply) => {
  try {
    await req.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});
 
app.decorate('optionalAuth', async (req) => {
  try { await req.jwtVerify(); } catch { /* unauthenticated is fine */ }
});
 
// ── DB decorator ──────────────────────────────────────────────────────────────
app.decorate('db', getDb());
 
app.addHook('onClose', () => app.db.close());
 
// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', async () => ({ status: 'ok' }));
 
// ── Routes ────────────────────────────────────────────────────────────────────
// await app.register(authRoutes,    { prefix: '/api/auth' });
// await app.register(listingRoutes, { prefix: '/api/listings' });
// await app.register(offerRoutes,   { prefix: '/api/offers' });
// await app.register(userRoutes,    { prefix: '/api/users' });
// await app.register(watchRoutes,   { prefix: '/api/watchlist' });
// await app.register(reviewRoutes,  { prefix: '/api/reviews' });
 
// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
 
try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`Bazaar API running on ${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}