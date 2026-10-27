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
      { path: 'analytics', name: 'AdminAnalytics', component: () => import('../views/Analytics.vue') },
      { path: 'categories', name: 'AdminCategories', component: () => import('../views/Categories.vue') },
      { path: 'blog', name: 'AdminBlog', component: () => import('../views/BlogAdmin.vue'), meta: { blogAccess: true } },
      { path: 'blog/new', name: 'AdminBlogNew', component: () => import('../views/BlogEditor.vue'), meta: { blogAccess: true } },
      { path: 'blog/:id/edit', name: 'AdminBlogEdit', component: () => import('../views/BlogEditor.vue'), meta: { blogAccess: true } },
      { path: 'orders', name: 'AdminOrders', component: () => import('../views/Orders.vue') },
      { path: 'consultations', name: 'AdminConsultations', component: () => import('../views/Consultations.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/Users.vue') },
      { path: 'roles', name: 'AdminRoles', component: () => import('../views/Roles.vue') },
      { path: 'users/:id', name: 'AdminUserDetail', component: () => import('../views/UserDetail.vue') },
      { path: 'user-points', name: 'AdminUserPoints', component: () => import('../views/UserPoints.vue') },
      { path: 'partners', name: 'AdminPartners', component: () => import('../views/Partners.vue') },
      { path: 'partner-applications', name: 'PartnerApplications', component: () => import('../views/PartnerApplications.vue') },
      { path: 'partners/:id', name: 'PartnerDetail', component: () => import('../views/PartnerDetail.vue') },
      { path: 'partner-payouts', name: 'PartnerPayouts', component: () => import('../views/PartnerPayouts.vue') },
      { path: 'dealers', name: 'AdminDealers', component: () => import('../views/Dealers.vue') },
      { path: 'promo-codes', name: 'PromoCodes', component: () => import('../views/PromoCodes.vue') },
      { path: 'email-campaigns', name: 'EmailCampaigns', component: () => import('../views/EmailCampaigns.vue') },
      { path: 'cdek', name: 'Cdek', component: () => import('../views/Cdek.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const sectionForPath = path => {
  if (path === '/roles' || path.startsWith('/users')) return 'ADMIN_ONLY'
  if (path.startsWith('/products')) return 'PRODUCTS'
  if (path.startsWith('/analytics')) return 'ANALYTICS'
  if (path.startsWith('/categories')) return 'CATEGORIES'
  if (path.startsWith('/blog')) return 'BLOG'
  if (path.startsWith('/orders')) return 'ORDERS'
  if (path.startsWith('/consultations')) return 'CONSULTATIONS'
  if (path.startsWith('/user-points')) return 'POINTS'
  if (path.startsWith('/partner-applications')) return 'APPLICATIONS'
  if (path.startsWith('/partner-payouts')) return 'PAYOUTS'
  if (path.startsWith('/partners')) return 'PARTNERS'
  if (path.startsWith('/dealers')) return 'DEALERS'
  if (path.startsWith('/promo-codes')) return 'PROMO'
  if (path.startsWith('/email-campaigns')) return 'EMAIL'
  if (path.startsWith('/cdek')) return 'CDEK'
  return 'DASHBOARD'
}

router.beforeEach(async to => {
  const authStore = useAuthStore()
  if (!authStore.token) return to.meta.requiresAuth ? '/login' : true
  if (!await authStore.refreshUser()) return to.path === '/login' ? true : '/login'
  if (to.meta.guest) return authStore.landingPath
  if (to.meta.requiresAuth && !authStore.can(sectionForPath(to.path))) return authStore.landingPath
  return true
})

export default router
