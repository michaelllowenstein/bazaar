<script>
  import { createEventDispatcher } from 'svelte';
  export let sort = 'newest';
  export let total = 0;
  export let label = 'listings';

  const dispatch = createEventDispatcher();

  const SORTS = [
    { value: 'newest',     label: 'Newest first' },
    { value: 'price_asc',  label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'most_viewed',label: 'Most viewed' },
  ];

  function onChange(e) {
    dispatch('sort', e.target.value);
  }
</script>

<div class="flex items-center justify-between py-3">
  <p class="text-sm text-ink-500">
    <span class="font-medium text-ink-800">{total.toLocaleString()}</span> {label}
  </p>

  <div class="flex items-center gap-2">
    <label for="sort-select" class="text-xs text-ink-500 hidden sm:block">Sort:</label>
    <select
      id="sort-select"
      value={sort}
      on:change={onChange}
      class="input py-1.5 text-sm w-auto"
      data-testid="sort-select"
    >
      {#each SORTS as s}
        <option value={s.value}>{s.label}</option>
      {/each}
    </select>
  </div>
</div>