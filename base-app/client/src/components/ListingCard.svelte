<script>
  import { formatPrice, timeAgo, conditionClass } from '../../lib/utils.js';
  import { navigate } from '../../lib/utils.js';

  export let listing;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<article
  class="card hover:shadow-md transition-shadow duration-200 cursor-pointer group overflow-hidden flex flex-col"
  on:click={() => navigate(`/listings/${listing.id}`)}
  data-testid="listing-card"
>
  <!-- Image area -->
  <div class="aspect-[4/3] bg-ink-100 overflow-hidden relative">
    {#if listing.image_url}
      <img src={listing.image_url} alt={listing.title}
           class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
    {:else}
      <div class="w-full h-full flex items-center justify-center text-ink-300">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>
        </svg>
      </div>
    {/if}

    {#if listing.status === 'sold'}
      <div class="absolute inset-0 bg-ink-900/50 flex items-center justify-center">
        <span class="bg-ink-800 text-white text-sm font-semibold px-3 py-1 rounded-full tracking-wide">SOLD</span>
      </div>
    {/if}

    <!-- Category badge -->
    <span class="absolute top-2 left-2 badge-category text-[10px]">{listing.category}</span>
  </div>

  <!-- Content -->
  <div class="p-4 flex flex-col flex-1">
    <h3 class="font-medium text-ink-900 text-sm leading-snug line-clamp-2 group-hover:text-bazaar-700 transition-colors mb-2"
        data-testid="listing-title">
      {listing.title}
    </h3>

    <div class="flex items-center gap-2 mb-3">
      <span class={conditionClass(listing.condition)}>{listing.condition}</span>
    </div>

    <div class="mt-auto flex items-end justify-between">
      <span class="font-display text-lg font-semibold text-ink-900" data-testid="listing-price">
        {formatPrice(listing.price)}
      </span>

      <div class="flex items-center gap-2 text-ink-400 text-xs">
        {#if listing.offer_count > 0}
          <span class="text-bazaar-600 font-medium">{listing.offer_count} offer{listing.offer_count !== 1 ? 's' : ''}</span>
        {/if}
        <span class="flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          {listing.view_count}
        </span>
      </div>
    </div>

    <p class="text-xs text-ink-400 mt-1">{timeAgo(listing.created_at)}</p>
  </div>
</article>