<template><div ref="page" class="forum-page"><header class="site-header"><div class="wrap header-inner"><a href="#top" class="brand" aria-label="Angel Wings — наверх"><img src="/angel-wings-wordmark-light.svg" alt="Angel Wings"></a><nav class="desktop-nav" aria-label="Навигация форума"><a v-for="item in nav" :key="item.id" :href="`#${item.id}`">{{ item.label }}</a></nav><a v-if="content?.form.visible" href="#application" class="header-cta" @click="track('forum_apply_click')">{{ content.form.navButton }} <span>↗</span></a><button class="menu-toggle" type="button" :aria-expanded="menuOpen" aria-label="Открыть меню" @click="menuOpen=!menuOpen">☰</button></div><nav v-if="menuOpen" class="mobile-nav" aria-label="Мобильная навигация"><a v-for="item in nav" :key="item.id" :href="`#${item.id}`" @click="menuOpen=false">{{ item.label }}</a></nav></header>
<main v-if="content"><ForumHero :content="content.hero" :show-form="content.form.visible" :track="track"/><div ref="sectionsRoot" class="forum-sections"><div class="forum-sections__blend" aria-hidden="true"></div><ForumBackgroundScene :height="sceneHeight"/><ForumBenefits :content="content.advantages"/><ForumProducts :content="content.products" :products="products" :track="track"/><ForumAbout :content="content.about"/><ForumEvents :content="content.events"/><ForumCTA :content="content.cta" :show-form="content.form.visible" :track="track"/><ForumApplicationForm :content="content.form" :track="track"/></div></main><main v-else class="loading-state" role="status">{{ loadError||'Загружаем страницу форума…' }}</main>
<footer v-if="content?.footer.visible" class="site-footer"><div class="wrap footer-grid"><div class="footer-brand"><img src="/angel-wings-wordmark-light.svg" alt="Angel Wings"><p>{{ content.footer.description }}</p></div><div><h3>{{ content.footer.navHeading }}</h3><a v-for="item in nav" :key="item.id" :href="`#${item.id}`">{{ item.label }}</a></div><div><h3>{{ content.footer.infoHeading }}</h3><a :href="content.footer.mainSite">{{ content.footer.mainSiteLabel }}</a><a :href="content.footer.privacyLink" target="_blank" rel="noopener">{{ content.footer.privacyLabel }}</a></div><div><h3>{{ content.footer.contactsHeading }}</h3><a v-if="content.footer.email" :href="`mailto:${content.footer.email}`">{{ content.footer.email }}</a><a v-if="content.footer.phone" :href="`tel:${content.footer.phone.replace(/\D/g,'')}`">{{ content.footer.phone }}</a><a v-if="content.footer.telegram" :href="content.footer.telegram" target="_blank" rel="noopener">{{ content.footer.telegramLabel }} ↗</a></div></div><div class="wrap footer-bottom">{{ content.footer.copyright }}</div></footer></div></template>
<script setup>
import {computed,nextTick,onMounted,ref} from 'vue'
import {useForumMotion} from './composables/useForumMotion.js'
import {useSceneHeight} from './composables/useSceneHeight.js'
import ForumBackgroundScene from './components/ForumBackgroundScene.vue'
import ForumHero from './components/ForumHero.vue'
import ForumBenefits from './components/ForumBenefits.vue'
import ForumProducts from './components/ForumProducts.vue'
import ForumAbout from './components/ForumAbout.vue'
import ForumEvents from './components/ForumEvents.vue'
import ForumCTA from './components/ForumCTA.vue'
import ForumApplicationForm from './components/ForumApplicationForm.vue'
const page=ref(null),content=ref(null),loadError=ref(''),menuOpen=ref(false),catalog=ref([])
const sectionsRoot = ref(null)
const sceneHeight = useSceneHeight(sectionsRoot)
const nav=computed(()=>[['top',content.value?.hero.navLabel,'hero'],['about',content.value?.about.navLabel,'about'],['products',content.value?.products.navLabel,'products'],['events',content.value?.events.navLabel,'events'],['application',content.value?.form.navLabel,'form']].filter(x=>content.value?.[x[2]]?.visible).map(([id,label])=>({id,label})))
const products=computed(()=>{
  if (!catalog.value.length) return []
  const normalize=value=>String(value||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('ru-RU')
  const selections=content.value?.products.items||[]
  const valid=catalog.value.filter(product=>product?.id&&product?.active!==false&&!/тестов|test/i.test(product.description||'')&&!/picsum\.photos|placeholder/i.test(product.image||''))
  const selected=selections.map(item=>valid.find(product=>normalize(product.title)===normalize(item.title))).filter(Boolean)
  const ordered=[...selected,...valid.filter(product=>!selected.some(chosen=>chosen.id===product.id))]
  return ordered.map(live=>{
    const item=selections.find(entry=>normalize(entry.title)===normalize(live.title))||{}
    const sourceImage=item.image||live.image||''
    const image=sourceImage.startsWith('/uploads/')?`https://angel-wings.ru${sourceImage}`:sourceImage
    return {...live,title:live.title,image,video:item.video||'',text:item.text||(live.description||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(),price:item.price||live.price||null,link:item.link||`https://angel-wings.ru/product/${live.id}`}
  })
})
function track(event){window.dispatchEvent(new CustomEvent('angel-wings:analytics',{detail:{event}}));if(Array.isArray(window.dataLayer))window.dataLayer.push({event})}
onMounted(async()=>{try{const response=await fetch('/api/forum');if(!response.ok)throw new Error();content.value=(await response.json()).content;track('forum_view');await nextTick()}catch{loadError.value='Не удалось загрузить страницу. Обновите её позже.'}try{const response=await fetch(import.meta.env.DEV?'/catalog-api/products?limit=100':'/api/products?limit=100');if(response.ok){const data=await response.json();catalog.value=Array.isArray(data)?data:Array.isArray(data.products)?data.products:[]}}catch{}})
useForumMotion(page,content)
</script>
