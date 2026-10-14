import { createRouter, createWebHistory } from 'vue-router'
import Catalog from './views/Catalog.vue'

const routes = [
  { path: '/', redirect: '/catalog' },
  { path: '/catalog', component: Catalog },
  { path: '/product/:id', component: () => import('./views/ProductDetail.vue') },
  { path: '/cart', component: () => import('./views/Cart.vue') },
  { path: '/profile', component: () => import('./views/Profile.vue') },
  { path: '/orders', redirect: '/profile?tab=orders' },
  { path: '/order-success', component: () => import('./views/OrderSuccess.vue') },
  { path: '/order-failed', component: () => import('./views/OrderFail.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/catalog' }
]

export default createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior() { return { top: 0 } }
})
