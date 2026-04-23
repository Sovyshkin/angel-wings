<template>
  <div class="cart">
    <div class="cart__hero">
      <div class="container">
        <h1 class="page-title">Корзина</h1>
        <p class="page-subtitle">Оформите заказ на выбранные товары</p>
      </div>
    </div>
    
    <div class="container">
      <div v-if="cartStore.items.length === 0" class="empty">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <h3>Корзина пуста</h3>
        <p>Добавьте товары из каталога для оформления заказа</p>
        <router-link to="/catalog" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          В каталог
        </router-link>
      </div>
      
      <div v-else class="cart__layout">
        <div class="cart__items">
          <div class="cart-header">
            <span class="col-product">Товар</span>
            <span class="col-price">Цена</span>
            <span class="col-quantity">Количество</span>
            <span class="col-total">Сумма</span>
            <span class="col-remove"></span>
          </div>
          
          <div class="cart-item" v-for="item in cartStore.items" :key="item.id">
            <div class="col-product">
              <div class="item-image">
                <img v-if="item.image" :src="item.image" :alt="item.title" @error="$event.target.style.display='none'">
                <div v-else class="item-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              </div>
              <div class="item-info">
                <h4>{{ item.title }}</h4>
                <span class="item-category">{{ getCategoryName(item.category[0]) }}</span>
              </div>
            </div>
            <div class="col-price">{{ item.price.toLocaleString() }} ₽</div>
            <div class="col-quantity">
              <div class="quantity-selector">
                <button @click="decreaseQty(item)" :disabled="item.quantity <= 1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <span>{{ item.quantity }}</span>
                <button @click="increaseQty(item)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="col-total">{{ (item.price * item.quantity).toLocaleString() }} ₽</div>
            <button class="col-remove item-remove" @click="cartStore.removeItem(item.id)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
          
          <div class="cart-actions">
            <button class="btn-clear" @click="cartStore.clear()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              Очистить корзину
            </button>
          </div>
        </div>
        
        <div class="cart__summary">
          <div class="summary-header">
            <h3>Ваш заказ</h3>
            <span class="item-count">{{ cartStore.count }} товаров</span>
          </div>
          
          <div class="summary-items">
            <div class="summary-row">
              <span>Товары</span>
              <span>{{ cartStore.total.toLocaleString() }} ₽</span>
            </div>
            <div class="summary-row">
              <span>Доставка</span>
              <span class="delivery-calc">Рассчитывается</span>
            </div>
          </div>
          
          <div class="summary-total">
            <span>Итого</span>
            <span class="total-value">{{ cartStore.total.toLocaleString() }} ₽</span>
          </div>
          
          <div class="checkout-form">
            <h4>Контактные данные</h4>
            <div class="form-group">
              <label>Имя</label>
              <input v-model="customer.name" type="text" class="input" placeholder="Иван Иванов">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Телефон</label>
                <input v-model="customer.phone" type="tel" class="input" placeholder="+7 (999) 999-99-99">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input v-model="customer.email" type="email" class="input" placeholder="example@mail.ru">
              </div>
            </div>
            <div class="form-group">
              <label>Адрес доставки</label>
              <textarea v-model="customer.address" class="input" rows="3" placeholder="Город, улица, дом, квартира"></textarea>
            </div>
            <div class="form-group">
              <label>Комментарий к заказу</label>
              <textarea v-model="customer.comment" class="input" rows="2" placeholder="Дополнительные пожелания..."></textarea>
            </div>
            
            <button class="btn btn-primary btn-submit" @click="placeOrder" :disabled="!isFormValid || ordering">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {{ ordering ? 'Оформляем...' : 'Оформить заказ' }}
            </button>
            
            <p v-if="orderSuccess" class="success-message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '../store/cart'
import { useProductStore } from '../store/products'

const cartStore = useCartStore()
const productStore = useProductStore()

const customer = ref({ name: '', phone: '', email: '', address: '', comment: '' })
const ordering = ref(false)
const orderSuccess = ref(false)

const isFormValid = computed(() => {
  return customer.value.name && customer.value.phone && customer.value.email
})

function getCategoryName(slug) {
  if (!slug) return ''
  const cat = productStore.categories.find(c => c.slug === slug)
  return cat ? cat.name : slug
}

function increaseQty(item) {
  cartStore.updateQuantity(item.id, item.quantity + 1)
}

function decreaseQty(item) {
  if (item.quantity > 1) {
    cartStore.updateQuantity(item.id, item.quantity - 1)
  }
}

async function placeOrder() {
  ordering.value = true
  try {
    await productStore.createOrder(cartStore.items, customer.value)
    cartStore.clear()
    orderSuccess.value = true
    customer.value = { name: '', phone: '', email: '', address: '', comment: '' }
    setTimeout(() => { orderSuccess.value = false }, 8000)
  } finally {
    ordering.value = false
  }
}
</script>

<style scoped>
.cart {
  padding-bottom: 6rem;
}

.cart__hero {
  padding: 4rem 0;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-bottom: 1px solid var(--border);
  margin-bottom: 3rem;
}

.empty {
  text-align: center;
  padding: 5rem 0;
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.empty h3 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.empty p {
  color: var(--text-muted);
  margin-bottom: 2rem;
}

.cart__layout {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 3rem;
  align-items: start;
}

.cart__items {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
}

.cart-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 50px;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--bg-secondary);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.cart-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 50px;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border);
  align-items: center;
}

.col-product {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.item-info h4 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.item-category {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.col-price,
.col-total {
  font-family: var(--font-mono);
  font-weight: 700;
}

.col-total {
  color: var(--accent);
}

.quantity-selector {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 0.25rem;
}

.quantity-selector button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.quantity-selector button:hover:not(:disabled) {
  background: var(--accent);
  color: var(--bg-primary);
}

.quantity-selector button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.quantity-selector span {
  min-width: 32px;
  text-align: center;
  font-weight: 700;
}

.item-remove {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.item-remove:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: rgba(255, 100, 100, 0.1);
}

.cart-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
}

.btn-clear {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-clear:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.cart__summary {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 2rem;
  position: sticky;
  top: 100px;
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.summary-header h3 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.item-count {
  font-size: 0.8rem;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 0.35rem 0.75rem;
  border-radius: 100px;
}

.summary-items {
  margin-bottom: 1.5rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.875rem 0;
  font-size: 0.9375rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.delivery-calc {
  color: var(--text-muted);
  font-style: italic;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 1.25rem 0;
  margin-bottom: 2rem;
}

.summary-total span:first-child {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
}

.total-value {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent);
}

.checkout-form h4 {
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: var(--text-secondary);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.btn-submit {
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  font-size: 1rem;
}

.success-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(163, 255, 18, 0.1);
  border: 1px solid rgba(163, 255, 18, 0.2);
  border-radius: 12px;
  color: var(--accent);
  font-size: 0.9rem;
  line-height: 1.5;
}

.success-message svg {
  flex-shrink: 0;
  margin-top: 2px;
}

@media (max-width: 1024px) {
  .cart__layout {
    grid-template-columns: 1fr;
  }

  .cart__summary {
    position: static;
  }

  .cart-header {
    display: none;
  }

  .cart-item {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .col-price,
  .col-quantity,
  .col-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .col-price::before { content: 'Цена:'; color: var(--text-muted); font-size: 0.8rem; }
  .col-total::before { content: 'Сумма:'; color: var(--text-muted); font-size: 0.8rem; }

  .col-remove {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .cart-item {
    position: relative;
    padding-right: 3rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .cart__hero {
    padding: 2rem 0;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .col-product {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-image {
    width: 56px;
    height: 56px;
  }

  .item-info h4 {
    font-size: 0.875rem;
  }

  .col-quantity {
    padding: 0.5rem 0;
  }

  .empty {
    padding: 2rem 0;
  }

  .empty-icon svg {
    width: 40px;
    height: 40px;
  }

  .empty h3 {
    font-size: 1.125rem;
  }

  .cart__summary {
    padding: 1.25rem;
  }

  .summary-header h3 {
    font-size: 1rem;
  }

  .summary-row {
    font-size: 0.875rem;
    padding: 0.75rem 0;
  }

  .total-value {
    font-size: 1.125rem;
  }

  .checkout-form h4 {
    font-size: 0.8rem;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group label {
    font-size: 0.7rem;
  }

  .btn-submit {
    padding: 0.875rem;
    font-size: 0.875rem;
    margin-top: 0.75rem;
  }
}
</style>