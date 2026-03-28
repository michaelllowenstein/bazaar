import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || resolve(__dirname, '../../../data/bazaar.db');

const USERS = [
  { email: 'marco@bazaar.priv',  password: 'PrivatePass1!', name: 'Marco Rossi' },
  { email: 'priya@bazaar.priv',  password: 'PrivatePass2!', name: 'Priya Mehta' },
  { email: 'leon@bazaar.priv',   password: 'PrivatePass3!', name: 'Leon Fischer' },
  { email: 'fatima@bazaar.priv', password: 'PrivatePass4!', name: 'Fatima Al-Rashid' },
  { email: 'jin@bazaar.priv',    password: 'PrivatePass5!', name: 'Jin Park' },
];

const LISTINGS = [
  // Electronics (7)
  { seller: 0, title: 'Bose QuietComfort 45', desc: 'White, excellent ANC. Case, cables, and 3.5mm adapter included.', category: 'Electronics', condition: 'Like New', price: 240.00 },
  { seller: 1, title: 'Samsung Galaxy Tab S7', desc: '128GB, mystic navy. S Pen included, no charger.', category: 'Electronics', condition: 'Good', price: 310.00 },
  { seller: 2, title: 'Razer DeathAdder V3 Mouse', desc: 'Wired, bought 4 months ago. Pads still original.', category: 'Electronics', condition: 'Like New', price: 55.00 },
  { seller: 3, title: 'Kobo Sage eReader', desc: '32GB, black. Includes SleepCover case.', category: 'Electronics', condition: 'Good', price: 115.00 },
  { seller: 4, title: 'DJI Osmo Pocket 3', desc: 'Mini camera gimbal, 60fps 4K. Excellent condition.', category: 'Electronics', condition: 'Like New', price: 290.00 },
  { seller: 0, title: 'Steam Deck 512GB OLED', desc: 'Purchased 6 months ago. Carrying case included.', category: 'Electronics', condition: 'Good', price: 510.00 },
  { seller: 1, title: 'Belkin 3-in-1 MagSafe Charger', desc: 'White, charges iPhone/Watch/AirPods simultaneously.', category: 'Electronics', condition: 'New', price: 38.00 },

  // Clothing (5)
  { seller: 2, title: 'Canada Goose Hybridge Lite Vest (L)', desc: 'Black, men\'s large. Excellent warmth-to-weight ratio.', category: 'Clothing', condition: 'Good', price: 190.00 },
  { seller: 3, title: 'Nudie Jeans Thin Finn W31 L32', desc: 'Organic cotton, dry denim. Minimal fade, great fit.', category: 'Clothing', condition: 'Good', price: 50.00 },
  { seller: 4, title: 'Hoka Clifton 9 (M11)', desc: 'Navy, men\'s 11. About 200km of use, still good cushioning.', category: 'Clothing', condition: 'Fair', price: 65.00 },
  { seller: 0, title: 'Fjallraven Vidda Pro Trousers (M)', desc: 'Green, men\'s medium. Hiking trousers, barely used.', category: 'Clothing', condition: 'Like New', price: 95.00 },
  { seller: 1, title: 'COS Wool Turtleneck (S)', desc: 'Women\'s small, cream. Worn once, dry cleaned.', category: 'Clothing', condition: 'Like New', price: 42.00 },

  // Furniture (4)
  { seller: 2, title: 'IKEA EXPEDIT Bookcase 5x5', desc: 'Black-brown. All inserts included. Pickup only.', category: 'Furniture', condition: 'Good', price: 75.00 },
  { seller: 3, title: 'Flexispot E7 Standing Desk 160cm', desc: 'Bamboo top, white frame. Dual motor, very stable.', category: 'Furniture', condition: 'Good', price: 320.00 },
  { seller: 4, title: 'Steelcase Leap V2 Chair', desc: 'Blue fabric, fully adjustable. Refurbished 18 months ago.', category: 'Furniture', condition: 'Good', price: 590.00 },
  { seller: 0, title: 'Article Sven Sofa (2-seat)', desc: 'Charcoal, mid-century style. Cat scratches on one arm.', category: 'Furniture', condition: 'Fair', price: 420.00 },

  // Books (4)
  { seller: 1, title: 'Clean Architecture – Robert Martin', desc: 'Hardcover, no markings. Excellent read.', category: 'Books', condition: 'Like New', price: 32.00 },
  { seller: 2, title: 'The Pragmatic Programmer 20th Ed', desc: 'Paperback, some dog-ears. Great condition overall.', category: 'Books', condition: 'Good', price: 25.00 },
  { seller: 3, title: 'Thinking, Fast and Slow', desc: 'Daniel Kahneman. Mass market paperback, light highlighting.', category: 'Books', condition: 'Good', price: 10.00 },
  { seller: 4, title: 'Malazan Book of the Fallen Box Set', desc: '10 volume set. Some spine cracking, all complete.', category: 'Books', condition: 'Good', price: 65.00 },

  // Sports (4)
  { seller: 0, title: 'Wahoo ELEMNT BOLT GPS Bike Computer', desc: 'V2, white. Mount, charging cable included.', category: 'Sports', condition: 'Good', price: 175.00 },
  { seller: 1, title: 'Black Diamond Momentum Harness (M)', desc: 'Men\'s medium. Used one season, no falls.', category: 'Sports', condition: 'Good', price: 48.00 },
  { seller: 2, title: 'TRX Home2 Suspension Trainer', desc: 'Full kit with door anchor and carry bag.', category: 'Sports', condition: 'Like New', price: 90.00 },
  { seller: 3, title: 'Cannondale Trail 5 Mountain Bike', desc: '2022, 29", medium frame. Hydraulic disc brakes.', category: 'Sports', condition: 'Good', price: 680.00 },

  // Toys (3)
  { seller: 4, title: 'LEGO Creator Expert Eiffel Tower', desc: '10307, all pieces, original box and instructions.', category: 'Toys', condition: 'New', price: 220.00 },
  { seller: 0, title: 'Plan Toys City Blocks', desc: '32-piece wooden block set. Very gentle use.', category: 'Toys', condition: 'Like New', price: 35.00 },
  { seller: 1, title: 'Catan Base Game + Seafarers Expansion', desc: 'Both in original boxes, complete and unpunched.', category: 'Toys', condition: 'Good', price: 55.00 },

  // Other (3)
  { seller: 2, title: 'Napoleon Rogue 425 Gas BBQ', desc: 'Stainless, propane. Bought 3 years ago, well maintained.', category: 'Other', condition: 'Good', price: 360.00 },
  { seller: 3, title: 'Mavic Mini 3 Pro Fly More Combo', desc: 'All 3 batteries, ND filters, charging hub. 110 flights total.', category: 'Other', condition: 'Good', price: 480.00 },
  { seller: 4, title: 'Breville Barista Express Espresso Machine', desc: 'Black sesame, built-in grinder. Descaled and cleaned.', category: 'Other', condition: 'Good', price: 450.00 },
];

const OFFERS = [
  [0,  1, 210.00, 'pending'],
  [1,  2, 280.00, 'pending'],
  [2,  3,  45.00, 'declined'],
  [3,  4, 100.00, 'accepted'],
  [4,  0, 250.00, 'pending'],
  [5,  2, 470.00, 'accepted'],
  [6,  3,  32.00, 'declined'],
  [7,  4, 160.00, 'pending'],
  [8,  0,  60.00, 'accepted'],
  [9,  1,  22.00, 'pending'],
  [10, 2, 140.00, 'accepted'],
  [11, 3, 520.00, 'declined'],
  [12, 4, 195.00, 'accepted'],
  [13, 0, 390.00, 'accepted'],
  [14, 1,  80.00, 'pending'],
];

const TRANSACTIONS = [
  [3,  3,  100.00],
  [5,  5,  470.00],
  [8,  8,   60.00],
  [10, 10, 140.00],
  [12, 12, 195.00],
  [13, 13, 390.00],
];

function run() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    DELETE FROM reviews; DELETE FROM transactions; DELETE FROM watchlist_events;
    DELETE FROM watchlist; DELETE FROM browsing_history; DELETE FROM notifications;
    DELETE FROM offers; DELETE FROM listings; DELETE FROM users;
  `);

  const insertUser = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
  const userIds = USERS.map(u => {
    const hash = bcrypt.hashSync(u.password, 10);
    return insertUser.run(u.email, hash, u.name).lastInsertRowid;
  });

  const insertListing = db.prepare(`
    INSERT INTO listings (seller_id, title, description, category, condition, price, status, view_count, image_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, '', datetime('now', '-' || ? || ' days'))
  `);
  const listingIds = LISTINGS.map((l, i) => {
    const views = 15 + (i * 11) % 80;
    const daysAgo = (i * 4) % 50;
    return insertListing.run(userIds[l.seller], l.title, l.desc, l.category, l.condition, l.price, views, daysAgo).lastInsertRowid;
  });

  const insertOffer = db.prepare(`
    INSERT INTO offers (listing_id, buyer_id, amount, status, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);
  const offerIds = OFFERS.map(([li, bi, amount, status], i) => {
    return insertOffer.run(listingIds[li], userIds[bi], amount, status, i % 18).lastInsertRowid;
  });

  const insertTx = db.prepare(`
    INSERT INTO transactions (listing_id, seller_id, buyer_id, offer_id, final_price, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);
  const markSold = db.prepare(`UPDATE listings SET status='sold' WHERE id=?`);

  TRANSACTIONS.forEach(([li, oi, price], i) => {
    const listing = LISTINGS[li];
    const offer   = OFFERS[oi];
    markSold.run(listingIds[li]);
    insertTx.run(listingIds[li], userIds[listing.seller], userIds[offer[1]], offerIds[oi], price, i + 1);
  });

  const insertReview = db.prepare(`
    INSERT OR IGNORE INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `);
  const getTxId = db.prepare('SELECT id, seller_id, buyer_id FROM transactions WHERE listing_id=? LIMIT 1');

  TRANSACTIONS.forEach(([li]) => {
    const tx = getTxId.get(listingIds[li]);
    if (!tx) return;
    insertReview.run(tx.id, tx.buyer_id,  tx.seller_id, 5, 'Item was exactly as described. Would buy again.');
    insertReview.run(tx.id, tx.seller_id, tx.buyer_id,  4, 'Reliable buyer, easy transaction.');
  });

  const insertWatch = db.prepare('INSERT OR IGNORE INTO watchlist (user_id, listing_id) VALUES (?, ?)');
  [[0,4],[0,11],[1,3],[1,16],[2,1],[2,22],[3,6],[3,24],[4,2],[4,19]].forEach(([ui, li]) => {
    if (li < listingIds.length) insertWatch.run(userIds[ui], listingIds[li]);
  });

  const insertBrowse = db.prepare(
    "INSERT INTO browsing_history (user_id, listing_id, created_at) VALUES (?, ?, datetime('now', '-' || ? || ' hours'))"
  );
  [[0,2,3],[0,3,5],[0,7,7],[1,6,2],[1,9,4],[1,13,9],[2,1,3],[2,15,6],[3,21,2],[3,22,4],[4,5,3],[4,6,7]].forEach(([ui, li, h]) => {
    if (li < listingIds.length) insertBrowse.run(userIds[ui], listingIds[li], h);
  });

  db.close();
  console.log('Private seed complete.');
  console.log('Private credentials:');
  USERS.forEach(u => console.log(`  ${u.email} / ${u.password}`));
}

run();