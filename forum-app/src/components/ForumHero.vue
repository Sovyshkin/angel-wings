<template>
    <section v-if="content.visible" id="top" ref="heroRoot" class="hero hero--neon hero--giveaway" :class="{ 'is-assembly-pending': !heroMotionReady, 'is-background-paused': heroFxPaused }">
      <div :style="backgroundStyle" class="hero-neon__background hero-neon__background--dark" aria-hidden="true"></div>
      <div :style="lightBackgroundStyle" class="hero-neon__background hero-neon__background--light" aria-hidden="true"></div>
      <div class="hero-neon__background-fx" aria-hidden="true">
        <div class="hero-neon__comets">
          <span v-for="comet in heroComets" :key="comet.id" class="hero-neon__comet" :style="comet.style"></span>
        </div>
        <div class="hero-neon__stars">
          <span v-for="star in heroStars" :key="star.id" class="hero-neon__star" :style="star.style"></span>
        </div>
        <div class="hero-neon__light-fx">
          <div class="hero-neon__light-sparks">
            <span v-for="index in 7" :key="index" class="hero-neon__light-spark"></span>
          </div>
          <div class="hero-neon__light-grid-glints">
            <span v-for="index in 6" :key="index" class="hero-neon__light-grid-glint"></span>
          </div>
        </div>
      </div>
      <div ref="heroScene" class="hero-neon__scene" aria-hidden="true">
        <div class="hero-neon__floor-light"></div>
        <div class="hero-neon__assembly hero-neon__assembly--molecule-top" data-assembly="molecule-top" v-show="objectVisible('molecule-top')"><img class="hero-neon__object hero-neon__object--molecule-top hero-neon__object--theme-dark" :src="objectImage('molecule-top', '/hero-assets/neon-lab-molecule-top.webp')" alt="" width="512" height="512" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--molecule-top hero-neon__object--theme-light" :src="objectLightImage('molecule-top', '/hero-assets/neon-lab-light-molecule-top.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--molecule-mid" data-assembly="molecule-mid" v-show="objectVisible('molecule-mid')"><img class="hero-neon__object hero-neon__object--molecule-mid hero-neon__object--theme-dark" :src="objectImage('molecule-mid', '/hero-assets/neon-lab-molecule-mid.webp')" alt="" width="512" height="512" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--molecule-mid hero-neon__object--theme-light" :src="objectLightImage('molecule-mid', '/hero-assets/neon-lab-light-molecule-mid.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--molecule-right" data-assembly="molecule-right" v-show="objectVisible('molecule-right')"><img class="hero-neon__object hero-neon__object--molecule-right hero-neon__object--theme-dark" :src="objectImage('molecule-right', '/hero-assets/neon-lab-molecule-right.webp')" alt="" width="512" height="512" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--molecule-right hero-neon__object--theme-light" :src="objectLightImage('molecule-right', '/hero-assets/neon-lab-light-molecule-right.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--sphere-top" data-assembly="sphere-top" v-show="objectVisible('sphere-top')"><img class="hero-neon__object hero-neon__object--sphere-top hero-neon__object--theme-dark" :src="objectImage('sphere-top', '/hero-assets/neon-lab-sphere-top.webp')" alt="" width="384" height="384" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--sphere-top hero-neon__object--theme-light" :src="objectLightImage('sphere-top', '/hero-assets/neon-lab-light-sphere-top.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--sphere-right" data-assembly="sphere-right" v-show="objectVisible('sphere-right')"><img class="hero-neon__object hero-neon__object--sphere-right hero-neon__object--theme-dark" :src="objectImage('sphere-right', '/hero-assets/neon-lab-sphere-right.webp')" alt="" width="384" height="384" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--sphere-right hero-neon__object--theme-light" :src="objectLightImage('sphere-right', '/hero-assets/neon-lab-light-sphere-right.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--sphere-small" data-assembly="sphere-small" v-show="objectVisible('sphere-small')"><img class="hero-neon__object hero-neon__object--sphere-small hero-neon__object--theme-dark" :src="objectImage('sphere-small', '/hero-assets/neon-lab-sphere-small.webp')" alt="" width="384" height="384" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--sphere-small hero-neon__object--theme-light" :src="objectLightImage('sphere-small', '/hero-assets/neon-lab-light-sphere-small.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--bubbles-left" data-assembly="bubbles-left" v-show="objectVisible('bubbles-left')"><img class="hero-neon__object hero-neon__object--bubbles-left hero-neon__object--theme-dark" :src="objectImage('bubbles-left', '/hero-assets/neon-lab-bubbles-left.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--bubbles-left hero-neon__object--theme-light" :src="objectLightImage('bubbles-left', '/hero-assets/neon-lab-light-bubbles.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--bubbles-right" data-assembly="bubbles-right" v-show="objectVisible('bubbles-right')"><img class="hero-neon__object hero-neon__object--bubbles-right hero-neon__object--theme-dark" :src="objectImage('bubbles-right', '/hero-assets/neon-lab-bubbles-right.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--bubbles-right hero-neon__object--theme-light" :src="objectLightImage('bubbles-right', '/hero-assets/neon-lab-light-bubbles.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--podium" data-assembly="podium" v-show="objectVisible('podium')"><img class="hero-neon__object hero-neon__object--podium hero-neon__object--theme-dark" :src="objectImage('podium', '/hero-assets/neon-lab-podium.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--podium hero-neon__object--theme-light" :src="objectLightImage('podium', '/hero-assets/neon-lab-light-podium.webp')" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__energy" aria-hidden="true"></div>
        <div v-show="content.penVisible !== false" class="hero-neon__assembly hero-neon__assembly--pen" data-assembly="pen"><video v-if="content.video" class="hero-neon__object hero-neon__object--pen" :src="content.video" autoplay muted loop playsinline></video><img v-else class="hero-neon__object hero-neon__object--pen" :src="content.image || '/hero-assets/ручка-720.webp'" alt="" width="720" height="1080" loading="eager" decoding="async" fetchpriority="high"></div>
        <div class="hero-neon__prize-plaque"><span>ГЛАВНЫЙ ПРИЗ</span><strong>50 000 <small>₽</small></strong><i aria-hidden="true"></i></div>
      </div>
      <div class="hero-neon__content">
          <div class="hero-neon__badge"><span class="hero-neon__dot"></span>{{ content.eyebrow }}</div>
          <h1 class="hero-neon__title">
            <template v-for="(line, index) in titleLines" :key="index"><span :class="{ 'hero-neon__accent': index >= titleLines.length - 1 }">{{ line }}</span>{{ ' ' }}</template>
          </h1>
          <div class="hero-neon__chips">
            <p class="hero-neon__description">{{ content.description }}</p>
            <span v-if="content.date" class="hero-neon__chip">{{ content.date }}</span>
            <span v-if="content.place" class="hero-neon__chip">{{ content.place }}</span>
          </div>
          <div class="hero-neon__actions">
            <a v-if="showForm" href="#application" @click="track('forum_apply_click')" class="hero-neon__button hero-neon__button--primary">
              {{ content.button }}
              <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a v-if="content.secondaryLink" :href="content.secondaryLink" class="hero-neon__button hero-neon__button--secondary">{{ content.secondaryButton || 'Как участвовать' }}</a>
            <a v-if="content.programLink" :href="content.programLink" class="hero-neon__button hero-neon__button--license" target="_blank" rel="noopener">
              {{ content.programLabel }}
              <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M9 15h6M9 18h4"/>
              </svg>
            </a>
          </div>
      </div>
    </section>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
const props = defineProps({ content: Object, showForm: Boolean, track: Function })
const backgroundStyle = computed(() => ({ backgroundImage: props.content.background ? `url("${encodeURI(props.content.background)}")` : 'none' }))
const lightBackgroundStyle = computed(() => ({ backgroundImage: props.content.lightBackground ? `url("${encodeURI(props.content.lightBackground)}")` : 'none' }))
const titleLines = computed(() => {
  const title = props.content.title.trim()
  return title.includes('\n') ? title.split('\n') : [title]
})
const objectVisible = name => props.content.objects?.find(object => object.name === name)?.visible !== false
const objectImage = (name, fallback) => props.content.objects?.find(object => object.name === name)?.image || fallback
const objectLightImage = (name, fallback) => props.content.objects?.find(object => object.name === name)?.lightImage || fallback
const heroRoot = ref(null)
const heroScene = ref(null)
const heroMotionReady = ref(false)
const heroFxPaused = ref(false)
const heroAnimations = new Set()
let heroMotionStarted = false
let heroIsUnmounted = false
const heroComets = [
  { id: 'c1', style: { '--fx-top': '12%', '--fx-right': '-15%', '--fx-length': '166px', '--fx-distance-x': '-64vw', '--fx-distance-y': '33vh', '--fx-angle': '-27deg', '--fx-cycle': '13s', '--fx-delay': '3.1s', '--fx-peak': '.66' } },
  { id: 'c2', style: { '--fx-top': '26%', '--fx-right': '-20%', '--fx-length': '114px', '--fx-distance-x': '-60vw', '--fx-distance-y': '26vh', '--fx-angle': '-23deg', '--fx-cycle': '17s', '--fx-delay': '6.7s', '--fx-peak': '.5' } },
  { id: 'c3', style: { '--fx-top': '5%', '--fx-right': '-17%', '--fx-length': '205px', '--fx-distance-x': '-62vw', '--fx-distance-y': '39vh', '--fx-angle': '-32deg', '--fx-cycle': '21s', '--fx-delay': '10.3s', '--fx-peak': '.56' } },
  { id: 'c4', style: { '--fx-top': '35%', '--fx-right': '-13%', '--fx-length': '92px', '--fx-distance-x': '-55vw', '--fx-distance-y': '22vh', '--fx-angle': '-20deg', '--fx-cycle': '24s', '--fx-delay': '14.2s', '--fx-peak': '.42' } }
]
const heroStars = [
  { id: 's1', style: { '--fx-top': '13%', '--fx-right': '15%', '--fx-distance-x': '-110px', '--fx-distance-y': '58px', '--fx-angle': '-28deg', '--fx-cycle': '10s', '--fx-delay': '4.2s' } },
  { id: 's2', style: { '--fx-top': '31%', '--fx-right': '33%', '--fx-distance-x': '-85px', '--fx-distance-y': '44px', '--fx-angle': '-27deg', '--fx-cycle': '13s', '--fx-delay': '7.9s' } },
  { id: 's3', style: { '--fx-top': '8%', '--fx-right': '41%', '--fx-distance-x': '-65px', '--fx-distance-y': '32px', '--fx-angle': '-24deg', '--fx-cycle': '17s', '--fx-delay': '11.4s' } },
  { id: 's4', style: { '--fx-top': '22%', '--fx-right': '8%', '--fx-distance-x': '-95px', '--fx-distance-y': '52px', '--fx-angle': '-29deg', '--fx-cycle': '19s', '--fx-delay': '5.8s' } },
  { id: 's5', style: { '--fx-top': '42%', '--fx-right': '22%', '--fx-distance-x': '-80px', '--fx-distance-y': '41px', '--fx-angle': '-25deg', '--fx-cycle': '22s', '--fx-delay': '12.6s' } },
  { id: 's6', style: { '--fx-top': '17%', '--fx-right': '48%', '--fx-distance-x': '-68px', '--fx-distance-y': '35px', '--fx-angle': '-31deg', '--fx-cycle': '24s', '--fx-delay': '8.6s' } },
  { id: 's7', style: { '--fx-top': '36%', '--fx-right': '4%', '--fx-distance-x': '-102px', '--fx-distance-y': '54px', '--fx-angle': '-25deg', '--fx-cycle': '27s', '--fx-delay': '16.1s' } },
  { id: 's8', style: { '--fx-top': '6%', '--fx-right': '26%', '--fx-distance-x': '-73px', '--fx-distance-y': '39px', '--fx-angle': '-29deg', '--fx-cycle': '29s', '--fx-delay': '19.3s' } }
]

onMounted(() => {
  document.addEventListener('visibilitychange', syncHeroAnimationVisibility)
  syncHeroAnimationVisibility()
  startHeroAssembly()
})
onBeforeUnmount(() => {
  heroIsUnmounted = true
  document.removeEventListener('visibilitychange', syncHeroAnimationVisibility)
  heroAnimations.forEach(animation => animation.cancel())
  heroAnimations.clear()
})
// One master schedule, implemented with the browser's composited animations.
// The full-scene wrappers move while their images keep the original positioning.
function startHeroAssembly() {
  if (heroMotionStarted) return
  heroMotionStarted = true
  const root = heroRoot.value
  const scene = heroScene.value
  if (!root || !scene || !Element.prototype.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroMotionReady.value = true
    return
  }

  try {
    const sceneRect = scene.getBoundingClientRect()
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const tablet = !mobile && window.matchMedia('(max-width: 1100px)').matches
    const tempo = mobile ? 0.66 : tablet ? 0.85 : 1
    const sceneDelay = mobile ? 0.65 : 0
    const power3 = 'cubic-bezier(0.22, 1, 0.36, 1)'
    const power2 = 'cubic-bezier(0.3, 0.8, 0.4, 1)'
    const intro = []

    function run(target, from, delay, duration, easing = power3, to = { transform: 'none', opacity: 1 }) {
      if (!target) return
      target.style.willChange = 'transform, opacity'
      const animation = target.animate([from, to], {
        delay: delay * tempo * 1000,
        duration: duration * tempo * 1000,
        easing,
        fill: 'both'
      })
      heroAnimations.add(animation)
      animation.addEventListener('finish', () => {
        target.style.willChange = ''
        heroAnimations.delete(animation)
        animation.cancel()
      }, { once: true })
      intro.push(animation.finished.catch(() => {}))
      return animation
    }

    function layer(name) {
      const wrapper = scene.querySelector(`[data-assembly="${name}"]`)
      const image = wrapper?.querySelector('img,video')
      if (!wrapper || !image) return null
      const rect = image.getBoundingClientRect()
      wrapper.style.transformOrigin = `${rect.left + rect.width / 2 - sceneRect.left}px ${rect.top + rect.height / 2 - sceneRect.top}px`
      return { wrapper, rect }
    }

    const podium = layer('podium')
    const pen = layer('pen')
    const topMolecule = layer('molecule-top')
    const midMolecule = layer('molecule-mid')
    const rightMolecule = layer('molecule-right')
    const leftBubbles = layer('bubbles-left')
    const rightBubbles = layer('bubbles-right')
    const topSphere = layer('sphere-top')
    const rightSphere = layer('sphere-right')
    const smallSphere = layer('sphere-small')

    if (podium) run(podium.wrapper, { transform: `translate3d(${Math.ceil(sceneRect.right - podium.rect.left + 24)}px, 20px, 0) scale(.88)`, opacity: 1 }, .15 + sceneDelay, 1.35)
    if (pen) run(pen.wrapper, { transform: `translate3d(38px, ${Math.floor(sceneRect.top - pen.rect.bottom - 24)}px, 0) rotate(8deg) scale(1.05)`, opacity: 1 }, .4 + sceneDelay, 1.5)
    if (topMolecule) run(topMolecule.wrapper, { transform: 'translate3d(35px, -120px, 0) rotate(-12deg) scale(.35)', opacity: 0 }, .65 + sceneDelay, 1.2)
    if (midMolecule) run(midMolecule.wrapper, { transform: 'translate3d(100px, 0, 0) rotate(9deg) scale(.45)', opacity: 0 }, .9 + sceneDelay, 1.1, power2)
    if (rightMolecule) run(rightMolecule.wrapper, { transform: `translate3d(${Math.ceil(sceneRect.right - rightMolecule.rect.left + 20)}px, 0, 0) rotate(-15deg) scale(.8)`, opacity: 1 }, 1.05 + sceneDelay, 1.1)
    if (leftBubbles) run(leftBubbles.wrapper, { transform: `translate3d(${Math.floor(sceneRect.left - leftBubbles.rect.right - 24)}px, 0, 0) scale(1.12)`, opacity: 1 }, .9 + sceneDelay, 1.2)
    if (rightBubbles) run(rightBubbles.wrapper, { transform: `translate3d(${Math.ceil(sceneRect.right - rightBubbles.rect.left + 24)}px, 30px, 0) scale(1.08)`, opacity: 1 }, 1.1 + sceneDelay, 1.25)
    if (topSphere) run(topSphere.wrapper, { transform: 'translate3d(70px, -50px, 0) scale(.6)', opacity: 0 }, 1.12 + sceneDelay, .85, power2)
    if (rightSphere) run(rightSphere.wrapper, { transform: 'translate3d(80px, 35px, 0) scale(.6)', opacity: 0 }, 1.25 + sceneDelay, .85, power2)
    if (smallSphere) run(smallSphere.wrapper, { transform: 'translate3d(-35px, -65px, 0) scale(.6)', opacity: 0 }, 1.38 + sceneDelay, .8, power2)

    run(root.querySelector('.hero-neon__badge'), { transform: 'translateY(16px)', opacity: 0 }, mobile ? .05 : .1, .65, power2)
    run(root.querySelector('.hero-neon__title'), { transform: 'translateY(16px)', opacity: 0 }, mobile ? .2 : .25, .75, power2)
    run(root.querySelector('.hero-neon__chips'), { transform: 'translateY(16px)', opacity: 0 }, mobile ? .45 : .55, .65, power2)
    run(root.querySelector('.hero-neon__actions'), { transform: 'translateY(16px)', opacity: 0 }, mobile ? 2.65 : .75, .65, power2)

    const energy = scene.querySelector('.hero-neon__energy')
    if (energy) {
      const pulse = energy.animate([{ opacity: 0 }, { opacity: .82, offset: .36 }, { opacity: 0 }], {
        delay: (1.95 + sceneDelay) * tempo * 1000,
        duration: .65 * tempo * 1000,
        easing: 'ease-in-out',
        fill: 'both'
      })
      heroAnimations.add(pulse)
      pulse.addEventListener('finish', () => { heroAnimations.delete(pulse); pulse.cancel() }, { once: true })
      intro.push(pulse.finished.catch(() => {}))
    }

    heroMotionReady.value = true
    syncHeroAnimationVisibility()
    Promise.all(intro).then(() => {
      if (heroIsUnmounted || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      startHeroIdle(scene, mobile)
    })
  } catch (error) {
    heroAnimations.forEach(animation => animation.cancel())
    heroAnimations.clear()
    heroMotionReady.value = true
    console.warn('[Hero] Assembly animation unavailable:', error)
  }
}

function startHeroIdle(scene, mobile) {
  const easing = 'ease-in-out'
  const idle = [
    ['pen', mobile ? -10 : -16, mobile ? 2 : 4, 6000],
    ['molecule-top', mobile ? -12 : -20, mobile ? -3 : -5, 7800],
    ['molecule-mid', mobile ? 10 : 17, mobile ? 2 : 5, 9200],
    ['molecule-right', mobile ? -9 : -15, mobile ? 3 : 6, 8400],
    ['sphere-top', mobile ? -11 : -18, mobile ? -2 : -4, 7100],
    ['sphere-right', mobile ? 9 : 15, mobile ? 2 : 4, 8800],
    ['sphere-small', mobile ? -8 : -13, mobile ? 2 : 4, 6600]
  ]
  for (const [name, y, x, duration] of idle) {
    const target = scene.querySelector(`[data-assembly="${name}"]`)
    if (!target) continue
    const animation = target.animate([
      { transform: 'translate3d(0, 0, 0)' },
      { transform: `translate3d(${x}px, ${y}px, 0)` },
      { transform: 'translate3d(0, 0, 0)' }
    ], { duration, iterations: Infinity, easing })
    heroAnimations.add(animation)
  }
  syncHeroAnimationVisibility()
}

function syncHeroAnimationVisibility() {
  heroFxPaused.value = document.hidden
  for (const animation of heroAnimations) {
    if (document.hidden) animation.pause()
    else if (animation.playState === 'paused') animation.play()
  }
}


</script>
<style scoped src="./mainHero.css"></style>
