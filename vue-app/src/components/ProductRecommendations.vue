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
      <CatalogProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </section>
</template>

<script setup>
import CatalogProductCard from './CatalogProductCard.vue'

defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  products: { type: Array, default: () => [] }
})
</script>

<style scoped>
.recommendations { margin: clamp(3.5rem, 7vw, 6.5rem) 0 1.5rem; }
.recommendations__heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
.recommendations__eyebrow { color: var(--accent); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.17em; }
.recommendations__heading h2 { color: var(--text-primary); font-family: var(--font-display); font-size: clamp(1.55rem, 2.6vw, 2.4rem); line-height: 1.15; margin: 0.5rem 0; }
.recommendations__heading p { color: var(--text-secondary); font-size: 0.92rem; line-height: 1.5; }
.recommendations__catalog { color: var(--accent); white-space: nowrap; font-size: 0.85rem; padding-bottom: 0.2rem; }
.recommendations__catalog span { margin-left: 0.35rem; }
.recommendations__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
@media (max-width: 520px) { .recommendations__heading { align-items: start; } .recommendations__catalog { display: none; } .recommendations__grid { grid-template-columns: 1fr; gap: 1rem; } }
</style>
