import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'AdminLogin',
    component: () => import('../views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/DashboardContent.vue') },
      { path: 'products', name: 'AdminProducts', component: () => import('../views/Products.vue') },
      { path: 'products/new', name: 'NewProduct', component: () => import('../views/ProductForm.vue') },
      { path: 'products/:id/edit', name: 'EditProduct', component: () => import('../views/ProductForm.vue') },
      { path: 'categories', name: 'AdminCategories', component: () => import('../views/Categories.vue') },
      { path: 'orders', name: 'AdminOrders', component: () => import('../views/Orders.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/Users.vue') },
      { path: 'partners', name: 'AdminPartners', component: () => import('../views/Partners.vue') },
      { path: 'promo-codes', name: 'PromoCodes', component: () => import('../views/PromoCodes.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.token) {
    next('/login')
  } else if (to.meta.guest && authStore.token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router