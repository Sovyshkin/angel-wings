<template>
  <div class="home">
    <section class="hero">
      <div class="hero__bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="grid-lines"></div>
      </div>
      <div class="hero__container">
        <div class="hero__badge">
          <span class="badge-dot"></span>
          Высокочистые пептиды
        </div>
        <h1 class="hero__title">
          Научный подход<br>
          <span class="accent">к здоровью</span>
        </h1>
        <p class="hero__desc">
          Пептидные комплексы нового поколения для комплексного восстановления 
          и оптимизации функций организма
        </p>
        <div class="hero__actions">
          <router-link to="/catalog" class="btn btn-primary">
            Перейти в каталог
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
          <a href="#features" class="btn btn-secondary">Узнать больше</a>
        </div>
        <div class="hero__stats">
          <div class="stat">
            <span class="stat-value">99.9%</span>
            <span class="stat-label">Чистота</span>
          </div>
          <div class="stat">
            <span class="stat-value">20+</span>
            <span class="stat-label">Продуктов</span>
          </div>
          <div class="stat">
            <span class="stat-value">24/7</span>
            <span class="stat-label">Поддержка</span>
          </div>
        </div>
      </div>
    </section>

    <section class="features" id="features" data-aos="fade-up" data-aos-offset="100">
      <div class="container">
        <div class="features__grid">
          <div class="feature-card" data-aos="fade-up" data-aos-delay="100">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
              </svg>
            </div>
            <h3>Лабораторная чистота</h3>
            <p>Каждый продукт проходит многоступенчатую очистку и тестирование</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.71 0 3.37.5 4.8 1.4"/>
                <circle cx="12" cy="12" r="9"/>
              </svg>
            </div>
            <h3>Доказанная эффективность</h3>
            <p>Пептиды с подтвержденной биологической активностью</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>Безопасность</h3>
            <p>Строгий контроль качества на каждом этапе производства</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3>Индивидуальный подход</h3>
            <p>Консультации специалистов для подбора оптимальной терапии</p>
          </div>
        </div>
      </div>
    </section>

    <section class="categories-preview" data-aos="fade-left" data-aos-offset="100">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Категории</h2>
          <router-link to="/catalog" class="view-all">
            Все категории
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>
        <div class="categories-grid">
          <router-link to="/catalog?category=longevitiya" class="category-card">
            <div class="category-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/>
              </svg>
            </div>
            <h3>Долголетие</h3>
            <span class="category-count">6 товаров</span>
          </router-link>
          <router-link to="/catalog?category=immunomodulyatory" class="category-card">
            <div class="category-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <h3>Иммуномодуляторы</h3>
            <span class="category-count">5 товаров</span>
          </router-link>
          <router-link to="/catalog?category=neiropeptide" class="category-card">
            <div class="category-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2H10a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/>
                <path d="M9 22h6"/>
              </svg>
            </div>
            <h3>Нейропептиды</h3>
            <span class="category-count">5 товаров</span>
          </router-link>
          <router-link to="/catalog?category=growth" class="category-card">
            <div class="category-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <h3>Факторы роста</h3>
            <span class="category-count">4 товаров</span>
          </router-link>
        </div>
      </div>
    </section>

    <section class="featured-products" data-aos="fade-right" data-aos-offset="100">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Популярные товары</h2>
          <router-link to="/catalog" class="view-all">
            Смотреть все
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>
        <div class="featured-grid">
          <router-link 
            v-for="product in featuredProducts" 
            :key="product.id" 
            :to="`/product/${product.id}`"
            class="featured-card"
          >
            <div class="featured-image">
              <img :src="product.image" :alt="product.title" @error="$event.target.style.display='none'">
            </div>
            <div class="featured-content">
              <span class="featured-category">{{ product.category[0] }}</span>
              <h3>{{ product.title }}</h3>
              <div class="featured-footer">
                <span class="featured-price">{{ product.price }} ₽</span>
                <span class="featured-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <section class="cta" data-aos="zoom-in" data-aos-offset="100">
      <div class="container">
        <div class="cta__inner">
          <div class="cta__content">
            <h2>Нужна консультация?</h2>
            <p>Наши специалисты помогут подобрать оптимальный комплекс пептидов для ваших целей</p>
            <button class="btn btn-primary">Связаться с нами</button>
          </div>
          <div class="cta__decoration">
            <div class="molecule">
              <div class="atom"></div>
              <div class="atom"></div>
              <div class="atom"></div>
              <div class="orbit"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="benefits" data-aos="fade-up" data-aos-offset="100">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Почему выбирают нас</h2>
        </div>
        <div class="benefits__grid">
          <div class="benefit-card benefit-card--accent">
            <div class="benefit-number">01</div>
            <h3>GMP-сертификация</h3>
            <p>Все производственные площадки имеют сертификаты GMP — гарантия качества на каждом этапе</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-number">02</div>
            <h3>Тройной контроль</h3>
            <p>HPLC, Mass-Spectrometry, Amino Acid Analysis — три независимых метода проверки каждой партии</p>
          </div>
          <div class="benefit-card benefit-card--dark">
            <div class="benefit-number">03</div>
            <h3>Быстрая доставка</h3>
            <p>Отправка в течение 24 часов. DHL, FedEx, EMS — доставка в 150+ стран мира</p>
          </div>
          <div class="benefit-card">
            <div class="benefit-number">04</div>
            <h3>Анонимность</h3>
            <p>Конфиденциальная упаковка без указания содержимого. Оплата криптовалютой</p>
          </div>
        </div>
      </div>
    </section>

    <section class="promo-banner" data-aos="fade-right" data-aos-offset="100">
      <div class="promo-bg">
        <div class="promo-orb promo-orb-1"></div>
        <div class="promo-orb promo-orb-2"></div>
        <div class="promo-orb promo-orb-3"></div>
      </div>
      <div class="container">
        <div class="promo-content">
          <div class="promo-badge">🔥 Новая коллекция 2026</div>
          <h2>Пептидные комплексы нового поколения</h2>
          <p>Обновленный каталог с 50+ новыми позициями. Скидки до 25% на популярные пептиды</p>
          <div class="promo-actions">
            <router-link to="/catalog" class="btn btn-accent">Смотреть каталог</router-link>
            <span class="promo-timer">До конца акции: 3д 14ч 22м</span>
          </div>
        </div>
      </div>
    </section>

    <section class="testimonials" data-aos="fade-left" data-aos-offset="100">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Отзывы клиентов</h2>
        </div>
        <div class="testimonials__grid">
          <div class="testimonial-card">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">"BPC-157令我印象非常深刻。伤口愈合速度明显加快，关节疼痛也在一周内消失。品质卓越！"</p>
            <div class="testimonial-author">
              <div class="author-avatar">A</div>
              <div class="author-info">
                <span class="author-name">Алексей М.</span>
                <span class="author-date">Март 2026</span>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">"Заказываю уже третий раз. Качество стабильно высокое, доставка быстрая. Специалисты помогли подобрать комплекс для сна."</p>
            <div class="testimonial-author">
              <div class="author-avatar">E</div>
              <div class="author-info">
                <span class="author-name">Елена К.</span>
                <span class="author-date">Февраль 2026</span>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <div class="testimonial-stars">★★★★★</div>
            <p class="testimonial-text">"TB-500 и BPC-157 комбинация — это что-то невероятное. Восстановился после травмы в два раза быстрее, чем ожидал."</p>
            <div class="testimonial-author">
              <div class="author-avatar">M</div>
              <div class="author-info">
                <span class="author-name">Михаил Д.</span>
                <span class="author-date">Январь 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="newsletter" data-aos="fade-up" data-aos-offset="100">
      <div class="container">
        <div class="newsletter__inner">
          <div class="newsletter__content">
            <h2>Подпишитесь на обновления</h2>
            <p>Получайте информацию о новинках, скидках и эксклюзивных предложениях первыми</p>
          </div>
          <form class="newsletter__form" @submit.prevent>
            <input type="email" placeholder="Ваш email" class="newsletter-input">
            <button type="submit" class="btn btn-accent">Подписаться</button>
          </form>
        </div>
      </div>
    </section>

    <section class="floating-elements" aria-hidden="true">
      <div class="float-shape float-shape-1"></div>
      <div class="float-shape float-shape-2"></div>
      <div class="float-shape float-shape-3"></div>
      <div class="float-shape float-shape-4"></div>
      <div class="float-shape float-shape-5"></div>
      <div class="float-shape float-shape-6"></div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProductStore } from '../store/products'

const productStore = useProductStore()

const featuredProducts = computed(() => {
  return productStore.products.slice(0, 4)
})
</script>

<style scoped>
.home {
  padding-bottom: 0;
}

.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 8rem 0;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  transition: background 0.4s ease;
}

.orb-1 {
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, var(--accent-dim) 0%, transparent 60%);
  top: -300px;
  left: -200px;
  animation: float 12s ease-in-out infinite;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(163, 255, 18, 0.1) 0%, transparent 60%);
  bottom: -200px;
  right: -100px;
  animation: float 15s ease-in-out infinite reverse;
}

[data-theme="light"] .orb-2 {
  background: radial-gradient(circle, rgba(90, 158, 0, 0.15) 0%, transparent 60%);
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: radial-gradient(ellipse 100% 80% at 50% 50%, black 0%, transparent 70%);
  transition: opacity 0.4s ease;
}

[data-theme="light"] .grid-lines {
  background-image: 
    linear-gradient(rgba(26, 26, 26, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(26, 26, 26, 0.03) 1px, transparent 1px);
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.hero__container {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent-dim);
  border: 1px solid var(--accent);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 2.5rem;
  animation: fadeIn 0.8s ease-out;
}

.badge-dot {
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--accent);
  animation: pulse 2s ease-in-out infinite;
}

.hero__title {
  font-family: var(--font-display);
  font-size: clamp(3.5rem, 10vw, 7rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  margin-bottom: 2rem;
  animation: slideUp 0.8s ease-out 0.1s both;
}

.accent {
  color: var(--accent);
  text-shadow: 0 0 80px rgba(163, 255, 18, 0.4);
}

.hero__desc {
  font-size: 1.25rem;
  line-height: 1.7;
  color: var(--text-secondary);
  max-width: 560px;
  margin-bottom: 3rem;
  animation: slideUp 0.8s ease-out 0.2s both;
}

.hero__actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 5rem;
  animation: slideUp 0.8s ease-out 0.3s both;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  font-size: 0.9375rem;
  font-weight: 700;
  border-radius: 14px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  letter-spacing: 0.02em;
}

.btn-primary {
  background: var(--accent);
  color: var(--bg-primary);
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(163, 255, 18, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-icon {
  transition: transform 0.3s ease;
}

.btn:hover .btn-icon {
  transform: translateX(5px);
}

.hero__stats {
  display: flex;
  gap: 4rem;
  animation: slideUp 0.8s ease-out 0.4s both;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 2.75rem;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.features {
  padding: 8rem 0;
}

.features__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.feature-card {
  padding: 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.feature-card:hover {
  border-color: rgba(163, 255, 18, 0.3);
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.feature-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  border-radius: 14px;
  color: var(--accent);
  margin-bottom: 1.5rem;
  transition: all 0.4s ease;
}

.feature-card:hover .feature-icon {
  background: var(--accent);
  color: var(--bg-primary);
  transform: rotate(-5deg) scale(1.1);
}

.feature-card h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.feature-card p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.categories-preview {
  padding: 4rem 0 8rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3rem;
}

.section-title {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 800;
}

.view-all {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent);
  transition: all 0.3s ease;
}

.view-all:hover {
  gap: 0.75rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.category-card {
  position: relative;
  padding: 2.5rem 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--accent), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.category-card:hover {
  border-color: rgba(163, 255, 18, 0.3);
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.category-card:hover::before {
  opacity: 1;
}

.category-icon {
  color: var(--accent);
  margin-bottom: 1.5rem;
  transition: transform 0.4s ease;
}

.category-card:hover .category-icon {
  transform: scale(1.1) rotate(-5deg);
}

.category-card h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.category-count {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.featured-products {
  padding: 0 0 8rem;
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.featured-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.featured-card:hover {
  border-color: rgba(163, 255, 18, 0.3);
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.featured-image {
  aspect-ratio: 4/3;
  overflow: hidden;
}

.featured-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.featured-card:hover .featured-image img {
  transform: scale(1.08);
}

.featured-content {
  padding: 1.25rem;
}

.featured-category {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}

.featured-content h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.featured-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.featured-price {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.featured-arrow {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 8px;
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.featured-card:hover .featured-arrow {
  background: var(--accent);
  color: var(--bg-primary);
}

.cta {
  padding: 4rem 0 8rem;
}

.cta__inner {
  position: relative;
  padding: 5rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 28px;
  overflow: hidden;
  transition: background 0.4s ease, border-color 0.4s ease;
}

.cta__inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
}

.cta__content {
  position: relative;
  z-index: 1;
  max-width: 500px;
}

.cta__content h2 {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.cta__content p {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

.cta__decoration {
  position: absolute;
  right: 5rem;
  top: 50%;
  transform: translateY(-50%);
}

.molecule {
  position: relative;
  width: 200px;
  height: 200px;
}

.atom {
  position: absolute;
  width: 24px;
  height: 24px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 30px var(--accent);
}

.atom:nth-child(1) { top: 50%; left: 50%; transform: translate(-50%, -50%); }
.atom:nth-child(2) { top: 10%; left: 50%; transform: translate(-50%, -50%); }
.atom:nth-child(3) { bottom: 10%; left: 50%; transform: translate(-50%, 50%); }

.orbit {
  position: absolute;
  inset: 10%;
  border: 2px dashed rgba(163, 255, 18, 0.2);
  border-radius: 50%;
  animation: spin 30s linear infinite;
  transition: border-color 0.4s ease;
}

[data-theme="light"] .orbit {
  border-color: rgba(90, 158, 0, 0.3);
}

[data-theme="light"] .cta__content p {
  color: var(--text-secondary);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.benefits {
  padding: 8rem 0;
}

.benefits__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.benefit-card {
  position: relative;
  padding: 2.5rem 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.benefit-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.benefit-card--accent {
  background: linear-gradient(135deg, var(--accent-dim), transparent);
  border-color: rgba(163, 255, 18, 0.2);
}

.benefit-card--dark {
  background: var(--bg-secondary);
}

.benefit-number {
  font-family: var(--font-mono);
  font-size: 3rem;
  font-weight: 800;
  color: var(--accent);
  opacity: 0.3;
  margin-bottom: 1rem;
}

.benefit-card h3 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.benefit-card p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.promo-banner {
  position: relative;
  padding: 6rem 0;
  margin: 4rem 0 8rem;
  overflow: hidden;
}

.promo-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent) 0%, #0a5c36 100%);
  z-index: 0;
}

.promo-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.promo-orb-1 {
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.3);
  top: -150px;
  right: -100px;
  animation: float 10s ease-in-out infinite;
}

.promo-orb-2 {
  width: 300px;
  height: 300px;
  background: rgba(163, 255, 18, 0.3);
  bottom: -100px;
  left: 10%;
  animation: float 12s ease-in-out infinite reverse;
}

.promo-orb-3 {
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.2);
  top: 50%;
  right: 30%;
  animation: float 8s ease-in-out infinite;
}

.promo-content {
  position: relative;
  z-index: 1;
  text-align: center;
  color: white;
}

.promo-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 2rem;
}

.promo-content h2 {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.promo-content p {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.promo-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.btn-accent {
  background: white;
  color: var(--accent);
}

.btn-accent:hover {
  background: var(--bg-primary);
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.promo-timer {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  opacity: 0.8;
}

.testimonials {
  padding: 8rem 0;
}

.testimonials__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.testimonial-card {
  padding: 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  transition: all 0.4s ease;
}

.testimonial-card:hover {
  border-color: rgba(163, 255, 18, 0.3);
  transform: translateY(-5px);
}

.testimonial-stars {
  color: #fab1a0;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.testimonial-text {
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  color: var(--accent);
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.9rem;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.author-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.newsletter {
  padding: 4rem 0 8rem;
}

.newsletter__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 28px;
}

.newsletter__content h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.newsletter__content p {
  color: var(--text-secondary);
}

.newsletter__form {
  display: flex;
  gap: 1rem;
}

.newsletter-input {
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 14px;
  font-size: 0.9rem;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.3s;
  min-width: 280px;
}

.newsletter-input:focus {
  border-color: var(--accent);
}

.newsletter-input::placeholder {
  color: var(--text-muted);
}

.floating-elements {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.float-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: floatRandom 20s ease-in-out infinite;
}

.float-shape-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, var(--accent), transparent);
  top: -200px;
  right: -150px;
  animation-delay: 0s;
}

.float-shape-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #fd79a8, transparent);
  bottom: 20%;
  left: -100px;
  animation-delay: -5s;
}

.float-shape-3 {
  width: 280px;
  height: 280px;
  background: linear-gradient(135deg, #74b9ff, transparent);
  top: 40%;
  right: 5%;
  animation-delay: -10s;
}

.float-shape-4 {
  width: 220px;
  height: 220px;
  background: linear-gradient(135deg, #fab1a0, transparent);
  bottom: -50px;
  right: 35%;
  animation-delay: -15s;
}

.float-shape-5 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #55efc4, transparent);
  top: 15%;
  left: 15%;
  animation-delay: -7s;
}

.float-shape-6 {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #a29bfe, transparent);
  top: 60%;
  left: 50%;
  animation-delay: -12s;
}

@keyframes floatRandom {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(40px, -40px) scale(1.1); }
  50% { transform: translate(-30px, 30px) scale(0.9); }
  75% { transform: translate(20px, 10px) scale(1.05); }
}

@media (max-width: 1280px) {
  .features__grid,
  .categories-grid,
  .featured-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .benefits__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .testimonials__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 4rem 0;
    min-height: auto;
  }

  .hero__container {
    padding: 0 1rem;
  }

  .hero__badge {
    padding: 0.5rem 1rem;
    font-size: 0.7rem;
    margin-bottom: 1.5rem;
  }

  .hero__title {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .hero__desc {
    font-size: 1rem;
    margin-bottom: 2rem;
  }

  .hero__stats {
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .stat-value {
    font-size: 2rem;
  }

  .hero__actions {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 3rem;
  }

.feature-card,
.category-card,
.featured-card,
.benefit-card,
.testimonial-card {
  opacity: 0;
  transform: translateY(30px);
}

.btn {
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
  }

  .features {
    padding: 4rem 0;
  }

  .features__grid,
  .categories-grid,
  .featured-grid,
  .benefits__grid,
  .testimonials__grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.75rem;
  }

  .feature-card {
    padding: 1.5rem;
  }

  .category-card {
    padding: 1.5rem 1rem;
  }

  .cta {
    padding: 3rem 0 4rem;
  }

  .cta__decoration {
    display: none;
  }

  .cta__inner {
    padding: 1.5rem;
  }

  .cta__content h2 {
    font-size: 1.5rem;
  }

  .cta__content p {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .benefits {
    padding: 4rem 0;
  }

  .benefit-card {
    padding: 1.5rem 1rem;
  }

  .promo-banner {
    padding: 3rem 0;
    margin: 2rem 0 4rem;
  }

  .promo-content h2 {
    font-size: 1.5rem;
  }

  .promo-content p {
    font-size: 1rem;
  }

  .promo-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .promo-timer {
    font-size: 0.8rem;
  }

  .testimonials {
    padding: 4rem 0;
  }

  .testimonial-card {
    padding: 1.5rem;
  }

  .newsletter {
    padding: 2rem 0 4rem;
  }

  .newsletter__inner {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .newsletter__content h2 {
    font-size: 1.5rem;
  }

  .newsletter__form {
    flex-direction: column;
    width: 100%;
  }

  .newsletter-input {
    min-width: auto;
    width: 100%;
  }
}

.feature-card,
.category-card,
.featured-card,
.benefit-card,
.testimonial-card {
  opacity: 0;
  transform: translateY(30px);
}

.animate-on-scroll.visible .feature-card,
.animate-on-scroll.visible .category-card,
.animate-on-scroll.visible .featured-card,
.animate-on-scroll.visible .benefit-card,
.animate-on-scroll.visible .testimonial-card {
  animation: fadeInUp 0.6s ease forwards;
}

.animate-on-scroll.visible .feature-card:nth-child(1),
.animate-on-scroll.visible .category-card:nth-child(1),
.animate-on-scroll.visible .featured-card:nth-child(1),
.animate-on-scroll.visible .benefit-card:nth-child(1),
.animate-on-scroll.visible .testimonial-card:nth-child(1) { animation-delay: 0.1s; }

.animate-on-scroll.visible .feature-card:nth-child(2),
.animate-on-scroll.visible .category-card:nth-child(2),
.animate-on-scroll.visible .featured-card:nth-child(2),
.animate-on-scroll.visible .benefit-card:nth-child(2),
.animate-on-scroll.visible .testimonial-card:nth-child(2) { animation-delay: 0.2s; }

.animate-on-scroll.visible .feature-card:nth-child(3),
.animate-on-scroll.visible .category-card:nth-child(3),
.animate-on-scroll.visible .featured-card:nth-child(3),
.animate-on-scroll.visible .benefit-card:nth-child(3),
.animate-on-scroll.visible .testimonial-card:nth-child(3) { animation-delay: 0.3s; }

.animate-on-scroll.visible .feature-card:nth-child(4),
.animate-on-scroll.visible .category-card:nth-child(4),
.animate-on-scroll.visible .featured-card:nth-child(4),
.animate-on-scroll.visible .benefit-card:nth-child(4),
.animate-on-scroll.visible .testimonial-card:nth-child(4) { animation-delay: 0.4s; }

.btn {
  position: relative;
  overflow: hidden;
}

.btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.btn:active::after {
  width: 300px;
  height: 300px;
}

.feature-card {
  cursor: pointer;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(163, 255, 18, 0.05), transparent);
  transition: left 0.5s ease;
}

.feature-card:hover::before {
  left: 100%;
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 0;
  background: var(--accent);
  transition: height 0.4s ease;
}

.category-card:hover::before {
  height: 100%;
}

@keyframes ripple {
  0% { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(4); opacity: 0; }
}

.add-to-cart-btn {
  position: relative;
  overflow: hidden;
}

.add-to-cart-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: var(--accent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.add-to-cart-btn:not(:disabled):hover::before {
  width: 60px;
  height: 60px;
}

.add-to-cart-btn svg {
  position: relative;
  z-index: 1;
}

.product-card {
  cursor: pointer;
}

.product-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--accent-dim), transparent);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.product-card:hover::after {
  opacity: 1;
}

.nav-link {
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent);
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.theme-toggle {
  position: relative;
  overflow: hidden;
}

.theme-toggle::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.theme-toggle:hover::after {
  opacity: 0.2;
}

.theme-toggle svg {
  position: relative;
  z-index: 1;
}

.cart-btn {
  position: relative;
  overflow: hidden;
}

.cart-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cart-btn:hover::after {
  opacity: 0.2;
}

.cart-btn .cart-icon {
  position: relative;
  z-index: 1;
}

@keyframes countBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

.cart-count {
  animation: countBounce 0.3s ease;
}
</style>