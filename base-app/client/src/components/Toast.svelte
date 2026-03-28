<script>
  import { onMount } from 'svelte';
  export let message = '';
  export let type = 'success'; // success | error | info
  export let duration = 3500;
  export let onDismiss = () => {};

  onMount(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  });

  const icons = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
  };
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    info:    'bg-bazaar-50 border-bazaar-200 text-bazaar-800',
  };
</script>

<div class="flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm max-w-sm
            animate-slide-in {colors[type]}">
  <span class="font-bold shrink-0">{icons[type]}</span>
  <p class="flex-1">{message}</p>
  <button on:click={onDismiss} class="shrink-0 opacity-60 hover:opacity-100 transition-opacity">✕</button>
</div>

<style>
  @keyframes slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  .animate-slide-in {
    animation: slide-in 0.2s ease-out;
  }
</style>