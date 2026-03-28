export default async function offerRoutes(app) {

  // POST /api/offers — buyer places an offer
  app.post('/', { preHandler: app.authenticate }, async (req, reply) => {
    const { listing_id, amount } = req.body ?? {};
    if (!listing_id || !amount) return reply.code(400).send({ error: 'listing_id and amount are required' });
    if (typeof amount !== 'number' || amount <= 0) return reply.code(400).send({ error: 'amount must be a positive number' });

    const listing = app.db.prepare("SELECT * FROM listings WHERE id=? AND status='active'").get(listing_id);
    if (!listing) return reply.code(404).send({ error: 'Listing not found or not active' });
    if (listing.seller_id === req.user.id) return reply.code(400).send({ error: 'Cannot offer on your own listing' });

    const existing = app.db.prepare(
      "SELECT id FROM offers WHERE listing_id=? AND buyer_id=? AND status IN ('pending','countered')"
    ).get(listing_id, req.user.id);
    if (existing) return reply.code(409).send({ error: 'You already have an open offer on this listing' });

    const info = app.db.prepare(
      'INSERT INTO offers (listing_id, buyer_id, amount) VALUES (?, ?, ?)'
    ).run(listing_id, req.user.id, amount);

    // Watchlist event — new offer on watched listing
    app.db.prepare(
      "INSERT INTO watchlist_events (listing_id, event_type) VALUES (?, 'new_offer')"
    ).run(listing_id);

    // Notification for seller
    app.db.prepare(
      "INSERT INTO notifications (user_id, type, payload) VALUES (?, 'new_offer', ?)"
    ).run(listing.seller_id, JSON.stringify({ listing_id, listing_title: listing.title, amount, offer_id: info.lastInsertRowid }));

    const offer = app.db.prepare('SELECT * FROM offers WHERE id=?').get(info.lastInsertRowid);
    return reply.code(201).send({ offer });
  });

  // GET /api/offers/mine — buyer's own offers
  app.get('/mine', { preHandler: app.authenticate }, async (req) => {
    const rows = app.db.prepare(`
      SELECT o.*, l.title as listing_title, l.price as listing_price,
             l.status as listing_status, l.image_url,
             u.name as seller_name
      FROM offers o
      JOIN listings l ON l.id=o.listing_id
      JOIN users u ON u.id=l.seller_id
      WHERE o.buyer_id=?
      ORDER BY o.created_at DESC
    `).all(req.user.id);
    return { offers: rows };
  });

  // GET /api/offers/listing/:listingId — seller views offers on their listing
  app.get('/listing/:listingId', { preHandler: app.authenticate }, async (req, reply) => {
    const listing = app.db.prepare('SELECT * FROM listings WHERE id=?').get(req.params.listingId);
    if (!listing) return reply.code(404).send({ error: 'Listing not found' });
    if (listing.seller_id !== req.user.id) return reply.code(403).send({ error: 'Forbidden' });

    const rows = app.db.prepare(`
      SELECT o.*, u.name as buyer_name
      FROM offers o JOIN users u ON u.id=o.buyer_id
      WHERE o.listing_id=?
      ORDER BY o.created_at DESC
    `).all(req.params.listingId);
    return { offers: rows };
  });

  // POST /api/offers/:id/accept — seller accepts
  app.post('/:id/accept', { preHandler: app.authenticate }, async (req, reply) => {
    const offer = app.db.prepare('SELECT * FROM offers WHERE id=?').get(req.params.id);
    if (!offer) return reply.code(404).send({ error: 'Offer not found' });

    const listing = app.db.prepare('SELECT * FROM listings WHERE id=?').get(offer.listing_id);
    if (listing.seller_id !== req.user.id) return reply.code(403).send({ error: 'Forbidden' });
    if (!['pending', 'countered'].includes(offer.status)) {
      return reply.code(400).send({ error: 'Offer is not in an acceptable state' });
    }

    const finalPrice = offer.counter_price ?? offer.amount;

    app.db.prepare("UPDATE offers SET status='accepted', updated_at=datetime('now') WHERE id=?").run(offer.id);
    app.db.prepare("UPDATE offers SET status='declined', updated_at=datetime('now') WHERE listing_id=? AND id != ? AND status IN ('pending','countered')").run(offer.listing_id, offer.id);
    app.db.prepare("UPDATE listings SET status='sold', updated_at=datetime('now') WHERE id=?").run(offer.listing_id);

    const tx = app.db.prepare(
      'INSERT INTO transactions (listing_id, seller_id, buyer_id, offer_id, final_price) VALUES (?, ?, ?, ?, ?)'
    ).run(offer.listing_id, req.user.id, offer.buyer_id, offer.id, finalPrice);

    // Notify buyer
    app.db.prepare(
      "INSERT INTO notifications (user_id, type, payload) VALUES (?, 'offer_accepted', ?)"
    ).run(offer.buyer_id, JSON.stringify({ listing_id: offer.listing_id, listing_title: listing.title, final_price: finalPrice }));

    return { ok: true, transaction_id: tx.lastInsertRowid };
  });

  // POST /api/offers/:id/decline — seller declines
  app.post('/:id/decline', { preHandler: app.authenticate }, async (req, reply) => {
    const offer = app.db.prepare('SELECT * FROM offers WHERE id=?').get(req.params.id);
    if (!offer) return reply.code(404).send({ error: 'Offer not found' });

    const listing = app.db.prepare('SELECT * FROM listings WHERE id=?').get(offer.listing_id);
    if (listing.seller_id !== req.user.id) return reply.code(403).send({ error: 'Forbidden' });
    if (!['pending', 'countered'].includes(offer.status)) {
      return reply.code(400).send({ error: 'Offer cannot be declined in its current state' });
    }

    app.db.prepare("UPDATE offers SET status='declined', updated_at=datetime('now') WHERE id=?").run(offer.id);
    return { ok: true };
  });
}