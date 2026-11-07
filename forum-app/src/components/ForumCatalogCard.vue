<template>
  <component :is="product.link ? 'a' : 'article'" :href="product.link || undefined" class="catalog-card" @click="emit('open')">
    <div class="catalog-card-image">
      <video v-if="product.video" :src="product.video" autoplay muted loop playsinline></video>
      <img v-else-if="product.image" :src="product.image" :alt="product.title" width="480" height="480" loading="lazy" decoding="async">
      <div v-else class="catalog-card-placeholder">Angel Wings</div>
      <div v-if="product.link" class="catalog-card-overlay"><span class="catalog-view-btn">Подробнее</span></div>
    </div>
    <div class="catalog-card-content">
      <div class="catalog-card-meta">
        <span v-if="categoryName" class="catalog-category-badge">{{ categoryName }}</span>
        <span v-if="isLowStock" class="catalog-low-stock">Меньше 10 осталось</span>
      </div>
      <h3 class="catalog-card-title">{{ product.title }}</h3>
      <p class="catalog-card-desc">{{ truncatedDescription }}</p>
      <div class="catalog-card-footer">
        <div class="catalog-card-price">
          <div class="catalog-price-current"><span class="catalog-price-value">{{ displayPrice }}</span><span v-if="product.price" class="catalog-price-currency">₽</span></div>
          <div v-if="oldPrice" class="catalog-price-discount-row"><span class="catalog-price-old">{{ oldPrice.toLocaleString('ru-RU') }} ₽</span><span class="catalog-price-discount-badge">-{{ discountPercent }}%</span></div>
        </div>
        <span v-if="product.link" class="catalog-open-btn" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></span>
      </div>
    </div>
  </component>
</template>
<script setup>
import { computed } from 'vue'
const props = defineProps({ product: { type: Object, required: true } })
const emit = defineEmits(['open'])
const categoryName = computed(() => props.product.categories?.[0]?.name || props.product.category || '')
const isLowStock = computed(() => Number(props.product.stock || 0) > 0 && Number(props.product.stock) < 10)
const truncatedDescription = computed(() => {
  const text = props.product.text || ''
  return text.length > 100 ? `${text.slice(0, 100).replace(/\s+\S*$/, '')}…` : text
})
const displayPrice = computed(() => typeof props.product.price === 'number' ? props.product.price.toLocaleString('ru-RU') : props.product.price || 'Цена уточняется')
const oldPrice = computed(() => Number(props.product.comparePrice) > Number(props.product.price) ? Number(props.product.comparePrice) : null)
const discountPercent = computed(() => oldPrice.value ? Math.round((1 - Number(props.product.price) / oldPrice.value) * 100) : 0)
</script>
<style scoped src="./forumCatalogCard.css"></style>
