export default async function watchlistRoutes(app) {

  // GET /api/watchlist — user's watchlist
  app.get('/', { preHandler: app.authenticate }, async (req) => {
    const rows = app.db.prepare(`
      SELECT w.id, w.listing_id, w.last_read, w.created_at,
             l.title, l.price, l.category, l.condition, l.status,
             l.view_count, l.image_url, u.name as seller_name,
             (SELECT COUNT(*) FROM watchlist_events we
              WHERE we.listing_id=w.listing_id AND we.created_at > w.last_read) as unread_events
      FROM watchlist w
      JOIN listings l ON l.id=w.listing_id
      JOIN users u ON u.id=l.seller_id
      WHERE w.user_id=?
      ORDER BY w.created_at DESC
    `).all(req.user.id);

    // Mark all as read — update last_read timestamp
    app.db.prepare(
      "UPDATE watchlist SET last_read=datetime('now') WHERE user_id=?"
    ).run(req.user.id);

    return { watchlist: rows };
  });

  // GET /api/watchlist/badge — unread badge count without marking read
  app.get('/badge', { preHandler: app.authenticate }, async (req) => {
    const result = app.db.prepare(`
      SELECT COUNT(DISTINCT w.listing_id) as count
      FROM watchlist w
      WHERE w.user_id=?
        AND EXISTS (
          SELECT 1 FROM watchlist_events we
          WHERE we.listing_id=w.listing_id AND we.created_at > w.last_read
        )
    `).get(req.user.id);

    return { count: result.count };
  });

  // POST /api/watchlist/:listingId — watch a listing
  app.post('/:listingId', { preHandler: app.authenticate }, async (req, reply) => {
    const listing = app.db.prepare("SELECT id, seller_id FROM listings WHERE id=? AND status='active'").get(req.params.listingId);
    if (!listing) return reply.code(404).send({ error: 'Listing not found or not active' });
    if (listing.seller_id === req.user.id) return reply.code(400).send({ error: 'Cannot watch your own listing' });

    app.db.prepare(
      'INSERT OR IGNORE INTO watchlist (user_id, listing_id) VALUES (?, ?)'
    ).run(req.user.id, listing.id);

    return { ok: true };
  });

  // DELETE /api/watchlist/:listingId — unwatch
  app.delete('/:listingId', { preHandler: app.authenticate }, async (req, reply) => {
    const result = app.db.prepare(
      'DELETE FROM watchlist WHERE user_id=? AND listing_id=?'
    ).run(req.user.id, req.params.listingId);

    if (result.changes === 0) return reply.code(404).send({ error: 'Not watching this listing' });
    return { ok: true };
  });
}