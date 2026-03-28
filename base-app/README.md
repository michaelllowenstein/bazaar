# Stage 1: Planning

## App Concept Description

“Bazaar” is a local listings marketplace where users buy and sell second-hand items with built-in transparency signals. This differentiates it from common consumer-to-consumer marketplaces like Kijiji, or Craigslist. Buyers can see real market data from the application at the point of decision; conversely, sellers can see comparable listings that are active and/or recently sold when they create a listing.Metrics like view and offer counts and price indicators on every item they are selling.

### Target Domain

- Consumer-to-Consumer (C2C) E-Commerce Marketplace.

### Key Differentiator

- Demand and Price Transparency available on listing and browsing pages for easy access by sellers and buyers at the point of purchase.

---

## Base Feature List

### Authentication & Accounts

Email/password signup and login (JWT-based, stored in httpOnly cookie)
User profile page: display name, member since, avatar initial, rating summary
Logout

### Listings

Create a listing: title, description, category, condition, asking price, up to 3 photo URLs
Edit and delete own listings
Listings have statuses: `active`, `sold`, `removed`

### Browsing

Listings index page with category filter and basic pagination
Category taxonomy: Electronics, Clothing, Furniture, Books, Sports, Toys, Other
Condition labels: New, Like New, Good, Fair, Poor

### Offer System

Buyers can submit a single open offer on any active listing they don't own
Sellers can accept or decline offers from their listing page

### Market Transparency Signals

View count on each listing (stored in DB)
Open offer count displayed on listing detail page
"Market price" badge: average sold price of items in same category in last 30 days (shown on listing detail)

### Reviews

After a transaction completes, both buyer and seller can leave a 1–5 star rating + comment
User profile displays average rating and review count

### Watchlist

Users can watch/unwatch any active listing they don't own
Watched listings page under user account

### Navigation & Layout

Persistent nav: logo, search bar, post listing CTA, account menu
Footer with category links
Responsive layout (mobile-first Tailwind)

### Seed Data

5 users (1 admin-level, 4 regular)
30 listings across all categories and conditions
15 offers in various states (pending, accepted, declined)
10 completed transactions with reviews
View counts populated realistically

---

## Task JSON FIles

### Difficulty Distribution: 4 Easy + 3 Medium + 3 Hard

### TASK-01 · Easy · Keyword Search for Listings

{
 "id": "task-01",
 "name": "Keyword Search for Listings",
 "difficulty": "Easy",
 "description": "Add a keyword search feature that allows users to search active listings by title and description via the navigation search bar.",
 "acceptance_criteria": [
   "A search bar exists in the main navigation and is functional on all pages",
   "Submitting a query navigates to /search?q={query} and displays matching active listings",
   "Matching is case-insensitive and checks both title and description",
   "If no results are found, a 'No listings found' message is displayed",
   "Each result shows title, price, category, condition, and thumbnail",
   "An empty search query redirects to the main listings index"
 ]
}

---

### TASK-02 · Easy · Listing Sort Options

{
 "id": "task-02",
 "name": "Listing Sort Options",
 "difficulty": "Easy",
 "description": "Add a sort dropdown to the listings index and search results pages allowing users to order listings by different criteria.",
 "acceptance_criteria": [
   "A sort dropdown is visible on the listings index and search results pages",
   "Available options: 'Newest first' (default), 'Price: low to high', 'Price: high to low', 'Most viewed'",
   "Sorting is applied server-side and the selected option persists in the URL as a query param",
   "Sort selection is preserved when combined with an active category filter or search query"
 ]
}

---

### TASK-03 · Easy · Edit User Profile

{
 "id": "task-03",
 "name": "Edit User Profile",
 "difficulty": "Easy",
 "description": "Allow authenticated users to update their display name and a short bio from their profile page.",
 "acceptance_criteria": [
   "An 'Edit Profile' option is visible on the authenticated user's own profile page",
   "Fields: display name (required, 2–50 chars) and bio (optional, max 200 chars)",
   "Valid submissions update the record and reflect changes immediately",
   "Users cannot edit another user's profile"
 ]
}

---

### TASK-04 · Easy · Watchlist Activity Badge

{
 "id": "task-04",
 "name": "Watchlist Activity Badge",
 "difficulty": "Easy",
 "description": "Show a badge on the watchlist nav icon indicating how many watched listings have had new activity since the user last visited their watchlist.",
 "acceptance_criteria": [
   "A numeric badge appears on the watchlist nav link when unread activity exists",
   "Activity events are: a new offer on a watched listing, or a price change on a watched listing",
   "Visiting /watchlist clears the badge",
   "The badge is only visible to authenticated users"
 ]
}

---

### TASK-05 · Medium · Category Price History Chart

{
 "id": "task-05",
 "name": "Category Price History Chart",
 "difficulty": "Medium",
 "description": "Add a chart to each listing detail page showing average sold prices for items in the same category over the past 90 days, broken into weekly buckets.",
 "acceptance_criteria": [
   "A 'Market Price History' section appears on the listing detail page",
   "Chart data is fetched from GET /api/listings/:id/price-history and returns weekly avg_price buckets",
   "The listing's asking price is shown as a reference line on the chart",
   "If fewer than 3 completed sales exist in the category, a 'Not enough data' message replaces the chart"
 ]
}

---

### TASK-06 · Medium · Counter-Offer

{
 "id": "task-06",
 "name": "Counter-Offer on Offers",
 "difficulty": "Medium",
 "description": "Extend the offer system to allow sellers to respond with a counter-offer amount. Buyers can then accept or decline it.",
 "acceptance_criteria": [
   "Each pending offer on the seller's listing page shows Accept, Decline, and Counter actions",
   "A counter-offer records a counter_price and changes the offer status to 'countered'",
   "The buyer can accept or decline the counter-offer from their offers page",
   "Accepting a counter-offer completes the transaction at counter_price and marks the listing sold",
   "Only one counter-offer is permitted per offer"
 ]
}

---

### TASK-07 · Medium · Seller Dashboard

{
 "id": "task-07",
 "name": "Seller Activity Dashboard",
 "difficulty": "Medium",
 "description": "Add a private dashboard page summarising the authenticated user's selling activity.",
 "acceptance_criteria": [
   "Dashboard is accessible at /dashboard for authenticated users only",
   "Displays: active listing count, pending offer count, total revenue, and average days to sell",
   "Active listings are shown in a table with title, asking price, view count, and offer count",
   "Data is fetched from GET /api/users/me/dashboard on each visit"
 ]
}

---

### TASK-08 · Hard · Real-Time Offer Notifications via SSE

{
 "id": "task-08",
 "name": "Real-Time Offer Notifications via SSE",
 "difficulty": "Hard",
 "description": "Implement server-sent events so sellers receive an in-app toast notification when a new offer is placed on one of their listings.",
 "acceptance_criteria": [
   "Authenticated users connect to a personal SSE stream at GET /api/notifications/stream",
   "A new offer triggers a toast notification to the seller within 2 seconds",
   "If the seller is offline, the notification is stored and surfaced as an unread badge on next login",
   "SSE connections require authentication and handle reconnection gracefully"
 ]
}
\
---

### TASK-09 · Hard · Personalised Listing Recommendations

{
 "id": "task-09",
 "name": "Personalised Listing Recommendations",
 "difficulty": "Hard",
 "description": "Surface a 'Recommended for You' section on the homepage for authenticated users based on their browsing history and watchlist.",
 "acceptance_criteria": [
   "Authenticated users see 'Recommended for You'; unauthenticated users see 'Recently Listed'",
   "Recommendations from GET /api/recommendations return up to 8 active listings",
   "Algorithm weights: categories viewed in last 7 days (primary), watchlisted categories (secondary)",
   "Excludes listings the user owns or has already offered on",
   "Falls back to most-viewed listings if fewer than 3 browsing events exist"
 ]
}

---

### TASK-10 · Hard · Bulk Listing Import via CSV

{
 "id": "task-10",
 "name": "Bulk Listing Import via CSV",
 "difficulty": "Hard",
 "description": "Allow sellers to upload a CSV file to create multiple listings at once, with per-row validation and a structured import summary.",
 "acceptance_criteria": [
   "Import page accessible at /listings/import with a CSV upload form and downloadable template",
   "CSV columns: title, description, category, condition, price",
   "Valid rows are created as active listings; invalid rows are skipped with a per-row reason",
   "Import summary shows rows processed, listings created, and rows skipped",
   "Maximum 50 rows per file; files exceeding this are rejected before processing"
 ]
}

—-------------------------------------------------------------------------------------------
