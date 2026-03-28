import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
 
const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || resolve(__dirname, '../../../data/bazaar.db');
 
export function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}
 
export function migrate() {
  const db = getDb();
 
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      name       TEXT    NOT NULL,
      bio        TEXT    NOT NULL DEFAULT '',
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
 
    CREATE TABLE IF NOT EXISTS listings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id   INTEGER NOT NULL REFERENCES users(id),
      title       TEXT    NOT NULL,
      description TEXT    NOT NULL,
      category    TEXT    NOT NULL,
      condition   TEXT    NOT NULL,
      price       REAL    NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'active',
      view_count  INTEGER NOT NULL DEFAULT 0,
      image_url   TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
 
    CREATE TABLE IF NOT EXISTS offers (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id    INTEGER NOT NULL REFERENCES listings(id),
      buyer_id      INTEGER NOT NULL REFERENCES users(id),
      amount        REAL    NOT NULL,
      status        TEXT    NOT NULL DEFAULT 'pending',
      counter_price REAL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
 
    CREATE TABLE IF NOT EXISTS transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id  INTEGER NOT NULL REFERENCES listings(id),
      seller_id   INTEGER NOT NULL REFERENCES users(id),
      buyer_id    INTEGER NOT NULL REFERENCES users(id),
      offer_id    INTEGER NOT NULL REFERENCES offers(id),
      final_price REAL    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
 
    CREATE TABLE IF NOT EXISTS reviews (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id),
      reviewer_id    INTEGER NOT NULL REFERENCES users(id),
      reviewee_id    INTEGER NOT NULL REFERENCES users(id),
      rating         INTEGER NOT NULL,
      comment        TEXT    NOT NULL DEFAULT '',
      created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(transaction_id, reviewer_id)
    );
 
    CREATE TABLE IF NOT EXISTS watchlist (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id),
      listing_id  INTEGER NOT NULL REFERENCES listings(id),
      last_read   TEXT    NOT NULL DEFAULT (datetime('now')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, listing_id)
    );
 
    CREATE TABLE IF NOT EXISTS watchlist_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL REFERENCES listings(id),
      event_type TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
 
    CREATE TABLE IF NOT EXISTS browsing_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      listing_id INTEGER NOT NULL REFERENCES listings(id),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
 
    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      type       TEXT    NOT NULL,
      payload    TEXT    NOT NULL DEFAULT '{}',
      read       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
 
    CREATE INDEX IF NOT EXISTS idx_listings_status   ON listings(status);
    CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
    CREATE INDEX IF NOT EXISTS idx_listings_seller   ON listings(seller_id);
    CREATE INDEX IF NOT EXISTS idx_offers_listing    ON offers(listing_id);
    CREATE INDEX IF NOT EXISTS idx_offers_buyer      ON offers(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_watchlist_user    ON watchlist(user_id);
    CREATE INDEX IF NOT EXISTS idx_browsing_user     ON browsing_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user        ON notifications(user_id);
  `);
 
  db.close();
  console.log('Migration complete.');
}
 
migrate();