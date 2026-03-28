export function formatPrice(n) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n ?? 0);
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso));
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return formatDate(iso);
}

export const CATEGORIES = ['Electronics', 'Clothing', 'Furniture', 'Books', 'Sports', 'Toys', 'Other'];
export const CONDITIONS  = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

export const CONDITION_CLASS = {
  'New':      'badge-condition-new',
  'Like New': 'badge-condition-like-new',
  'Good':     'badge-condition-good',
  'Fair':     'badge-condition-fair',
  'Poor':     'badge-condition-poor',
};

export const CONDITION_SLUG = {
  'New':      'new',
  'Like New': 'like-new',
  'Good':     'good',
  'Fair':     'fair',
  'Poor':     'poor',
};

export function conditionClass(c) {
  return CONDITION_CLASS[c] ?? 'badge';
}

export function statusClass(s) {
  const map = { active: 'badge-status-active', sold: 'badge-status-sold', pending: 'badge-status-pending' };
  return map[s] ?? 'badge';
}

export function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function stars(n) {
  return '★'.repeat(Math.round(n ?? 0)) + '☆'.repeat(5 - Math.round(n ?? 0));
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}