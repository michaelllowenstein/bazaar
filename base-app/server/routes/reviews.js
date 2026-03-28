export default async function reviewRoutes(app) {

  // POST /api/reviews — submit review for a completed transaction
  app.post('/', { preHandler: app.authenticate }, async (req, reply) => {
    const { transaction_id, rating, comment = '' } = req.body ?? {};

    if (!transaction_id || !rating) {
      return reply.code(400).send({ error: 'transaction_id and rating are required' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return reply.code(400).send({ error: 'rating must be an integer between 1 and 5' });
    }
    if (comment.length > 500) {
      return reply.code(400).send({ error: 'comment max 500 characters' });
    }

    const tx = app.db.prepare('SELECT * FROM transactions WHERE id=?').get(transaction_id);
    if (!tx) return reply.code(404).send({ error: 'Transaction not found' });

    // Determine who the reviewee is
    let reviewee_id;
    if (tx.buyer_id === req.user.id)       reviewee_id = tx.seller_id;
    else if (tx.seller_id === req.user.id) reviewee_id = tx.buyer_id;
    else return reply.code(403).send({ error: 'You are not part of this transaction' });

    const existing = app.db.prepare(
      'SELECT id FROM reviews WHERE transaction_id=? AND reviewer_id=?'
    ).get(transaction_id, req.user.id);
    if (existing) return reply.code(409).send({ error: 'You have already reviewed this transaction' });

    app.db.prepare(
      'INSERT INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)'
    ).run(transaction_id, req.user.id, reviewee_id, rating, comment);

    return reply.code(201).send({ ok: true });
  });

  // GET /api/reviews/pending — transactions the user can still review
  app.get('/pending', { preHandler: app.authenticate }, async (req) => {
    const rows = app.db.prepare(`
      SELECT t.id as transaction_id, t.final_price, t.created_at,
             l.title as listing_title, l.id as listing_id,
             CASE WHEN t.buyer_id=? THEN t.seller_id ELSE t.buyer_id END as reviewee_id,
             CASE WHEN t.buyer_id=? THEN su.name ELSE bu.name END as reviewee_name
      FROM transactions t
      JOIN listings l ON l.id=t.listing_id
      JOIN users su ON su.id=t.seller_id
      JOIN users bu ON bu.id=t.buyer_id
      WHERE (t.buyer_id=? OR t.seller_id=?)
        AND NOT EXISTS (
          SELECT 1 FROM reviews r WHERE r.transaction_id=t.id AND r.reviewer_id=?
        )
      ORDER BY t.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

    return { pending: rows };
  });
}