<template>
  <div class="light-background-scene" aria-hidden="true">
    <template v-for="zone in zones" :key="zone.id">
      <span class="light-scene-glow" :style="{ top: `${zone.top}px`, [zone.side]: '-130px' }"></span>
      <img v-for="item in zone.items" :key="item.id" class="light-scene-object"
        :class="[`light-scene-object--${item.role}`, { 'light-scene-object--float': item.role === 'primary' }]"
        :src="`/home-scene-light/${item.asset}.webp`" :style="item.style"
        alt="" loading="lazy" decoding="async">
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { lightBackgroundSceneConfig as config } from '../config/lightBackgroundSceneConfig'
import { backgroundAssetWidth } from '../config/backgroundAssetSizes'

const props = defineProps({ height: { type: Number, default: 0 } })
const width = ref(window.innerWidth)
const updateWidth = () => { width.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', updateWidth, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('resize', updateWidth))
const zones = computed(() => {
  if (!props.height) return []
  const profile = config.profiles[width.value < 768 ? 'mobile' : width.value < 1200 ? 'tablet' : width.value < 1920 ? 'desktop' : 'wide']
  // Fixed spacing prevents all objects from shifting when an accordion grows.
  const step = config.zoneHeight
  const count = Math.max(1, Math.ceil(props.height / step))
  return Array.from({ length: count }, (_, index) => {
    const arrangement = config.arrangements[(index + Math.floor(index / config.arrangements.length)) % config.arrangements.length]
    const side = index % 2 ? 'left' : 'right'
    const top = index * step
    return { id: index, top, side, items: config.objects.filter(item => profile.roles.includes(item.role)).map((item, id) => {
      const edge = item.opposite ? (side === 'left' ? 'right' : 'left') : side
      const requestedSize = profile.sizes?.[item.role] ?? item.size * (profile.scale ?? 1)
      const isWave = item.role === 'wave' || item.role === 'echo'
      const size = backgroundAssetWidth('home-scene-light', arrangement[item.asset], requestedSize, isWave ? 240 : 250)
      const requestedInset = profile.insets?.[item.role] ?? item.inset
      const inset = isWave ? Math.max(requestedInset, -size * .62) : requestedInset
      const y = profile.positions?.[item.role] ?? item.y
      const angle = (profile.angles?.[item.role] ?? item.angle) * (index % 2 ? -1 : 1) + (index % 3 - 1) * 7
      return { id, role: item.role, asset: arrangement[item.asset], style: {
        top: `${top + step * y}px`, [edge]: `${inset}px`, width: `${size}px`,
        opacity: item.opacity, '--light-angle': `${angle}deg`, '--light-mirror': index % 3 ? 1 : -1,
        '--light-delay': `${-index * 3.1}s`
      } }
    }) }
  })
})
</script>

<style scoped>
.light-background-scene {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: clip;
  pointer-events: none;
  user-select: none;
  mask-image: linear-gradient(transparent, #000 100px, #000 calc(100% - 180px), transparent);
}
.light-scene-object {
  position: absolute;
  display: block;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  transform: rotate(var(--light-angle)) scaleX(var(--light-mirror));
}
.light-scene-object--primary, .light-scene-object--counterpoint { z-index: 2; }
.light-scene-object--satellite, .light-scene-object--small, .light-scene-object--outer { z-index: 1; }
.light-scene-object--float { animation: lightSceneFloat 25s ease-in-out var(--light-delay) infinite alternate; }
.light-scene-glow {
  position: absolute;
  width: min(75vw, 820px);
  height: 650px;
  background: radial-gradient(ellipse, rgba(139, 198, 248, .2), transparent 70%);
}
@keyframes lightSceneFloat {
  to { transform: translateY(-12px) rotate(var(--light-angle)) scaleX(var(--light-mirror)); }
}
@media (prefers-reduced-motion: reduce) {
  .light-scene-object { animation: none; }
}
</style>
