<template>
  <section v-if="content.visible" id="about" class="about-section section">
    <div class="wrap about-layout" :class="{ 'about-layout--with-stats': visibleStats.length }">
      <div class="about-visual" data-reveal-soft>
        <div v-if="content.video" class="about-video-frame" :class="{ 'about-video-frame--molecule': content.video.includes('about-sphere') }"><video :src="content.video" muted autoplay loop playsinline preload="auto" aria-label="Вращающаяся молекула Angel Wings"></video></div>
        <img v-else-if="content.image" :src="content.image" alt="ДНК — научные разработки Angel Wings" loading="lazy">
      </div>
      <div class="about-copy"><span class="eyebrow"><i></i>{{ content.eyebrow }}</span><ForumTitle :title="content.title" accent-last/><p data-reveal-soft>{{ content.description }}</p><a v-if="content.link" :href="content.link" class="btn btn-primary"><span>{{ content.button }} <b>→</b></span></a></div>
      <div v-if="visibleStats.length" class="about-stats" data-reveal-cards><div v-for="(stat,index) in visibleStats" :key="index" class="glass-card"><strong v-if="/^\d+$/.test(stat.value)" :data-count="stat.value">0</strong><strong v-else>{{ stat.value }}</strong><span>{{ stat.label }}</span></div></div>
    </div>
  </section>
</template>
<script setup>
import { computed } from 'vue'
import ForumTitle from './ForumTitle.vue'
const props = defineProps({ content: Object })
const visibleStats = computed(() => props.content.stats.filter(stat => stat.visible !== false && stat.value))
</script>
