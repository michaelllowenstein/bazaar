import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
 
const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || resolve(__dirname, '../../../data/bazaar.db');
 
const CATEGORIES = ['Electronics', 'Clothing', 'Furniture', 'Books', 'Sports', 'Toys', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
 
const USERS = [
  { email: 'alice@bazaar.pub', password: 'PublicPass1!', name: 'Alice Chen' },
  { email: 'bob@bazaar.pub',   password: 'PublicPass2!', name: 'Bob Hartley' },
  { email: 'carol@bazaar.pub', password: 'PublicPass3!', name: 'Carol Osei' },
  { email: 'dan@bazaar.pub',   password: 'PublicPass4!', name: 'Dan Kowalski' },
  { email: 'eve@bazaar.pub',   password: 'PublicPass5!', name: 'Eve Nakamura' },
];
 
const LISTINGS = [
  // Electronics (7)
  { seller: 0, title: 'Sony WH-1000XM4 Headphones', desc: 'Noise cancelling, barely used. Comes with case and all cables.', category: 'Electronics', condition: 'Like New', price: 220.00, image: '' },
  { seller: 1, title: 'iPad Air 4th Gen 64GB', desc: 'Space grey, WiFi only. Minor scratch on corner, screen perfect.', category: 'Electronics', condition: 'Good', price: 380.00, image: '' },
  { seller: 2, title: 'Logitech MX Master 3 Mouse', desc: 'Used for 6 months, excellent condition. USB-C charging.', category: 'Electronics', condition: 'Like New', price: 65.00, image: '' },
  { seller: 3, title: 'Kindle Paperwhite 11th Gen', desc: '8GB, black. Comes with original charging cable.', category: 'Electronics', condition: 'Good', price: 90.00, image: '' },
  { seller: 4, title: 'GoPro Hero 9 Black', desc: 'Used for 2 camping trips. All accessories included.', category: 'Electronics', condition: 'Good', price: 175.00, image: '' },
  { seller: 0, title: 'Nintendo Switch Lite (Yellow)', desc: 'Works perfectly. No scratches. Selling because I have the OLED now.', category: 'Electronics', condition: 'Like New', price: 160.00, image: '' },
  { seller: 1, title: 'Anker PowerCore 26800mAh', desc: 'Large capacity power bank. Charges 3 devices. Box included.', category: 'Electronics', condition: 'New', price: 45.00, image: '' },
 
  // Clothing (5)
  { seller: 2, title: 'Patagonia Nano Puff Jacket (M)', desc: 'Black, men\'s medium. Worn twice, no damage. Great insulation.', category: 'Clothing', condition: 'Like New', price: 120.00, image: '' },
  { seller: 3, title: 'Levi\'s 501 Jeans W32 L30', desc: 'Classic straight fit. Light wash, good condition.', category: 'Clothing', condition: 'Good', price: 35.00, image: '' },
  { seller: 4, title: 'Allbirds Tree Runners (W9)', desc: 'Sage green, women\'s size 9. About 4 months of use.', category: 'Clothing', condition: 'Good', price: 55.00, image: '' },
  { seller: 0, title: 'Arc\'teryx Beta AR Jacket (S)', desc: 'Hardshell, men\'s small. Some light scuff on left shoulder.', category: 'Clothing', condition: 'Fair', price: 280.00, image: '' },
  { seller: 1, title: 'Uniqlo Ultra Light Down Vest (L)', desc: 'Women\'s large, navy. Packable and warm.', category: 'Clothing', condition: 'Like New', price: 28.00, image: '' },
 
  // Furniture (4)
  { seller: 2, title: 'IKEA KALLAX 4x2 Shelf Unit', desc: 'White, excellent condition. Disassembled for pickup.', category: 'Furniture', condition: 'Good', price: 60.00, image: '' },
  { seller: 3, title: 'Adjustable Standing Desk 140cm', desc: 'Electric height adjustment. Dark walnut top, black frame.', category: 'Furniture', condition: 'Good', price: 240.00, image: '' },
  { seller: 4, title: 'Herman Miller Aeron Chair (B)', desc: 'Size B, graphite. Remanufactured by dealer 2 years ago.', category: 'Furniture', condition: 'Good', price: 650.00, image: '' },
  { seller: 0, title: 'West Elm Mid-Century Coffee Table', desc: 'Walnut and brass legs. Minor ring mark on top.', category: 'Furniture', condition: 'Fair', price: 180.00, image: '' },
 
  // Books (4)
  { seller: 1, title: 'Designing Data-Intensive Applications', desc: 'Martin Kleppmann. Hardcover, highlights throughout.', category: 'Books', condition: 'Good', price: 28.00, image: '' },
  { seller: 2, title: 'The Art of Electronics 3rd Ed', desc: 'Horowitz & Hill. No markings, like new.', category: 'Books', condition: 'Like New', price: 60.00, image: '' },
  { seller: 3, title: 'Atomic Habits', desc: 'James Clear. Paperback, perfect condition.', category: 'Books', condition: 'Like New', price: 12.00, image: '' },
  { seller: 4, title: 'Dune (Box Set 1-3)', desc: 'Frank Herbert. Mass market paperbacks, some yellowing.', category: 'Books', condition: 'Fair', price: 18.00, image: '' },
 
  // Sports (4)
  { seller: 0, title: 'Garmin Forerunner 255 Watch', desc: 'Black, 46mm. GPS running watch, GPS accurate, battery 14h.', category: 'Sports', condition: 'Good', price: 195.00, image: '' },
  { seller: 1, title: 'Osprey Atmos AG 65L Backpack', desc: 'Men\'s M/L. Used on two multi-day hikes. Good shape.', category: 'Sports', condition: 'Good', price: 130.00, image: '' },
  { seller: 2, title: 'Bowflex SelectTech 552 Dumbbells', desc: 'Pair, adjustable 5-52.5lbs. No stand.', category: 'Sports', condition: 'Good', price: 270.00, image: '' },
  { seller: 3, title: 'Trek FX 2 Disc Hybrid Bike', desc: '2021, 54cm frame. Matte black. New brake pads last month.', category: 'Sports', condition: 'Good', price: 520.00, image: '' },
 
  // Toys (3)
  { seller: 4, title: 'LEGO Technic Land Rover Defender', desc: '42110, complete with box and instructions.', category: 'Toys', condition: 'Like New', price: 110.00, image: '' },
  { seller: 0, title: 'Melissa & Doug Wooden Railway Set', desc: '130 pieces, complete. Minor paint wear on some tracks.', category: 'Toys', condition: 'Good', price: 40.00, image: '' },
  { seller: 1, title: 'Ravensburger 5000 Piece Puzzle', desc: '"Colourful World" — complete, once assembled.', category: 'Toys', condition: 'Good', price: 22.00, image: '' },
 
  // Other (3)
  { seller: 2, title: 'Weber Q1200 Portable Gas BBQ', desc: 'Black, propane. Used two summers. Clean, no rust.', category: 'Other', condition: 'Good', price: 145.00, image: '' },
  { seller: 3, title: 'DJI Mini 2 Drone Fly More Combo', desc: 'All 3 batteries, charging hub, bag. 80 flights on main battery.', category: 'Other', condition: 'Good', price: 330.00, image: '' },
  { seller: 4, title: 'Vitamix 5200 Blender', desc: 'Classic series, black. Works perfectly. Includes tamper.', category: 'Other', condition: 'Good', price: 195.00, image: '' },
];
 
// Offers: [listingIndex, buyerIndex, amount, status]
const OFFERS = [
  [0,  1, 195.00, 'pending'],
  [1,  2, 340.00, 'pending'],
  [2,  3,  55.00, 'declined'],
  [3,  4,  80.00, 'accepted'],
  [4,  0, 150.00, 'pending'],
  [5,  2, 140.00, 'accepted'],
  [6,  3,  40.00, 'declined'],
  [7,  4, 100.00, 'pending'],
  [8,  0,  30.00, 'accepted'],
  [9,  1,  48.00, 'pending'],
  [10, 2, 250.00, 'accepted'],
  [11, 3, 580.00, 'declined'],
  [12, 4,  55.00, 'accepted'],
  [13, 0, 160.00, 'accepted'],
  [14, 1, 180.00, 'pending'],
];
 
// Transactions: [listingIndex, offerIndex, finalPrice]
// Only for accepted offers
const TRANSACTIONS = [
  [3,  3,  80.00],
  [5,  5, 140.00],
  [8,  8,  30.00],
  [10, 10, 250.00],
  [12, 12,  55.00],
  [13, 13, 160.00],
];
 
function run() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
 
  // Wipe existing data
  db.exec(`
    DELETE FROM reviews; DELETE FROM transactions; DELETE FROM watchlist_events;
    DELETE FROM watchlist; DELETE FROM browsing_history; DELETE FROM notifications;
    DELETE FROM offers; DELETE FROM listings; DELETE FROM users;
  `);
 
  // Insert users
  const insertUser = db.prepare(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
  );
  const userIds = USERS.map(u => {
    const hash = bcrypt.hashSync(u.password, 10);
    const info = insertUser.run(u.email, hash, u.name);
    return info.lastInsertRowid;
  });
 
  // Insert listings
  const insertListing = db.prepare(`
    INSERT INTO listings (seller_id, title, description, category, condition, price, status, view_count, image_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, '', datetime('now', '-' || ? || ' days'))
  `);
  const listingIds = LISTINGS.map((l, i) => {
    const views = 10 + (i * 7) % 90;
    const daysAgo = (i * 3) % 45;
    const info = insertListing.run(userIds[l.seller], l.title, l.desc, l.category, l.condition, l.price, views, daysAgo);
    return info.lastInsertRowid;
  });
 
  // Insert offers
  const insertOffer = db.prepare(`
    INSERT INTO offers (listing_id, buyer_id, amount, status, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
  `);
  const offerIds = OFFERS.map(([li, bi, amount, status], i) => {
    const daysAgo = i % 20;
    const info = insertOffer.run(listingIds[li], userIds[bi], amount, status, daysAgo);
    return info.lastInsertRowid;
  });
 
  // Mark accepted listing statuses as sold and insert transactions
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
 
  // Insert reviews (both directions for each transaction)
  const insertReview = db.prepare(`
    INSERT OR IGNORE INTO reviews (transaction_id, reviewer_id, reviewee_id, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `);
  const getTxId = db.prepare('SELECT id, seller_id, buyer_id FROM transactions WHERE listing_id=? LIMIT 1');
 
  TRANSACTIONS.forEach(([li]) => {
    const tx = getTxId.get(listingIds[li]);
    if (!tx) return;
    insertReview.run(tx.id, tx.buyer_id,  tx.seller_id, 5, 'Great seller, item exactly as described.');
    insertReview.run(tx.id, tx.seller_id, tx.buyer_id,  4, 'Smooth transaction, recommended buyer.');
  });
 
  // Watchlist — each user watches a few active listings they don't own
  const insertWatch = db.prepare(
    'INSERT OR IGNORE INTO watchlist (user_id, listing_id) VALUES (?, ?)'
  );
  [[0,5],[0,12],[1,2],[1,15],[2,0],[2,20],[3,7],[3,25],[4,1],[4,18]].forEach(([ui, li]) => {
    if (li < listingIds.length) insertWatch.run(userIds[ui], listingIds[li]);
  });
 
  // Browsing history — populate for recommendation engine tasks later
  const insertBrowse = db.prepare(
    "INSERT INTO browsing_history (user_id, listing_id, created_at) VALUES (?, ?, datetime('now', '-' || ? || ' hours'))"
  );
  [[0,1,2],[0,2,4],[0,6,6],[1,7,1],[1,8,3],[1,12,8],[2,0,2],[2,14,5],[3,20,1],[3,21,3],[4,4,2],[4,5,6]].forEach(([ui, li, h]) => {
    if (li < listingIds.length) insertBrowse.run(userIds[ui], listingIds[li], h);
  });
 
  db.close();
  console.log('Public seed complete.');
  console.log('Public credentials:');
  USERS.forEach(u => console.log(`  ${u.email} / ${u.password}`));
}
 
run();