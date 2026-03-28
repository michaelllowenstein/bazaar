import bcrypt from 'bcryptjs';

export default async function authRoutes(app) {
  // POST /api/auth/signup
  app.post('/signup', async (req, reply) => {
    const { email, password, name } = req.body ?? {};

    if (!email || !password || !name) {
      return reply.code(400).send({ error: 'email, password, and name are required' });
    }
    if (password.length < 8) {
      return reply.code(400).send({ error: 'Password must be at least 8 characters' });
    }
    if (name.trim().length < 2 || name.trim().length > 50) {
      return reply.code(400).send({ error: 'Name must be between 2 and 50 characters' });
    }

    const existing = app.db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
    if (existing) {
      return reply.code(409).send({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const info = app.db.prepare(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
    ).run(email.toLowerCase(), hash, name.trim());

    const user = app.db.prepare('SELECT id, email, name, bio, created_at FROM users WHERE id=?').get(info.lastInsertRowid);
    const token = app.jwt.sign({ id: user.id, email: user.email });

    return reply
      .setCookie('token', token, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 86400 * 7 })
      .code(201)
      .send({ user });
  });

  // POST /api/auth/login
  app.post('/login', async (req, reply) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return reply.code(400).send({ error: 'email and password are required' });
    }

    const user = app.db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase());
    if (!user) return reply.code(401).send({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return reply.code(401).send({ error: 'Invalid credentials' });

    const token = app.jwt.sign({ id: user.id, email: user.email });
    const { password: _, ...safe } = user;

    return reply
      .setCookie('token', token, { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 86400 * 7 })
      .send({ user: safe });
  });

  // POST /api/auth/logout
  app.post('/logout', async (req, reply) => {
    return reply.clearCookie('token', { path: '/' }).send({ ok: true });
  });

  // GET /api/auth/me
  app.get('/me', { preHandler: app.authenticate }, async (req, reply) => {
    const user = app.db.prepare(
      'SELECT id, email, name, bio, created_at FROM users WHERE id=?'
    ).get(req.user.id);
    if (!user) return reply.code(404).send({ error: 'User not found' });

    const unread = app.db.prepare(
      'SELECT COUNT(*) as n FROM notifications WHERE user_id=? AND read=0'
    ).get(req.user.id);

    return { user, unreadCount: unread.n };
  });
}