<template>
  <section v-if="content.visible" id="products" class="products-section section">
    <div class="wrap products-layout">
      <header class="products-heading">
        <div class="products-heading__copy">
          <span class="eyebrow"><i></i>{{ content.eyebrow }}</span>
          <ForumTitle :title="content.title" accent-last />
          <p data-reveal-soft>{{ content.description }}</p>
        </div>
        <a class="btn btn-primary" href="https://angel-wings.ru/catalog"><span>{{ content.catalogButton }} <b>→</b></span></a>
      </header>
      <div class="product-carousel">
        <button class="carousel-arrow carousel-arrow--prev" type="button" aria-label="Предыдущие товары" :disabled="!canScrollBack" @click="scroll(-1)"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14.5 5 7.5 12l7 7M8 12h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div ref="rail" class="product-rail" data-reveal-cards @scroll.passive="updateArrows">
          <div v-for="item in products" :key="item.id" class="product-slide">
            <ForumCatalogCard :product="item" @open="track('forum_product_click')" />
          </div>
        </div>
        <button class="carousel-arrow carousel-arrow--next" type="button" aria-label="Следующие товары" :disabled="!canScrollForward" @click="scroll(1)"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9.5 5 7 7-7 7M16 12H5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </div>
    </div>
  </section>
</template>
<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ForumTitle from './ForumTitle.vue'
import ForumCatalogCard from './ForumCatalogCard.vue'
const props = defineProps({ content: Object, products: Array, track: Function })
const rail = ref(null)
const canScrollBack = ref(false)
const canScrollForward = ref(false)
let observer
function updateArrows() {
  const node = rail.value
  if (!node) return
  canScrollBack.value = node.scrollLeft > 2
  canScrollForward.value = node.scrollLeft + node.clientWidth < node.scrollWidth - 2
}
function scroll(direction) {
  const node = rail.value
  const card = node?.querySelector('.product-slide')
  if (!node || !card) return
  const gap = parseFloat(getComputedStyle(node).columnGap) || 0
  node.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'smooth' })
}
watch(() => props.products.length, async () => { await nextTick(); updateArrows() })
onMounted(() => { observer = new ResizeObserver(updateArrows); if (rail.value) observer.observe(rail.value); updateArrows() })
onBeforeUnmount(() => observer?.disconnect())
</script>
