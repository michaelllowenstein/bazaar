<script>
  import { onMount } from 'svelte';
  import { authStore } from '../../lib/stores.js';
  import { watchlist } from '../../lib/api.js';
  import { navigate } from '../../lib/utils.js';

  let query = '';
  let menuOpen = false;
  let badgeCount = 0;

  $: user = $authStore.user;
  $: unreadCount = $authStore.unreadCount ?? 0;

  onMount(async () => {
    if (user) refreshBadge();
    const interval = setInterval(() => { if (user) refreshBadge(); }, 30000);
    return () => clearInterval(interval);
  });

  async function refreshBadge() {
    try {
      const d = await watchlist.badge();
      badgeCount = d.count;
    } catch { /* silent */ }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) { navigate('/'); return; }
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    query = '';
  }

  async function logout() {
    await authStore.logout();
    navigate('/');
  }

  // Sync query from URL on navigation
  function syncQuery() {
    const p = new URLSearchParams(window.location.search);
    query = p.get('q') || '';
  }

  onMount(() => {
    syncQuery();
    window.addEventListener('popstate', syncQuery);
    return () => window.removeEventListener('popstate', syncQuery);
  });
</script>

<header class="sticky top-0 z-40 bg-white border-b border-ink-100 shadow-sm">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

    <!-- Logo -->
    <a href="/" on:click|preventDefault={() => navigate('/')}
       class="font-display text-xl font-bold text-bazaar-700 shrink-0 tracking-tight">
      Bazaar
    </a>

    <!-- Search -->
    <form on:submit={handleSearch} class="flex-1 max-w-xl">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
        </svg>
        <input
          bind:value={query}
          type="text"
          placeholder="Search listings…"
          class="input pl-9 py-2 text-sm"
          data-testid="nav-search"
        />
      </div>
    </form>

    <!-- Right actions -->
    <nav class="flex items-center gap-1 ml-auto shrink-0">

      {#if user}
        <!-- Post listing -->
        <a href="/listings/new"
           on:click|preventDefault={() => navigate('/listings/new')}
           class="btn-primary text-xs px-3 py-2 hidden sm:inline-flex">
          + List Item
        </a>

        <!-- Watchlist -->
        <a href="/watchlist"
           on:click|preventDefault={() => navigate('/watchlist')}
           class="relative btn-ghost px-2.5 py-2"
           data-testid="nav-watchlist">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 0 1 6.364 6.364L12 20l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z"/>
          </svg>
          {#if badgeCount > 0}
            <span class="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center
                         bg-bazaar-600 text-white text-[10px] font-bold rounded-full px-1"
                  data-testid="watchlist-badge">
              {badgeCount}
            </span>
          {/if}
        </a>

        <!-- Account menu -->
        <div class="relative">
          <button on:click={() => menuOpen = !menuOpen}
                  class="w-8 h-8 rounded-full bg-bazaar-100 text-bazaar-700 font-semibold text-sm flex items-center justify-center hover:bg-bazaar-200 transition-colors"
                  data-testid="account-menu-btn">
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </button>

          {#if menuOpen}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="fixed inset-0 z-40" on:click={() => menuOpen = false}></div>
            <div class="absolute right-0 top-10 z-50 w-52 card shadow-lg py-1 text-sm">
              <div class="px-4 py-2.5 border-b border-ink-100">
                <p class="font-medium text-ink-900 truncate">{user.name}</p>
                <p class="text-xs text-ink-500 truncate">{user.email}</p>
              </div>
              {#each [
                ['/dashboard',       'Dashboard'],
                [`/users/${user.id}`,'My Profile'],
                ['/offers/mine',     'My Offers'],
                ['/listings/mine',   'My Listings'],
              ] as [href, label]}
                <a {href}
                   on:click|preventDefault={() => { navigate(href); menuOpen = false; }}
                   class="block px-4 py-2 hover:bg-ink-50 text-ink-700 transition-colors">
                  {label}
                </a>
              {/each}
              <div class="border-t border-ink-100 mt-1 pt-1">
                <button on:click={logout}
                        class="block w-full text-left px-4 py-2 hover:bg-ink-50 text-red-600 transition-colors">
                  Sign out
                </button>
              </div>
            </div>
          {/if}
        </div>

      {:else}
        <a href="/login"  on:click|preventDefault={() => navigate('/login')}  class="btn-ghost text-sm">Sign in</a>
        <a href="/signup" on:click|preventDefault={() => navigate('/signup')} class="btn-primary text-sm">Join</a>
      {/if}
    </nav>
  </div>

  <!-- Category bar -->
  <div class="border-t border-ink-50 bg-bazaar-50/60">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto py-1.5 scrollbar-hide">
      {#each ['Electronics','Clothing','Furniture','Books','Sports','Toys','Other'] as cat}
        <a href={`/?category=${cat}`}
           on:click|preventDefault={() => navigate(`/?category=${cat}`)}
           class="shrink-0 px-3 py-1 text-xs font-medium rounded-full text-ink-600
                  hover:bg-bazaar-100 hover:text-bazaar-800 transition-colors whitespace-nowrap">
          {cat}
        </a>
      {/each}
    </div>
  </div>
</header>