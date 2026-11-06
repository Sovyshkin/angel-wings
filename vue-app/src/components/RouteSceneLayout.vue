<template>
  <div ref="root" class="route-scene-layout">
    <BackgroundScene :height="height" />
    <div ref="content" class="route-scene-layout__content"><slot /></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import BackgroundScene from './BackgroundScene.vue'
const root = ref(null)
const content = ref(null)
const height = ref(0)
let observer
let frame
function measure() {
  frame = null
  height.value = root.value?.offsetHeight || 0
}
function scheduleMeasure() {
  if (!frame) frame = requestAnimationFrame(measure)
}
onMounted(() => {
  measure()
  observer = new ResizeObserver(scheduleMeasure)
  observer.observe(root.value)
  observer.observe(content.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  if (frame) cancelAnimationFrame(frame)
})
</script>

<style>
.route-scene-layout {
  position: relative;
  min-height: calc(100svh - var(--header-height));
  background: linear-gradient(180deg, #020817 0%, #041127 42%, #031023 70%, #020817 100%);
}
[data-theme="light"] .route-scene-layout {
  background: linear-gradient(180deg, #e3efff, #f9fcff 24%, #edf6ff 54%, #f7fbff 78%, #e3efff);
}
.route-scene-layout__content { position: relative; display: flow-root; }
/* Quiet the title area and central reading column, retaining vivid edge accents. */
.route-scene-layout > :is(.home-sections__decor, .light-background-scene) {
  mask-image:
    linear-gradient(transparent, #000 280px, #000 calc(100% - 150px), transparent),
    linear-gradient(90deg, #000, rgba(0, 0, 0, .55) 18%, rgba(0, 0, 0, .22) 34%, rgba(0, 0, 0, .22) 66%, rgba(0, 0, 0, .55) 82%, #000);
  mask-composite: intersect;
}
/* Only page backdrops are replaced. Card surfaces and fixed overlays retain their styles. */
.route-scene-layout__content > :is(.about-page, .partnership-page, .dealers-page, .blog-page),
.route-scene-layout :is(.catalog__hero, .cart__hero, .profile__hero, .about-hero) {
  background: transparent !important;
}
.route-scene-layout :is(.catalog__hero, .cart__hero, .profile__hero) { border-bottom-color: transparent; }
.route-scene-layout :is(.partnership-bg, .blog-backdrop-molecules, .about-grid, .about-hero__backdrop) { display: none; }
.route-scene-layout :is(.blog-page, .dealers-page, .about-hero)::before { display: none; }
/* Blog previously kept a dark palette in both themes; adapt it to the shared light scene. */
[data-theme="light"] .route-scene-layout .blog-page { color: #142746; }
[data-theme="light"] .route-scene-layout :is(.blog-glass, .blog-search, .blog-subscribe__field) {
  border-color: rgba(89, 137, 209, .28);
  background: linear-gradient(125deg, rgba(255,255,255,.86), rgba(232,242,255,.72));
  box-shadow: inset 0 1px 0 rgba(255,255,255,.9), 0 8px 28px rgba(55,94,156,.1);
}
[data-theme="light"] .route-scene-layout :is(.blog-hero__copy > p, .blog-featured p, .blog-card p, .blog-meta, .blog-message, .blog-subscribe p, .blog-subscribe__consent, .blog-article__lead, .blog-article__toc a, .blog-unsubscribe, .blog-hero__legend) { color: #4a6385; }
[data-theme="light"] .route-scene-layout :is(.blog-hero h1 em, .blog-subscribe h2 em, .blog-eyebrow, .blog-search svg, .blog-subscribe__field > svg, .blog-subscribe__field > span, .blog-article__back, .blog-article__toc strong, .blog-article__content a, .blog-message button, .blog-featured__arrow) { color: #2864bc; }
[data-theme="light"] .route-scene-layout :is(.blog-search input, .blog-subscribe__field input, .blog-article__content, .blog-article__content h2, .blog-article__content h3) { color: #142746; }
[data-theme="light"] .route-scene-layout :is(.blog-search input, .blog-subscribe__field input)::placeholder { color: #617799; }
[data-theme="light"] .route-scene-layout :is(.blog-filters button, .blog-section-title select, .blog-section-title option, .blog-pagination button) { color: #25466e; background-color: rgba(255,255,255,.7); border-color: rgba(89,137,209,.28); }
[data-theme="light"] .route-scene-layout :is(.blog-filters button.active, .blog-pagination button.active) { background: #bdd4ff; color: #142746; }
[data-theme="light"] .route-scene-layout .blog-subscribe__notice { color: #2864bc !important; }

</style>
