<template>
  <div class="home-sections__decor" aria-hidden="true">
    <template v-for="zone in zones" :key="zone.id">
      <span class="home-scene-glow" :class="`home-scene-glow--${zone.side}`" :style="{ top: `${zone.top}px` }"></span>
      <img v-for="item in zone.items.filter(item => item.visible && item.image)" :key="item.id" class="home-scene" :class="item.classes" :style="item.style"
        :src="item.image" alt="" loading="lazy" decoding="async">
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { backgroundAssetWidth } from '../config/backgroundAssetSizes'
const props = defineProps({ height: { type: Number, default: 0 }, assets: { type: Array, default: () => [] } })
const sceneArrangements = [
  ['wave-01-horizontal', 'wave-03-flow-up', 'molecule-01-diagonal', 'molecule-05-cluster', 'molecule-03-chain', 'molecule-06-ring'],
  ['wave-04-flow-down', 'wave-06-curved', 'molecule-06-ring', 'molecule-02-mirrored', 'molecule-04-chain-reversed', 'molecule-05-cluster'],
  ['wave-02-reversed', 'wave-01-horizontal', 'molecule-03-chain', 'molecule-06-ring', 'molecule-01-diagonal', 'molecule-02-mirrored'],
  ['wave-06-curved', 'wave-04-flow-down', 'molecule-05-cluster', 'molecule-04-chain-reversed', 'molecule-02-mirrored', 'molecule-06-ring']
]
const zones = computed(() => {
  const height = props.height
  if (!height) return []
  const zoneHeight = 800
  const count = Math.max(1, Math.ceil(height / zoneHeight))
  return Array.from({ length: count }, (_, index) => {
    const assets = [...sceneArrangements[index % sceneArrangements.length]]
    if (index >= sceneArrangements.length) {
      assets[1] = sceneArrangements[(index + 1) % 4][1]
      assets[2] = sceneArrangements[(index + 2) % 4][2]
      assets[3] = sceneArrangements[(index + 3) % 4][3]
    }
    const side = index % 2 ? 'right' : 'left'
    const opposite = side === 'left' ? 'right' : 'left'
    const top = index * zoneHeight
    const fade = index === count - 1 ? .78 : 1
    const objects = [
      { asset: assets[0], kind: 'wave', side, y: -.08, size: 760, inset: -160, opacity: .48, rotate: index % 2 ? -12 : 8 },
      { asset: assets[1], kind: 'wave-secondary', side: opposite, y: .42, size: 560, inset: -180, opacity: .3, rotate: index % 2 ? 17 : -16 },
      { asset: assets[2], kind: 'primary', side, y: .12, size: 245 + (index % 3) * 20, inset: -75, opacity: .72, rotate: index * 23 % 65 - 25 },
      { asset: assets[3], kind: 'satellite', side, y: .49, size: 115 + (index % 3) * 18, inset: 140, opacity: .55, rotate: 32 - index * 19 },
      { asset: assets[4], kind: 'counterpoint', side: opposite, y: .55, size: 185 + (index % 2) * 25, inset: -45, opacity: .62, rotate: index % 2 ? 28 : -32 },
      { asset: assets[5], kind: 'distant', side: opposite, y: .03, size: 85, inset: 195, opacity: .32, rotate: index * 37 },
      { asset: assets[3], kind: 'wide', side, y: .7, size: 210, inset: 360, opacity: .48, rotate: -34 },
      { asset: assets[5], kind: 'wide', side: opposite, y: .3, size: 130, inset: 420, opacity: .4, rotate: 44 }
    ]
    return { id: index, top, side, items: objects.map((item, slot) => ({
      id: slot, asset: item.asset,
      image: props.assets.find(asset => asset.name === item.asset)?.image ?? `/home-scene/${item.asset}.webp`,
      visible: props.assets.find(asset => asset.name === item.asset)?.visible !== false,
      classes: [`home-scene--${item.kind}`, `home-scene--${item.side}`, { 'home-scene--floating': slot === 2 || slot === 4 }],
      style: {
        top: `${top + zoneHeight * item.y + (index === 0 && item.kind === 'wave' ? 90 : 0)}px`, '--scene-size': `${backgroundAssetWidth('home-scene', item.asset, item.size, item.kind.startsWith('wave') ? 240 : 250)}px`,
        '--scene-inset': `${item.inset}px`, '--scene-opacity': item.opacity * fade,
        '--scene-rotate': `${item.rotate}deg`, '--scene-mirror': index % 2 ? -1 : 1,
        '--scene-delay': `${-index * 2.7 - slot}s`
      }
    })) }
  })
})
</script>

<style scoped>
.home-sections__decor {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: clip;
  pointer-events: none;
  user-select: none;
  mask-image: linear-gradient(#000 0%, #000 calc(100% - 170px), transparent 100%);
}

.home-scene,
.home-scene-glow {
  position: absolute;
  display: block;
  pointer-events: none;
}

.home-scene {
  width: min(var(--scene-size), 30vw);
  height: auto;
  max-width: var(--scene-size);
  object-fit: contain;
  opacity: var(--scene-opacity);
  transform: rotate(var(--scene-rotate)) scaleX(var(--scene-mirror));
}
.home-scene--left { left: var(--scene-inset); }
.home-scene--right { right: var(--scene-inset); }
.home-scene--wave,
.home-scene--wave-secondary { width: min(var(--scene-size), 82vw); z-index: 0; }
.home-scene--primary, .home-scene--counterpoint { z-index: 2; }
.home-scene--satellite { z-index: 1; }
.home-scene--distant { filter: blur(.7px); z-index: 0; }
.home-scene--wide { display: none; }
.home-scene--floating { animation: sceneFloat 22s ease-in-out var(--scene-delay) infinite alternate; }

.home-scene-glow {
  width: min(65vw, 950px);
  height: 680px;
  background: radial-gradient(ellipse, rgba(12, 91, 211, .17), rgba(7, 55, 145, .07) 42%, transparent 72%);
}
.home-scene-glow--left { left: -180px; }
.home-scene-glow--right { right: -180px; }

@keyframes sceneFloat {
  from { transform: translateY(0) rotate(var(--scene-rotate)) scaleX(var(--scene-mirror)); }
  to { transform: translateY(-16px) rotate(var(--scene-rotate)) scaleX(var(--scene-mirror)); }
}

@media (min-width: 1920px) {
  .home-scene--wide { display: block; }
  .home-scene--left { left: calc(var(--scene-inset) + clamp(0px, (100vw - 1920px) * .08, 120px)); }
  .home-scene--right { right: calc(var(--scene-inset) + clamp(0px, (100vw - 1920px) * .08, 120px)); }
}

@media (min-width: 768px) and (max-width: 1199px) {
  .home-scene { width: min(var(--scene-size), 25vw); }
  .home-scene--satellite { display: none; }
  .home-scene--wave, .home-scene--wave-secondary { width: 720px; opacity: .3; }
  .home-scene--distant { opacity: .24; }
}

@media (max-width: 767px) {
  .home-scene--wave-secondary, .home-scene--satellite, .home-scene--distant, .home-scene--wide { display: none; }
  .home-scene--primary { width: 165px; --scene-inset: -112px !important; opacity: .52; }
  .home-scene--counterpoint { width: 130px; --scene-inset: -85px !important; opacity: .48; }
  .home-scene--wave { width: 510px; --scene-inset: calc(min(var(--scene-size), 510px) * -.6) !important; opacity: .38; }
  .home-scene-glow { width: 340px; height: 620px; }
}

@media (prefers-reduced-motion: reduce) {
  .home-scene { animation: none; }
}

</style>
