<template>
  <section v-if="products.length" class="recommendations" :aria-label="title">
    <div class="recommendations__heading">
      <div>
        <span class="recommendations__eyebrow">ПОДБОРКА ИЗ КАТАЛОГА</span>
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
      <router-link to="/catalog" class="recommendations__catalog">Весь каталог <span aria-hidden="true">↗</span></router-link>
    </div>

    <div class="recommendations__grid">
      <router-link v-for="product in products" :key="product.id" :to="`/product/${product.id}`" class="recommendation-card">
        <span class="recommendation-card__image">
          <img :src="product.image || product.images?.[0] || '/angel-wings-logo-light.svg'" :alt="product.title" loading="lazy" decoding="async" @error="useFallbackImage">
        </span>
        <span class="recommendation-card__body">
          <span class="recommendation-card__category">{{ product.categories?.[0]?.name || 'Каталог' }}</span>
          <strong>{{ product.title }}</strong>
          <span class="recommendation-card__footer">
            <span>{{ priceLabel(product) }}</span>
            <span class="recommendation-card__arrow" aria-hidden="true">↗</span>
          </span>
        </span>
      </router-link>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  products: { type: Array, default: () => [] }
})

function priceLabel(product) {
  const variants = Array.isArray(product?.specs?.dosages) ? product.specs.dosages : []
  const availablePrices = variants
    .filter(item => Number(item?.quantity || 0) > 0)
    .map(item => Number(item?.price ?? product.price))
    .filter(price => Number.isFinite(price) && price >= 0)
  const price = availablePrices.length ? Math.min(...availablePrices) : Number(product?.price || 0)
  const prefix = new Set(availablePrices).size > 1 ? 'от ' : ''
  return `${prefix}${price.toLocaleString('ru-RU')} ₽`
}

function useFallbackImage(event) {
  if (event.target.dataset.fallbackApplied) return
  event.target.dataset.fallbackApplied = 'true'
  event.target.src = '/angel-wings-logo-light.svg'
}
</script>

<style scoped>
.recommendations { margin: clamp(3.5rem, 7vw, 6.5rem) 0 1.5rem; }
.recommendations__heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.recommendations__eyebrow { color: var(--accent); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.17em; }
.recommendations__heading h2 { color: var(--text-primary); font-family: var(--font-display); font-size: clamp(1.55rem, 2.6vw, 2.4rem); line-height: 1.15; margin: 0.5rem 0; }
.recommendations__heading p { color: var(--text-secondary); font-size: 0.92rem; line-height: 1.5; }
.recommendations__catalog { color: var(--accent); white-space: nowrap; font-size: 0.85rem; padding-bottom: 0.2rem; }
.recommendations__catalog span { margin-left: 0.35rem; }
.recommendations__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.9rem; }
.recommendation-card { min-width: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--border); border-radius: 18px; background: var(--bg-card); color: var(--text-primary); transition: transform 250ms ease, border-color 250ms ease, box-shadow 250ms ease; }
.recommendation-card:hover { transform: translateY(-4px); border-color: rgba(166, 185, 248, 0.45); box-shadow: 0 20px 38px rgba(0, 0, 0, 0.2); }
.recommendation-card__image { display: grid; place-items: center; height: clamp(140px, 17vw, 230px); padding: 1.1rem; background: radial-gradient(circle at 50% 55%, rgba(94, 128, 224, 0.13), transparent 62%), var(--bg-secondary); }
.recommendation-card__image img { width: 100%; height: 100%; object-fit: contain; }
.recommendation-card__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.55rem; padding: 1rem 1.1rem 1.15rem; }
.recommendation-card__category { color: var(--text-muted); font-size: 0.72rem; line-height: 1.35; }
.recommendation-card__body strong { color: var(--text-primary); font-size: 0.95rem; line-height: 1.35; font-weight: 700; overflow-wrap: anywhere; }
.recommendation-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; margin-top: auto; padding-top: 0.75rem; color: var(--accent); font-size: 0.98rem; font-weight: 700; }
.recommendation-card__arrow { display: grid; place-items: center; flex: 0 0 1.75rem; height: 1.75rem; border: 1px solid rgba(166, 185, 248, 0.25); border-radius: 50%; transition: background 250ms ease; }
.recommendation-card:hover .recommendation-card__arrow { background: var(--accent-dim); }
@media (max-width: 850px) { .recommendations__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 520px) { .recommendations__heading { align-items: start; } .recommendations__catalog { display: none; } .recommendations__grid { gap: 0.6rem; } .recommendation-card__image { height: 140px; padding: 0.7rem; } .recommendation-card__body { padding: 0.8rem; } }
</style>
