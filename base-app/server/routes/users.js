export default async function userRoutes(app) {

  // GET /api/users/:id — public profile
  app.get('/:id', async (req, reply) => {
    const user = app.db.prepare(
      'SELECT id, name, bio, created_at FROM users WHERE id=?'
    ).get(req.params.id);
    if (!user) return reply.code(404).send({ error: 'User not found' });

    const stats = app.db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM listings WHERE seller_id=? AND status='active') as active_listings,
        (SELECT COUNT(*) FROM transactions WHERE seller_id=?) as total_sales,
        (SELECT ROUND(AVG(rating),1) FROM reviews WHERE reviewee_id=?) as avg_rating,
        (SELECT COUNT(*) FROM reviews WHERE reviewee_id=?) as review_count
    `).get(user.id, user.id, user.id, user.id);

    const reviews = app.db.prepare(`
      SELECT r.rating, r.comment, r.created_at, u.name as reviewer_name
      FROM reviews r JOIN users u ON u.id=r.reviewer_id
      WHERE r.reviewee_id=?
      ORDER BY r.created_at DESC LIMIT 10
    `).all(user.id);

    const listings = app.db.prepare(`
      SELECT id, title, price, category, condition, status, image_url, created_at
      FROM listings WHERE seller_id=? AND status='active'
      ORDER BY created_at DESC LIMIT 12
    `).all(user.id);

    return { user, stats, reviews, listings };
  });

  // PATCH /api/users/me — update own profile
  app.patch('/me', { preHandler: app.authenticate }, async (req, reply) => {
    const { name, bio } = req.body ?? {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
        return reply.code(400).send({ error: 'name must be between 2 and 50 characters' });
      }
    }
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 200) {
        return reply.code(400).send({ error: 'bio max 200 characters' });
      }
    }

    const updates = [];
    const params  = [];
    if (name !== undefined) { updates.push('name=?'); params.push(name.trim()); }
    if (bio  !== undefined) { updates.push('bio=?');  params.push(bio); }
    if (updates.length === 0) return reply.code(400).send({ error: 'No fields to update' });
    params.push(req.user.id);

    app.db.prepare(`UPDATE users SET ${updates.join(',')} WHERE id=?`).run(...params);
    const user = app.db.prepare('SELECT id, email, name, bio, created_at FROM users WHERE id=?').get(req.user.id);
    return { user };
  });

  // GET /api/users/me/dashboard — seller dashboard metrics
  app.get('/me/dashboard', { preHandler: app.authenticate }, async (req) => {
    const id = req.user.id;

    const metrics = app.db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM listings WHERE seller_id=? AND status='active') as active_listings,
        (SELECT COUNT(*) FROM offers o JOIN listings l ON l.id=o.listing_id WHERE l.seller_id=? AND o.status='pending') as pending_offers,
        (SELECT COALESCE(SUM(final_price),0) FROM transactions WHERE seller_id=?) as total_revenue,
        (SELECT ROUND(AVG(
          CAST((julianday(t.created_at) - julianday(l.created_at)) AS REAL)
        ),1) FROM transactions t JOIN listings l ON l.id=t.listing_id WHERE t.seller_id=?) as avg_days_to_sell
    `).get(id, id, id, id);

    const listings = app.db.prepare(`
      SELECT l.id, l.title, l.price, l.view_count, l.created_at,
        (SELECT COUNT(*) FROM offers WHERE listing_id=l.id AND status='pending') as offer_count
      FROM listings l
      WHERE l.seller_id=? AND l.status='active'
      ORDER BY l.created_at DESC
    `).all(id);

    return { metrics, listings };
  });

  // GET /api/users/me/notifications
  app.get('/me/notifications', { preHandler: app.authenticate }, async (req) => {
    const rows = app.db.prepare(
      'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50'
    ).all(req.user.id);

    // Mark all as read
    app.db.prepare('UPDATE notifications SET read=1 WHERE user_id=? AND read=0').run(req.user.id);

    return { notifications: rows };
  });
}