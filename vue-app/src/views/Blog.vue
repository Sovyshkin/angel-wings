<template>
  <div class="blog-page">
    <div ref="blogShell" class="blog-shell" :class="{ 'is-motion-ready': motionReady }">
      <div ref="backdropDecor" class="blog-backdrop-molecules" aria-hidden="true">
        <img v-for="(decor, index) in backgroundDecor" :key="index" :class="['blog-backdrop-molecules__item', `blog-backdrop-molecules__item--${index + 1}`, { 'blog-backdrop-molecules__drop': decor.drop }]" :src="decor.src" alt="" :width="decor.width" :height="decor.height" loading="lazy" decoding="async" fetchpriority="low">
      </div>
      <div v-if="unsubscribeToken" class="blog-unsubscribe blog-glass"><p>{{ unsubscribeNotice || 'Отписаться от писем блога ANGEL WINGS?' }}</p><button v-if="!unsubscribeNotice" @click="unsubscribe">Подтвердить отписку</button></div>
      <div v-if="confirmationToken" class="blog-unsubscribe blog-glass"><p>{{ confirmationNotice || 'Подтвердить подписку на блог ANGEL WINGS?' }}</p><button v-if="!confirmationNotice" @click="confirmSubscription">Подтвердить подписку</button></div>
      <section class="blog-hero">
        <div class="blog-hero__copy">
          <span class="blog-eyebrow blog-reveal"><span class="blog-eyebrow__dot"></span> БЛОГ</span>
          <h1 class="blog-reveal" style="--reveal-delay: 90ms">Знания о пептидах<br>для более <em>здоровой<br>и активной жизни</em></h1>
          <p class="blog-reveal" style="--reveal-delay: 170ms">Научные статьи, практические советы и последние исследования в мире пептидной терапии.</p>
          <form class="blog-search blog-reveal" style="--reveal-delay: 250ms" @submit.prevent="applySearch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m16 16 4.5 4.5"/></svg>
            <input v-model="searchInput" type="search" placeholder="Поиск по статьям, темам, ключевым словам..." aria-label="Поиск статей">
            <button aria-label="Искать">→</button>
          </form>
        </div>
        <div class="blog-hero__art blog-reveal" style="--reveal-delay: 190ms" aria-hidden="true">
          <img class="blog-hero__orbit" src="/blog-assets/blog-hero-orbit.webp" alt="" width="1672" height="941" decoding="async">
          <img class="blog-hero__molecule" src="/blog-assets/blog-hero-molecule.webp" alt="" width="1254" height="1254" fetchpriority="high" decoding="async">
          <div class="blog-hero__legend">НАУКА<br>ВОССТАНОВЛЕНИЕ<br>ЗДОРОВЬЕ<br>ДОЛГОЛЕТИЕ</div>
        </div>
      </section>

      <div class="blog-filters blog-reveal" style="--reveal-delay: 320ms" role="group" aria-label="Категории блога">
        <button :class="{ active: !selectedCategory }" @click="setCategory('')">Все статьи</button>
        <button v-for="category in categories" :key="category.id" :class="{ active: selectedCategory === category.slug }" @click="setCategory(category.slug)">{{ category.name }}</button>
      </div>

      <router-link v-if="featured && !selectedCategory && !search" :to="`/blog/${featured.slug}`" class="blog-featured blog-glass blog-reveal">
        <div class="blog-featured__image"><img :src="featured.cover" :alt="featured.coverAlt"><span>✦ РЕКОМЕНДУЕМ</span></div>
        <div class="blog-featured__body">
          <span class="blog-category">{{ featured.category?.name || 'Статья' }}</span>
          <h2>{{ featured.title }}</h2>
          <p>{{ featured.excerpt }}</p>
          <div class="blog-meta"><span>▦ {{ formatDate(featured.publishedAt) }}</span><span>◉ {{ featured.readingMinutes }} мин. чтения</span></div>
        </div>
        <span class="blog-featured__arrow">→</span>
      </router-link>

      <div class="blog-section-title blog-reveal"><h2>Все статьи</h2><select v-model="sort" aria-label="Сортировка статей"><option value="newest">Сначала новые</option><option value="oldest">Сначала старые</option></select></div>
      <div v-if="loading" class="blog-message blog-reveal">Загружаем статьи…</div>
      <div v-else-if="error" class="blog-message blog-message--error blog-reveal">{{ error }} <button @click="loadPosts">Повторить</button></div>
      <div v-else-if="!posts.length" class="blog-message blog-reveal">Пока нет опубликованных статей по этому запросу.</div>
      <div v-else class="blog-grid">
        <router-link v-for="(post, index) in posts" :key="post.id" :to="`/blog/${post.slug}`" class="blog-card blog-glass blog-reveal" :style="{ '--reveal-delay': `${Math.min(index % 3, 2) * 85}ms` }">
          <div class="blog-card__image"><img :src="post.cover" :alt="post.coverAlt" loading="lazy"><span class="blog-category">{{ post.category?.name || 'Статья' }}</span></div>
          <div class="blog-card__copy"><h3>{{ post.title }}</h3><p>{{ post.excerpt }}</p><div class="blog-meta"><span>▦ {{ formatDate(post.publishedAt) }}</span><span>◉ {{ post.readingMinutes }} мин.</span></div></div>
        </router-link>
      </div>
      <nav v-if="pages > 1" class="blog-pagination blog-reveal" aria-label="Страницы блога"><button :disabled="currentPage === 1" @click="goPage(currentPage - 1)">←</button><button v-for="number in pages" :key="number" :class="{ active: number === currentPage }" @click="goPage(number)">{{ number }}</button><button :disabled="currentPage === pages" @click="goPage(currentPage + 1)">→</button></nav>

      <section class="blog-subscribe blog-glass blog-reveal"><div><h2>Будьте в курсе <em>новых статей</em><br>и исследований</h2><p>Подпишитесь на рассылку и получайте материалы о пептидах, здоровье и научных открытиях.</p></div><form @submit.prevent="subscribe"><div class="blog-subscribe__field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></svg><input v-model="email" type="email" required placeholder="Ваш email" aria-label="Ваш email"><button :disabled="submitting" aria-label="Подписаться">→</button></div><label class="blog-subscribe__consent"><input v-model="consent" type="checkbox" required> Согласен получать письма и с <a href="/policy.pdf" target="_blank" rel="noopener">политикой конфиденциальности</a></label><p v-if="subscribeNotice" class="blog-subscribe__notice" role="status">{{ subscribeNotice }}</p></form><img src="/hero-assets/молекула-2-640.webp" alt="" aria-hidden="true" width="640" height="427" loading="eager" decoding="async"></section>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { setBlogSeo, clearBlogSeo } from '../utils/blogSeo'
import './blog.css'
import './blogExtras.css'

const route = useRoute()
const router = useRouter()
const backdropDecor = ref(null)
const blogShell = ref(null)
const motionReady = ref(false)
const backgroundDecor = [
  { src: '/hero-assets/молекула-1-640.webp', width: 640, height: 427 },
  { src: '/hero-assets/молекула-3-520.webp', width: 520, height: 780 },
  { src: '/hero-assets/молекула-2-640.webp', width: 640, height: 427 },
  { src: '/hero-assets/капелька-1-420.webp', width: 420, height: 384, drop: true },
  { src: '/hero-assets/молекула-1-640.webp', width: 640, height: 427 },
  { src: '/hero-assets/молекула-3-520.webp', width: 520, height: 780 },
  { src: '/hero-assets/молекула-2-640.webp', width: 640, height: 427 },
  { src: '/hero-assets/капелька-2-420.webp', width: 420, height: 385, drop: true },
  { src: '/hero-assets/молекула-1-640.webp', width: 640, height: 427 },
  { src: '/hero-assets/молекула-3-520.webp', width: 520, height: 780 },
  { src: '/hero-assets/молекула-2-640.webp', width: 640, height: 427 },
  { src: '/hero-assets/капелька-1-420.webp', width: 420, height: 384, drop: true }
]
let backdropObserver = null
let revealObserver = null
const posts = ref([])
const featured = ref(null)
const categories = ref([])
const loading = ref(true)
const error = ref('')
const pages = ref(1)
const currentPage = ref(1)
const selectedCategory = ref('')
const search = ref('')
const searchInput = ref('')
const sort = ref('newest')
const email = ref('')
const consent = ref(false)
const submitting = ref(false)
const subscribeNotice = ref('')
const unsubscribeToken = ref('')
const unsubscribeNotice = ref('')
const confirmationToken = ref('')
const confirmationNotice = ref('')
const formatDate = date => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
function syncQuery() { selectedCategory.value = String(route.query.category || ''); search.value = String(route.query.search || ''); searchInput.value = search.value; currentPage.value = Math.max(1, Number(route.query.page) || 1) }
async function loadPosts() {
  loading.value = true; error.value = ''
  try { const { data } = await axios.get('/api/blog/posts', { params: { category: selectedCategory.value, search: search.value, sort: sort.value, page: currentPage.value } }); posts.value = data.posts; pages.value = data.pages }
  catch { error.value = 'Не удалось загрузить статьи.' }
  finally { loading.value = false }
}
function updateQuery(patch) { router.push({ path: '/blog', query: { ...route.query, ...patch, page: undefined } }) }
function applySearch() { updateQuery({ search: searchInput.value.trim() || undefined }) }
function setCategory(category) { updateQuery({ category: category || undefined }) }
function goPage(number) { router.push({ path: '/blog', query: { ...route.query, page: number === 1 ? undefined : number } }) }
async function subscribe() {
  submitting.value = true; subscribeNotice.value = ''
  try { const { data } = await axios.post('/api/blog/subscribe', { email: email.value, consent: consent.value }); subscribeNotice.value = data.message; email.value = ''; consent.value = false }
  catch (err) { subscribeNotice.value = err.response?.data?.error || 'Не удалось оформить подписку' }
  finally { submitting.value = false }
}
async function unsubscribe() {
  try { const { data } = await axios.post('/api/blog/unsubscribe', { token: unsubscribeToken.value }); unsubscribeNotice.value = data.message }
  catch { unsubscribeNotice.value = 'Ссылка недействительна. Обратитесь к нам для отписки.' }
}
async function confirmSubscription() {
  try { const { data } = await axios.post('/api/blog/confirm-subscription', { token: confirmationToken.value }); confirmationNotice.value = data.message }
  catch (err) { confirmationNotice.value = err.response?.data?.error || 'Не удалось подтвердить подписку.' }
}
function startBackdropMotion() {
  const items = backdropDecor.value?.querySelectorAll('.blog-backdrop-molecules__item')
  if (!items?.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('is-ambient-active'))
    return
  }
  backdropObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('is-ambient-active', entry.isIntersecting))
  }, { rootMargin: '140px 0px' })
  items.forEach(item => backdropObserver.observe(item))
}
function observeReveals() {
  if (!revealObserver) return
  blogShell.value?.querySelectorAll('.blog-reveal:not(.is-visible)').forEach(item => revealObserver.observe(item))
}
function startRevealMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const isReadyToEnter = entry.isIntersecting && entry.intersectionRatio >= .16
      const hasFullyLeftViewport = entry.boundingClientRect.bottom < -48
        || entry.boundingClientRect.top > window.innerHeight + 48
      if (isReadyToEnter && !entry.target.classList.contains('is-visible')) {
        entry.target.classList.remove('is-leaving')
        entry.target.classList.add('is-visible')
        if (entry.target.classList.contains('blog-subscribe')) revealObserver?.unobserve(entry.target)
      } else if (hasFullyLeftViewport && entry.target.classList.contains('is-visible')) {
        entry.target.classList.remove('is-visible')
        entry.target.classList.add('is-leaving')
      }
    })
  }, { threshold: [0, .16], rootMargin: '48px 0px 48px 0px' })
  observeReveals()
  motionReady.value = true
}
onMounted(async () => {
  startBackdropMotion()
  startRevealMotion()
  unsubscribeToken.value = String(route.query.unsubscribe || '')
  confirmationToken.value = String(route.query.confirm || '')
  setBlogSeo({ title: 'Блог о пептидах', description: 'Научные статьи и материалы о пептидах от ANGEL WINGS.', path: '/blog' })
  syncQuery(); await loadPosts()
  try { const [cat, best] = await Promise.all([axios.get('/api/blog/categories'), axios.get('/api/blog/featured')]); categories.value = cat.data; featured.value = best.data } catch { /* listing already handles API errors */ }
})
watch(() => route.query, () => { syncQuery(); loadPosts() })
watch(sort, loadPosts)
watch([posts, featured, loading, error, pages], async () => { await nextTick(); observeReveals() }, { flush: 'post' })
onUnmounted(() => { backdropObserver?.disconnect(); revealObserver?.disconnect(); clearBlogSeo() })
</script>
