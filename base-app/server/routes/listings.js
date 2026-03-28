const VALID_CATEGORIES = ['Electronics', 'Clothing', 'Furniture', 'Books', 'Sports', 'Toys', 'Other'];
const VALID_CONDITIONS  = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
const VALID_SORTS = {
  newest:     'l.created_at DESC',
  price_asc:  'l.price ASC',
  price_desc: 'l.price DESC',
  most_viewed: 'l.view_count DESC',
};
 
export default async function listingRoutes(app) {
 
  // GET /api/listings — browse with optional category + sort + pagination
  app.get('/', { preHandler: app.optionalAuth }, async (req) => {
    const { category, sort = 'newest', page = '1', limit = '12' } = req.query;
    const orderBy = VALID_SORTS[sort] || VALID_SORTS.newest;
    const offset  = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
 
    let where = "l.status = 'active'";
    const params = [];
    if (category && VALID_CATEGORIES.includes(category)) {
      where += ' AND l.category = ?';
      params.push(category);
    }
 
    const total = app.db.prepare(`SELECT COUNT(*) as n FROM listings l WHERE ${where}`).get(...params).n;
    const rows  = app.db.prepare(`
      SELECT l.*, u.name as seller_name,
        (SELECT COUNT(*) FROM offers WHERE listing_id=l.id AND status='pending') as offer_count
      FROM listings l JOIN users u ON u.id=l.seller_id
      WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);
 
    return { listings: rows, total, page: parseInt(page), limit: parseInt(limit) };
  });
 
  // GET /api/listings/search
  app.get('/search', { preHandler: app.optionalAuth }, async (req) => {
    const { q = '', sort = 'newest', page = '1', limit = '12' } = req.query;
    if (!q.trim()) return { listings: [], total: 0, page: 1, limit: parseInt(limit) };
 
    const orderBy = VALID_SORTS[sort] || VALID_SORTS.newest;
    const offset  = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const term    = `%${q.trim()}%`;
 
    const total = app.db.prepare(`
      SELECT COUNT(*) as n FROM listings l
      WHERE l.status='active' AND (l.title LIKE ? OR l.description LIKE ?)
    `).get(term, term).n;
 
    const rows = app.db.prepare(`
      SELECT l.*, u.name as seller_name,
        (SELECT COUNT(*) FROM offers WHERE listing_id=l.id AND status='pending') as offer_count
      FROM listings l JOIN users u ON u.id=l.seller_id
      WHERE l.status='active' AND (l.title LIKE ? OR l.description LIKE ?)
      ORDER BY ${orderBy} LIMIT ? OFFSET ?
    `).all(term, term, parseInt(limit), offset);
 
    return { listings: rows, total, page: parseInt(page), limit: parseInt(limit), q };
  });
 
  // GET /api/listings/:id
  app.get('/:id', { preHandler: app.optionalAuth }, async (req, reply) => {
    const listing = app.db.prepare(`
      SELECT l.*, u.name as seller_name, u.id as seller_id,
        (SELECT COUNT(*) FROM offers WHERE listing_id=l.id AND status='pending') as offer_count,
        (SELECT ROUND(AVG(t.final_price),2) FROM transactions t
          JOIN listings sl ON sl.id=t.listing_id
          WHERE sl.category=l.category
          AND t.created_at > datetime('now', '-30 days')) as market_avg_price
      FROM listings l JOIN users u ON u.id=l.seller_id
      WHERE l.id=?
    `).get(req.params.id);
 
    if (!listing) return reply.code(404).send({ error: 'Listing not found' });
 
    // Increment view count
    app.db.prepare('UPDATE listings SET view_count=view_count+1 WHERE id=?').run(listing.id);
 
    // Record browsing history if authenticated
    if (req.user) {
      app.db.prepare(
        'INSERT INTO browsing_history (user_id, listing_id) VALUES (?, ?)'
      ).run(req.user.id, listing.id);
    }
 
    // Check if authed user has an offer on this listing
    let userOffer = null;
    if (req.user) {
      userOffer = app.db.prepare(
        'SELECT * FROM offers WHERE listing_id=? AND buyer_id=? ORDER BY created_at DESC LIMIT 1'
      ).get(listing.id, req.user.id);
    }
 
    // Check if watching
    let watching = false;
    if (req.user) {
      watching = !!app.db.prepare(
        'SELECT 1 FROM watchlist WHERE user_id=? AND listing_id=?'
      ).get(req.user.id, listing.id);
    }
 
    return { listing: { ...listing, view_count: listing.view_count + 1 }, userOffer, watching };
  });
 
  // GET /api/listings/:id/price-history (task-05 surface, base returns data)
  app.get('/:id/price-history', async (req, reply) => {
    const listing = app.db.prepare('SELECT category FROM listings WHERE id=?').get(req.params.id);
    if (!listing) return reply.code(404).send({ error: 'Listing not found' });
 
    const rows = app.db.prepare(`
      SELECT
        strftime('%Y-%m-%d', t.created_at, 'weekday 0', '-6 days') as week_start,
        ROUND(AVG(t.final_price), 2) as avg_price
      FROM transactions t
      JOIN listings l ON l.id = t.listing_id
      WHERE l.category = ?
        AND t.created_at > datetime('now', '-90 days')
      GROUP BY week_start
      ORDER BY week_start ASC
    `).all(listing.category);
 
    return { weeks: rows, category: listing.category };
  });
 
  // POST /api/listings — create (auth required)
  app.post('/', { preHandler: app.authenticate }, async (req, reply) => {
    const { title, description, category, condition, price, image_url = '' } = req.body ?? {};
 
    if (!title || !description || !category || !condition || price == null) {
      return reply.code(400).send({ error: 'title, description, category, condition, and price are required' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return reply.code(400).send({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    if (!VALID_CONDITIONS.includes(condition)) {
      return reply.code(400).send({ error: `condition must be one of: ${VALID_CONDITIONS.join(', ')}` });
    }
    if (typeof price !== 'number' || price <= 0) {
      return reply.code(400).send({ error: 'price must be a positive number' });
    }
    if (title.length > 100) return reply.code(400).send({ error: 'title max 100 characters' });
    if (description.length > 1000) return reply.code(400).send({ error: 'description max 1000 characters' });
 
    const info = app.db.prepare(`
      INSERT INTO listings (seller_id, title, description, category, condition, price, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, title.trim(), description.trim(), category, condition, price, image_url);
 
    const listing = app.db.prepare('SELECT * FROM listings WHERE id=?').get(info.lastInsertRowid);
    return reply.code(201).send({ listing });
  });
 
  // PATCH /api/listings/:id — update own listing
  app.patch('/:id', { preHandler: app.authenticate }, async (req, reply) => {
    const listing = app.db.prepare('SELECT * FROM listings WHERE id=?').get(req.params.id);
    if (!listing) return reply.code(404).send({ error: 'Listing not found' });
    if (listing.seller_id !== req.user.id) return reply.code(403).send({ error: 'Forbidden' });
    if (listing.status === 'sold') return reply.code(400).send({ error: 'Cannot edit a sold listing' });
 
    const { title, description, category, condition, price, image_url } = req.body ?? {};
    const updates = [];
    const params  = [];
 
    if (title !== undefined)       { updates.push('title=?');       params.push(title.trim()); }
    if (description !== undefined) { updates.push('description=?'); params.push(description.trim()); }
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) return reply.code(400).send({ error: 'Invalid category' });
      updates.push('category=?'); params.push(category);
    }
    if (condition !== undefined) {
      if (!VALID_CONDITIONS.includes(condition)) return reply.code(400).send({ error: 'Invalid condition' });
      updates.push('condition=?'); params.push(condition);
    }
    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) return reply.code(400).send({ error: 'Invalid price' });
      updates.push('price=?'); params.push(price);
      // Fire watchlist event for price change
      app.db.prepare(
        "INSERT INTO watchlist_events (listing_id, event_type) VALUES (?, 'price_change')"
      ).run(listing.id);
    }
    if (image_url !== undefined) { updates.push('image_url=?'); params.push(image_url); }
 
    if (updates.length === 0) return reply.code(400).send({ error: 'No fields to update' });
    updates.push("updated_at=datetime('now')");
    params.push(req.params.id);
 
    app.db.prepare(`UPDATE listings SET ${updates.join(',')} WHERE id=?`).run(...params);
    const updated = app.db.prepare('SELECT * FROM listings WHERE id=?').get(req.params.id);
    return { listing: updated };
  });
 
  // DELETE /api/listings/:id — remove own listing
  app.delete('/:id', { preHandler: app.authenticate }, async (req, reply) => {
    const listing = app.db.prepare('SELECT * FROM listings WHERE id=?').get(req.params.id);
    if (!listing) return reply.code(404).send({ error: 'Listing not found' });
    if (listing.seller_id !== req.user.id) return reply.code(403).send({ error: 'Forbidden' });
 
    app.db.prepare("UPDATE listings SET status='removed' WHERE id=?").run(listing.id);
    return { ok: true };
  });
 
  // GET /api/listings/mine — authenticated user's own listings
  app.get('/mine', { preHandler: app.authenticate }, async (req) => {
    const rows = app.db.prepare(`
      SELECT l.*,
        (SELECT COUNT(*) FROM offers WHERE listing_id=l.id AND status='pending') as offer_count
      FROM listings l
      WHERE l.seller_id=? AND l.status != 'removed'
      ORDER BY l.created_at DESC
    `).all(req.user.id);
    return { listings: rows };
  });
}