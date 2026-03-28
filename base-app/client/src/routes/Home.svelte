<script>
  import { onMount } from 'svelte';
  import { listings as listingsApi } from '../lib/api.js';
  import { navigate } from '../lib/utils.js';
  import ListingCard from '../components/ui/ListingCard.svelte';
  import SortBar from '../components/ui/SortBar.svelte';

  let items   = [];
  let total   = 0;
  let loading = true;
  let page    = 1;
  let sort    = 'newest';
  let category = '';

  function parseParams() {
    const p = new URLSearchParams(window.location.search);
    category = p.get('category') || '';
    sort     = p.get('sort')     || 'newest';
    page     = parseInt(p.get('page') || '1', 10);
  }

  async function load() {
    loading = true;
    try {
      const params = { sort, page };
      if (category) params.category = category;
      const data = await listingsApi.list(params);
      items = data.listings;
      total = data.total;
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function updateUrl() {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (sort !== 'newest') p.set('sort', sort);
    if (page > 1) p.set('page', page);
    const qs = p.toString();
    window.history.replaceState({}, '', qs ? `/?${qs}` : '/');
  }

  function onSort(e) {
    sort = e.detail;
    page = 1;
    updateUrl();
    load();
  }

  function goPage(n) {
    page = n;
    updateUrl();
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onMount(() => {
    parseParams();
    load();
    const handler = () => { parseParams(); load(); };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  });

  $: totalPages = Math.ceil(total / 12);
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

  <!-- Header row -->
  <div class="mb-6 flex items-end justify-between">
    <div>
      {#if category}
        <p class="text-xs text-ink-500 mb-1 uppercase tracking-wide">Category</p>
        <h1 class="page-title">{category}</h1>
      {:else}
        <h1 class="page-title">Browse Listings</h1>
      {/if}
    </div>

    {#if category}
      <button on:click={() => { category = ''; page = 1; updateUrl(); load(); }}
              class="btn-ghost text-sm text-ink-500">
        Clear filter ✕
      </button>
    {/if}
  </div>

  <SortBar {sort} {total} on:sort={onSort} />

  {#if loading}
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
      {#each Array(8) as _}
        <div class="card aspect-[3/4] animate-pulse bg-ink-100 rounded-xl"></div>
      {/each}
    </div>

  {:else if items.length === 0}
    <div class="text-center py-24">
      <p class="text-4xl mb-4">🏷️</p>
      <p class="text-ink-500">No listings found{category ? ` in ${category}` : ''}.</p>
      {#if category}
        <button on:click={() => { category = ''; updateUrl(); load(); }} class="btn-secondary mt-4">
          View all listings
        </button>
      {/if}
    </div>

  {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2" data-testid="listings-grid">
      {#each items as listing (listing.id)}
        <ListingCard {listing} />
      {/each}
    </div>

    <!-- Pagination -->
    {#if totalPages > 1}
      <div class="flex items-center justify-center gap-2 mt-10">
        <button disabled={page <= 1} on:click={() => goPage(page - 1)} class="btn-secondary px-3">←</button>
        {#each Array(totalPages) as _, i}
          <button
            on:click={() => goPage(i + 1)}
            class="w-9 h-9 rounded-lg text-sm font-medium transition-colors
                   {page === i+1 ? 'bg-bazaar-600 text-white' : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'}">
            {i + 1}
          </button>
        {/each}
        <button disabled={page >= totalPages} on:click={() => goPage(page + 1)} class="btn-secondary px-3">→</button>
      </div>
    {/if}
  {/if}
</div>