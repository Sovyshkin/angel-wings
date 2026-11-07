<template>
  <section v-if="content.visible" id="advantages" class="benefits-section section">
    <div class="wrap benefits-layout">
      <div class="benefits-intro">
        <span v-if="content.eyebrow" class="eyebrow"><i></i>{{ content.eyebrow }}</span>
        <ForumTitle :title="content.title" accent-last />
        <p v-if="content.description">{{ content.description }}</p>
      </div>
      <div class="benefits-grid" data-reveal-cards>
        <article v-for="(item, index) in visibleItems" :key="index" class="glass-card benefit-card">
          <img v-if="item.image" :src="item.image" alt="" loading="lazy">
          <Icon v-else :name="item.icon" />
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'
import ForumTitle from './ForumTitle.vue'
const props = defineProps({ content: Object })
const visibleItems = computed(() => props.content.items.filter(item => item.visible !== false))
</script>
