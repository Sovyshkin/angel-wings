import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { useAuthStore } from '../store/auth'
import axios from 'axios'

const Catalog = () => import('../views/Catalog.vue')
const Cart = () => import('../views/Cart.vue')
const ProductDetail = () => import('../views/ProductDetail.vue')
const Auth = () => import('../views/Auth.vue')
const Profile = () => import('../views/Profile.vue')
const Contact = () => import('../views/Contact.vue')
const AboutCompany = () => import('../views/AboutCompany.vue')
const DeliveryPayment = () => import('../views/DeliveryPayment.vue')
const Guarantees = () => import('../views/Guarantees.vue')
const Faq = () => import('../views/Faq.vue')
const Requisites = () => import('../views/Requisites.vue')
const OrderSuccess = () => import('../views/OrderSuccess.vue')
const OrderFail = () => import('../views/OrderFail.vue')
const PartnerCabinet = () => import('../views/PartnerCabinet.vue')

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/catalog', name: 'Catalog', component: Catalog },
  { path: '/cart', name: 'Cart', component: Cart },
  { path: '/product/:id', name: 'ProductDetail', component: ProductDetail },
  { path: '/auth', name: 'Auth', component: Auth },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/contact', name: 'Contact', component: Contact },
  { path: '/about', name: 'AboutCompany', component: AboutCompany },
  { path: '/delivery-payment', name: 'DeliveryPayment', component: DeliveryPayment },
  { path: '/guarantees', name: 'Guarantees', component: Guarantees },
  { path: '/faq', name: 'Faq', component: Faq },
  { path: '/requisites', name: 'Requisites', component: Requisites },
  { path: '/order-success', name: 'OrderSuccess', component: OrderSuccess },
  { path: '/order-failed', name: 'OrderFail', component: OrderFail },
  { path: '/partner', name: 'PartnerCabinet', component: PartnerCabinet, meta: { requiresAuth: true, requiresPartner: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        top: 90,
        behavior: 'smooth'
      }
    }
    return { top: 0 }
  }
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/auth')
  }

  if (!to.meta.requiresPartner) {
    return next()
  }

  if (authStore.user?.role === 'ADMIN') {
    return next()
  }

  try {
    await axios.get('/api/partner/cabinet/stats')
    return next()
  } catch (error) {
    if (error?.response?.status === 401) {
      authStore.logout()
      return next('/auth')
    }
    return next('/profile')
  }
})

export default router
