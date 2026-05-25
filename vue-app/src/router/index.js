import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Catalog from '../views/Catalog.vue'
import Cart from '../views/Cart.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Auth from '../views/Auth.vue'
import Profile from '../views/Profile.vue'
import Contact from '../views/Contact.vue'
import AboutCompany from '../views/AboutCompany.vue'
import DeliveryPayment from '../views/DeliveryPayment.vue'
import Guarantees from '../views/Guarantees.vue'
import Faq from '../views/Faq.vue'
import Requisites from '../views/Requisites.vue'
import OrderSuccess from '../views/OrderSuccess.vue'
import OrderFail from '../views/OrderFail.vue'
import PartnerCabinet from '../views/PartnerCabinet.vue'
import { useAuthStore } from '../store/auth'
import axios from 'axios'

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
