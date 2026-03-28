const BASE = '/api';

async function request(method, path, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

const get  = (path)        => request('GET',    path);
const post = (path, body)  => request('POST',   path, body);
const patch= (path, body)  => request('PATCH',  path, body);
const del  = (path)        => request('DELETE', path);

// Auth
export const auth = {
  signup: (email, password, name)  => post('/auth/signup', { email, password, name }),
  login:  (email, password)        => post('/auth/login',  { email, password }),
  logout: ()                       => post('/auth/logout'),
  me:     ()                       => get('/auth/me'),
};

// Listings
export const listings = {
  list:         (params = {})    => get(`/listings?${new URLSearchParams(params)}`),
  search:       (params = {})    => get(`/listings/search?${new URLSearchParams(params)}`),
  get:          (id)             => get(`/listings/${id}`),
  priceHistory: (id)             => get(`/listings/${id}/price-history`),
  mine:         ()               => get('/listings/mine'),
  create:       (data)           => post('/listings', data),
  update:       (id, data)       => patch(`/listings/${id}`, data),
  remove:       (id)             => del(`/listings/${id}`),
};

// Offers
export const offers = {
  create:        (listing_id, amount) => post('/offers', { listing_id, amount }),
  mine:          ()                   => get('/offers/mine'),
  forListing:    (listingId)          => get(`/offers/listing/${listingId}`),
  accept:        (id)                 => post(`/offers/${id}/accept`),
  decline:       (id)                 => post(`/offers/${id}/decline`),
};

// Users
export const users = {
  get:          (id)    => get(`/users/${id}`),
  updateMe:     (data)  => patch('/users/me', data),
  dashboard:    ()      => get('/users/me/dashboard'),
  notifications:()      => get('/users/me/notifications'),
};

// Watchlist
export const watchlist = {
  list:    ()         => get('/watchlist'),
  badge:   ()         => get('/watchlist/badge'),
  watch:   (listingId)=> post(`/watchlist/${listingId}`),
  unwatch: (listingId)=> del(`/watchlist/${listingId}`),
};

// Reviews
export const reviews = {
  submit:  (transaction_id, rating, comment) => post('/reviews', { transaction_id, rating, comment }),
  pending: ()                                => get('/reviews/pending'),
};