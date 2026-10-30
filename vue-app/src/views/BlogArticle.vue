<template>
  <div class="blog-page"><div class="blog-shell"><article v-if="post" class="blog-article">
    <router-link to="/blog" class="blog-article__back">← Все статьи</router-link>
    <header class="blog-article__header"><div class="blog-article__categories"><span v-for="category in post.categories || []" :key="category.id" class="blog-category">{{ category.name }}</span><span v-if="!post.categories?.length" class="blog-category">Статья</span></div><h1>{{ post.title }}</h1><p class="blog-article__lead">{{ post.excerpt }}</p><div class="blog-meta blog-article__meta">
      <BlogDate :value="post.publishedAt" />
      <span class="blog-article__meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.5-3.5 2.8-5.5 6.5-5.5s6 2 6.5 5.5"/></svg>{{ post.author }}</span>
      <span class="blog-article__meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>{{ post.readingMinutes }} мин. чтения</span>
    </div></header>
    <figure v-if="post.cover" class="blog-article__cover-frame" :style="coverPixelWidth ? { maxWidth: `${coverPixelWidth + 46}px`, '--cover-pixel-width': `${coverPixelWidth}px` } : {}">
      <img class="blog-article__cover" :src="post.cover" :alt="post.coverAlt" @load="measureCover">
    </figure>
    <div class="blog-article__content" v-html="post.content"></div>
    <section v-if="related.length" class="blog-article__related"><h2>Похожие статьи</h2><div class="blog-grid"><router-link v-for="item in related" :key="item.id" :to="`/blog/${item.slug}`" class="blog-card blog-glass"><div class="blog-card__image"><img :src="item.cover" :alt="item.coverAlt" loading="lazy"></div><div class="blog-card__copy"><h3>{{ item.title }}</h3><p>{{ item.excerpt }}</p><div class="blog-meta"><BlogDate :value="item.publishedAt" /><span>{{ item.readingMinutes }} мин.</span></div></div></router-link></div></section>
  </article><div v-else-if="loading" class="blog-message">Загружаем статью…</div><div v-else class="blog-message">{{ error }} <router-link to="/blog">Вернуться в блог</router-link></div></div></div>
</template>
<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import BlogDate from '../components/BlogDate.vue'
import { setBlogSeo, clearBlogSeo } from '../utils/blogSeo'
import './blog.css'
import './blogArticleTypography.css'

const route = useRoute()
const post = ref(null)
const related = ref([])
const loading = ref(true)
const error = ref('')
const coverPixelWidth = ref(null)
let loadRequestId = 0
function measureCover(event) {
  const image = event.target
  coverPixelWidth.value = image.naturalWidth ? Math.floor(image.naturalWidth / Math.max(1, window.devicePixelRatio || 1)) : null
}
async function load() {
  const requestId = ++loadRequestId
  post.value = null; coverPixelWidth.value = null; loading.value = true; error.value = ''
  try {
    const { data } = await axios.get(`/api/blog/posts/${encodeURIComponent(route.params.slug)}`)
    if (data.post.cover) {
      const cover = new Image()
      cover.src = data.post.cover
      try { await cover.decode() } catch { /* Article remains available if the cover fails */ }
      if (requestId !== loadRequestId) return
      if (cover.naturalWidth) coverPixelWidth.value = Math.floor(cover.naturalWidth / Math.max(1, window.devicePixelRatio || 1))
    }
    if (requestId !== loadRequestId) return
    post.value = data.post; related.value = data.related
    setBlogSeo({ title: post.value.metaTitle || post.value.title, description: post.value.metaDescription || post.value.excerpt, path: `/blog/${post.value.slug}`, image: post.value.cover, article: post.value })
  } catch { if (requestId === loadRequestId) { error.value = 'Статья не найдена.'; setBlogSeo({ title: 'Статья не найдена', description: '', path: `/blog/${encodeURIComponent(route.params.slug)}`, index: false }) } }
  finally { if (requestId === loadRequestId) loading.value = false }
}
onMounted(load)
watch(() => route.params.slug, load)
onUnmounted(clearBlogSeo)
</script>
