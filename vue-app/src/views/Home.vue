<template>
  <div ref="homeRoot" class="home">
    <div class="home-global-decor" aria-hidden="true">
      <img class="home-global-decor__item home-global-decor__item--molecule-1" src="/hero-assets/молекула-1-640.webp" alt="" width="640" height="427" loading="lazy" decoding="async" fetchpriority="low">
      <img class="home-global-decor__item home-global-decor__item--molecule-2" src="/hero-assets/молекула-2-640.webp" alt="" width="640" height="427" loading="lazy" decoding="async" fetchpriority="low">
      <img class="home-global-decor__item home-global-decor__item--molecule-3" src="/hero-assets/молекула-3-520.webp" alt="" width="520" height="780" loading="lazy" decoding="async" fetchpriority="low">
      <img class="home-global-decor__item home-global-decor__item--molecule-4" src="/hero-assets/молекула-1-640.webp" alt="" width="640" height="427" loading="lazy" decoding="async" fetchpriority="low">
      <img class="home-global-decor__item home-global-decor__item--molecule-5" src="/hero-assets/молекула-2-640.webp" alt="" width="640" height="427" loading="lazy" decoding="async" fetchpriority="low">
      <img class="home-global-decor__item home-global-decor__item--drop-1" src="/hero-assets/капелька-1-420.webp" alt="" width="420" height="384" loading="lazy" decoding="async" fetchpriority="low">
      <img class="home-global-decor__item home-global-decor__item--drop-2" src="/hero-assets/капелька-2-420.webp" alt="" width="420" height="385" loading="lazy" decoding="async" fetchpriority="low">
      <img class="home-global-decor__item home-global-decor__item--drop-3" src="/hero-assets/капелька-1-420.webp" alt="" width="420" height="384" loading="lazy" decoding="async" fetchpriority="low">
      <img class="home-global-decor__item home-global-decor__item--drop-4" src="/hero-assets/капелька-2-420.webp" alt="" width="420" height="385" loading="lazy" decoding="async" fetchpriority="low">
      <img class="home-global-decor__item home-global-decor__item--drop-5" src="/hero-assets/капелька-1-420.webp" alt="" width="420" height="384" loading="lazy" decoding="async" fetchpriority="low">
      <img class="home-global-decor__item home-global-decor__item--drop-6" src="/hero-assets/капелька-2-420.webp" alt="" width="420" height="385" loading="lazy" decoding="async" fetchpriority="low">
    </div>

    <section class="hero">
      <div class="hero__bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="grid-lines"></div>
      </div>
      <div class="hero__container">
        <div class="hero__content">
          <div class="hero__badge">
            <span class="badge-dot"></span>
            Высокочистые пептиды
          </div>
          <h1 class="hero__title">
            Единственный
            <br class="hero-title-mobile-break">
            производитель
            <br>
            пептидов с действующей
            <br>
            <span class="accent">
              фармацевтической
              <br class="hero-title-mobile-break">
              лицензией
            </span>
          </h1>
          <div class="hero__chips">
            <span class="hero-chip">in vitro only</span>
            <span class="hero-chip">Фармлицензия</span>
            <span class="hero-chip">Контроль партий</span>
          </div>
          <div class="hero__actions">
            <router-link to="/catalog" class="btn btn-primary">
              Перейти в каталог
              <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </router-link>
            <a href="#features" class="btn btn-secondary">Узнать больше</a>
            <a href="/pharmaceutical-license.pdf" class="btn btn-license" target="_blank" rel="noopener">
              Лицензия PDF
              <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M9 15h6M9 18h4"/>
              </svg>
            </a>
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

        <div ref="heroVisual" class="hero__visual" aria-hidden="true">
          <div class="hero-scene">
            <div class="hero-orbits">
              <img
                class="hero-orbit-image hero-orbit-image--back"
                src="/hero-assets/кольцо-1300.webp"
                alt=""
                width="1300"
                height="431"
                loading="eager"
                decoding="async"
                fetchpriority="high"
              >
            </div>

            <div class="hero-molecule hero-molecule--one">
              <img class="hero-molecule__image" src="/hero-assets/молекула-1-640.webp" alt="" width="640" height="427" loading="lazy" decoding="async" fetchpriority="low">
            </div>
            <div class="hero-molecule hero-molecule--two">
              <img class="hero-molecule__image" src="/hero-assets/молекула-2-640.webp" alt="" width="640" height="427" loading="lazy" decoding="async" fetchpriority="low">
            </div>
            <div class="hero-molecule hero-molecule--background">
              <img class="hero-molecule__image" src="/hero-assets/молекула-3-520.webp" alt="" width="520" height="780" loading="lazy" decoding="async" fetchpriority="low">
            </div>

            <div class="hero-sphere hero-sphere--top">
              <img class="hero-sphere__image" src="/hero-assets/капелька-1-420.webp" alt="" width="420" height="384" loading="lazy" decoding="async" fetchpriority="low">
            </div>
            <div class="hero-sphere hero-sphere--right">
              <img class="hero-sphere__image" src="/hero-assets/капелька-2-420.webp" alt="" width="420" height="385" loading="lazy" decoding="async" fetchpriority="low">
            </div>
            <div class="hero-sphere hero-sphere--orbit">
              <img class="hero-sphere__image" src="/hero-assets/капелька-1-420.webp" alt="" width="420" height="384" loading="lazy" decoding="async" fetchpriority="low">
            </div>
            <div class="hero-sphere hero-sphere--far-left">
              <img class="hero-sphere__image" src="/hero-assets/капелька-2-420.webp" alt="" width="420" height="385" loading="lazy" decoding="async" fetchpriority="low">
            </div>
            <div class="hero-sphere hero-sphere--far-right">
              <img class="hero-sphere__image" src="/hero-assets/капелька-2-420.webp" alt="" width="420" height="385" loading="lazy" decoding="async" fetchpriority="low">
            </div>

            <div class="hero-pen-wrap">
              <img
                class="hero-pen"
                src="/hero-assets/ручка-720.webp"
                alt=""
                width="720"
                height="1080"
                loading="eager"
                decoding="async"
                fetchpriority="high"
              >
            </div>

            <div class="hero-platform">
              <img
                src="/hero-assets/подставка.png"
                alt=""
                width="1672"
                height="941"
                loading="eager"
                decoding="async"
                fetchpriority="high"
              >
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features" id="features" data-aos="fade-up" data-aos-offset="100">
      <div class="section-decor section-decor--features" aria-hidden="true">
        <img class="section-decor__molecule section-decor__molecule--features-main" src="/hero-assets/молекула-1-640.webp" alt="" width="640" height="427" loading="lazy" decoding="async" fetchpriority="low">
        <img class="section-decor__molecule section-decor__molecule--features-soft" src="/hero-assets/молекула-3-520.webp" alt="" width="520" height="780" loading="lazy" decoding="async" fetchpriority="low">
        <img class="section-decor__drop section-decor__drop--features-top" src="/hero-assets/капелька-1-420.webp" alt="" width="420" height="384" loading="lazy" decoding="async" fetchpriority="low">
        <img class="section-decor__drop section-decor__drop--features-low" src="/hero-assets/капелька-2-420.webp" alt="" width="420" height="385" loading="lazy" decoding="async" fetchpriority="low">
      </div>
      <div class="container">
        <div class="features-panel" data-aos="fade-up" data-aos-delay="100">
          <article class="features-lead">
            <span class="features-kicker">Производственный контур Angel Wings</span>
            <h2>Фармацевтическая дисциплина на каждом этапе</h2>
            <p>
              Мы выстроили цикл от разработки до выпуска так, чтобы клиент получал прогнозируемое качество,
              а не случайный результат от партии к партии.
            </p>
            <a href="/pharmaceutical-license.pdf" class="features-license" target="_blank" rel="noopener">
              <span class="features-license__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </span>
              <span>
                Действующая фармацевтическая лицензия
                <small>Открыть документ PDF</small>
              </span>
            </a>
            <div class="features-metrics">
              <div class="features-metric">
                <strong>100%</strong>
                <span>собственное производство</span>
              </div>
              <div class="features-metric">
                <strong>20+</strong>
                <span>лет экспертизы в фарме</span>
              </div>
            </div>
          </article>

          <div class="features-cards">
            <article class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                </svg>
              </div>
              <h3>Свое производство</h3>
              <p>Единственные, кто производит 100% своих продуктов самостоятельно и ничего не перепродает.</p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.71 0 3.37.5 4.8 1.4"/>
                  <circle cx="12" cy="12" r="9"/>
                </svg>
              </div>
              <h3>Фармацевтическое качество</h3>
              <p>В основе процессов — стандарты фармкомпании с 20-летней экспертизой в разработке лекарств.</p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Генноинженерные продукты</h3>
              <p>Основные продукты создаются без химического синтеза и содержат минимальный уровень примесей.</p>
            </article>

            <article class="feature-card">
              <div class="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Уникальные разработки</h3>
              <p>Многие препараты не имеют прямых аналогов в мире и формируют отдельные продуктовые ниши.</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section ref="catalogPreview" class="categories-preview" data-aos="fade-left" data-aos-offset="100">
      <div class="section-decor section-decor--categories" aria-hidden="true">
        <img class="section-decor__molecule section-decor__molecule--categories-main" src="/hero-assets/молекула-2-640.webp" alt="" width="640" height="427" loading="lazy" decoding="async" fetchpriority="low">
        <img class="section-decor__molecule section-decor__molecule--categories-soft" src="/hero-assets/молекула-3-520.webp" alt="" width="520" height="780" loading="lazy" decoding="async" fetchpriority="low">
        <img class="section-decor__drop section-decor__drop--categories-top" src="/hero-assets/капелька-1-420.webp" alt="" width="420" height="384" loading="lazy" decoding="async" fetchpriority="low">
        <img class="section-decor__drop section-decor__drop--categories-mid" src="/hero-assets/капелька-2-420.webp" alt="" width="420" height="385" loading="lazy" decoding="async" fetchpriority="low">
        <img class="section-decor__drop section-decor__drop--categories-low" src="/hero-assets/капелька-1-420.webp" alt="" width="420" height="384" loading="lazy" decoding="async" fetchpriority="low">
      </div>
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <h2 class="section-title">Категории</h2>
          <router-link to="/catalog" class="view-all">
            Все категории
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>

        <div class="categories-lab" data-aos="fade-up" data-aos-delay="100">
          <aside class="categories-lab__panel">
            <span class="categories-lab__kicker">Навигатор ассортимента</span>
            <h3>Выберите направление и соберите свой протокол под задачу</h3>
            <p>
              Категории распределены по функциональным направлениям: восстановление, нейро-поддержка,
              иммунный баланс и регенерация.
            </p>
            <div class="categories-lab__metrics">
              <div class="categories-lab__metric"><strong>{{ totalProductsCount }}</strong><span>позиций</span></div>
              <div class="categories-lab__metric"><strong>{{ totalDirectionsCount }}</strong><span>направления</span></div>
              <div class="categories-lab__metric"><strong>100%</strong><span>in-house</span></div>
            </div>
            <router-link to="/catalog" class="categories-lab__cta">
              Открыть полный каталог
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </router-link>
          </aside>

          <div class="categories-lanes">
            <router-link to="/catalog?category=longevitiya" class="category-lane lane-longevity">
              <div class="category-lane__left">
                <span class="category-lane__icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"/>
                  </svg>
                </span>
                <div>
                  <h4>Долголетие</h4>
                  <p>Восстановление, устойчивый функциональный тонус и anti-age подход.</p>
                </div>
              </div>
              <div class="category-lane__right">
                <span class="category-lane__count">{{ getCategoryCount('longevitiya') }}</span>
                <span class="category-lane__meta">{{ getProductWord(getCategoryCount('longevitiya')) }}</span>
              </div>
            </router-link>

            <router-link to="/catalog?category=immunomodulyatory" class="category-lane lane-immune">
              <div class="category-lane__left">
                <span class="category-lane__icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </span>
                <div>
                  <h4>Иммуномодуляторы</h4>
                  <p>Поддержка иммунного ответа и адаптации к стрессовым факторам.</p>
                </div>
              </div>
              <div class="category-lane__right">
                <span class="category-lane__count">{{ getCategoryCount('immunomodulyatory') }}</span>
                <span class="category-lane__meta">{{ getProductWord(getCategoryCount('immunomodulyatory')) }}</span>
              </div>
            </router-link>

            <router-link to="/catalog?category=neiropeptide" class="category-lane lane-neuro">
              <div class="category-lane__left">
                <span class="category-lane__icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2H10a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/>
                    <path d="M9 22h6"/>
                  </svg>
                </span>
                <div>
                  <h4>Нейропептиды</h4>
                  <p>Когнитивные функции, ясность мышления и поддержка нервной системы.</p>
                </div>
              </div>
              <div class="category-lane__right">
                <span class="category-lane__count">{{ getCategoryCount('neiropeptide') }}</span>
                <span class="category-lane__meta">{{ getProductWord(getCategoryCount('neiropeptide')) }}</span>
              </div>
            </router-link>

            <router-link to="/catalog?category=growth" class="category-lane lane-growth">
              <div class="category-lane__left">
                <span class="category-lane__icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </span>
                <div>
                  <h4>Факторы роста</h4>
                  <p>Регенеративные механизмы и усиление восстановительных процессов.</p>
                </div>
              </div>
              <div class="category-lane__right">
                <span class="category-lane__count">{{ getCategoryCount('growth') }}</span>
                <span class="category-lane__meta">{{ getProductWord(getCategoryCount('growth')) }}</span>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="featured-products" data-aos="fade-right" data-aos-offset="100">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <h2 class="section-title">Популярные товары</h2>
          <router-link to="/catalog" class="view-all">
            Смотреть все
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>
        <div class="featured-grid" data-aos="fade-up" data-aos-delay="100">
          <router-link 
            v-for="product in featuredProducts" 
            :key="product.id" 
            :to="`/product/${product.id}`"
            class="featured-card"
          >
            <div class="featured-image">
              <img
                :src="product.image"
                :alt="product.title"
                width="480"
                height="480"
                loading="lazy"
                decoding="async"
                @error="handleImageError"
              >
            </div>
            <div class="featured-content">
              <div class="featured-meta">
                <span class="featured-category">{{ product.categories?.[0]?.name || product.categories?.[0]?.slug }}</span>
                <span v-if="isLowStock(product)" class="featured-low-stock">Меньше 10 осталось</span>
              </div>
              <h3>{{ product.title }}</h3>
              <div class="featured-footer">
                <div class="featured-price-block">
                  <span class="featured-price">{{ formatPrice(product.price) }} ₽</span>
                  <div v-if="getOldPrice(product)" class="featured-discount-row">
                    <span class="featured-old-price">{{ formatPrice(getOldPrice(product)) }} ₽</span>
                    <span class="featured-discount-badge">-{{ getDiscountPercent(product) }}%</span>
                  </div>
                </div>
                <button
                  v-if="getFeaturedCartQty(product.id) === 0"
                  class="featured-add-btn"
                  type="button"
                  aria-label="Добавить в корзину"
                  @click.stop.prevent="increaseFeaturedQty(product)"
                  :disabled="!product.stock"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </button>
                <div v-else class="featured-qty-control" @click.stop.prevent>
                  <button
                    class="featured-qty-btn"
                    type="button"
                    aria-label="Уменьшить"
                    @click.stop.prevent="decreaseFeaturedQty(product)"
                    :disabled="getFeaturedCartQty(product.id) <= 0"
                  >
                    −
                  </button>
                  <span class="featured-qty-value">{{ getFeaturedCartQty(product.id) }}</span>
                  <button
                    class="featured-qty-btn"
                    type="button"
                    aria-label="Увеличить"
                    @click.stop.prevent="increaseFeaturedQty(product)"
                    :disabled="!product.stock || getFeaturedCartQty(product.id) >= product.stock"
                  >
                    +
                  </button>
                </div>
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
            <router-link to="/contact" class="btn btn-primary">Связаться с нами</router-link>
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
        <div class="section-header" data-aos="fade-up">
          <h2 class="section-title">Почему выбирают нас</h2>
        </div>
        <div class="benefits__timeline" data-aos="fade-up" data-aos-delay="100">
          <div class="timeline-item">
            <div class="timeline-index">01</div>
            <div class="timeline-content">
              <h3>GMP-сертификация</h3>
              <p>Все производственные площадки имеют сертификаты GMP — гарантия качества на каждом этапе.</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-index">02</div>
            <div class="timeline-content">
              <h3>Тройной контроль</h3>
              <p>HPLC, Mass-Spectrometry, Amino Acid Analysis — три независимых метода проверки каждой партии.</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-index">03</div>
            <div class="timeline-content">
              <h3>Быстрая доставка</h3>
              <p>Отправка в течение 24 часов. DHL, FedEx, EMS — доставка в 150+ стран мира.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="partnership-teaser" data-aos="fade-up" data-aos-offset="100">
      <div class="container">
        <div class="partnership-teaser__inner">
          <div class="partnership-teaser__copy">
            <span class="partnership-teaser__kicker">Партнёрская программа</span>
            <h2>Станьте партнёром Angel Wings</h2>
            <p>
              Оставьте заявку, и после одобрения мы подключим партнёрский кабинет,
              персональный реферальный код и прозрачную статистику начислений.
            </p>
          </div>
          <div class="partnership-teaser__stats" aria-label="Возможности партнёрской программы">
            <div>
              <strong>Код</strong>
              <span>Реферальная привязка клиентов</span>
            </div>
            <div>
              <strong>%</strong>
              <span>Комиссия по заказам</span>
            </div>
            <div>
              <strong>ЛК</strong>
              <span>Баланс, баллы и статистика</span>
            </div>
          </div>
          <router-link to="/partnership" class="btn btn-primary partnership-teaser__button">
            Оставить заявку
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </router-link>
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
          <div class="promo-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4z"/>
            </svg>
            Персональная консультация
          </div>
          <h2>Подберем пептидный комплекс под задачу</h2>
          <p>Поможем сориентироваться в каталоге и выбрать продукты под исследовательский протокол</p>
          <div class="promo-actions">
            <a href="https://t.me/Seraphim_angelwings" target="_blank" rel="noopener noreferrer" class="btn btn-accent">
              Получить консультацию
            </a>
            <router-link to="/catalog" class="promo-link">Открыть каталог</router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="home-faq" data-aos="fade-up" data-aos-offset="100">
      <div class="container">
        <div id="faq" class="home-faq__layout">
          <div class="home-faq__intro">
            <span class="home-faq__kicker">FAQ</span>
            <h2>Частые вопросы по ручкам и хранению</h2>
            <p>
              Собрали самые частые ситуации после получения заказа: единицы на барабане,
              холостой ход, хранение и доставка.
            </p>
            <a href="https://t.me/Seraphim_angelwings" target="_blank" rel="noopener noreferrer" class="home-faq__manager">
              Написать менеджеру
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          <div class="home-faq__list">
            <details class="home-faq__item" open>
              <summary>
                <span>Как рассчитать щелчки и единицы?</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <div class="home-faq__answer">
                <p>Каждая ручка рассчитана на 300 единиц. Чтобы понять, сколько вещества в одной единице, общий объем делится на 300.</p>
                <p><strong>Пример:</strong> Мотс 50 мг: 50 мг / 300 ед = 0,166 мг в одной единице. Если нужно набрать 1,5 мг: 1,5 / 0,166 = 9 единиц ручки.</p>
                <p>Информация о единицах также указана на этикетке.</p>
              </div>
            </details>

            <details class="home-faq__item">
              <summary>
                <span>Что такое холостой ход?</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <div class="home-faq__answer">
                <p>В начале у ручки может быть холостой ход. Перед накручиванием иглы отверните ручку примерно на 50 ед. и нажмите: вы почувствуете момент, когда ручка упрется и не будет нажиматься.</p>
                <p>После этого закрутите ручку обратно. Теперь ручка будет выдавливать жидкость.</p>
              </div>
            </details>

            <details class="home-faq__item">
              <summary>
                <span>Ручка прокручивается и не выдавливает жидкость</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <div class="home-faq__answer">
                <p>Снимите ситуацию на видео и отправьте менеджеру: вам вышлют ручку за наш счет и подскажут, как переставить картридж в новую ручку.</p>
                <p>
                  Чтобы не ждать замену, можно заранее
                  <router-link to="/product/151">приобрести многоразовую ручку</router-link>
                  и использовать ее в подобных ситуациях.
                </p>
              </div>
            </details>

            <details class="home-faq__item">
              <summary>
                <span>Пептид доедет до меня в сохранности?</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <div class="home-faq__answer">
                <p>Пептиды отправляются в термопакетах с хладоэлементом. Этого достаточно для доставки.</p>
                <p>Стабильный раствор прозрачный, без сгустков и мутности. Если пептид пришел мутным, отправьте фото или видео менеджеру.</p>
              </div>
            </details>

            <details class="home-faq__item">
              <summary>
                <span>Почему внутри нет инструкции?</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <div class="home-faq__answer">
                <p>Инструкции внутри упаковки не вкладываются. Если нужна помощь по ручке, единицам или хранению, напишите менеджеру.</p>
              </div>
            </details>

            <details class="home-faq__item">
              <summary>
                <span>Я улетаю, пептид не испортится?</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <div class="home-faq__answer">
                <p>Для надежности можно перевозить пептиды в термопеналах. 1-2 дня при комнатной температуре обычно не критичны.</p>
              </div>
            </details>

            <details class="home-faq__item">
              <summary>
                <span>Как хранить ручку?</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <div class="home-faq__answer">
                <p>Храните ручку в холодильнике.</p>
              </div>
            </details>

            <details class="home-faq__item">
              <summary>
                <span>Какой срок годности?</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </summary>
              <div class="home-faq__answer">
                <p>Срок годности — 2 года при хранении в холодильнике.</p>
              </div>
            </details>
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useProductStore } from '../store/products'
import { useCartStore } from '../store/cart'
import { trackProductEvent } from '../api/analytics'

const productStore = useProductStore()
const cartStore = useCartStore()
const DISPLAY_CATEGORY_SLUGS = ['longevitiya', 'immunomodulyatory', 'neiropeptide', 'growth']
const homeRoot = ref(null)
const catalogPreview = ref(null)
const heroVisual = ref(null)
let catalogObserver = null
let catalogFallbackTimer = null
let catalogLoaded = false
let heroScrollFrame = null
let heroScrollProgress = '0'
let heroScrollIdleTimer = null
let heroScrollActive = false
let lastHeroScrollProgress = -1

const featuredProducts = computed(() => {
  return productStore.products.slice(0, 4)
})

const totalProductsCount = computed(() => productStore.totalProducts || productStore.products.length)

const categoryProductCountMap = computed(() => {
  const counts = Object.create(null)
  for (const slug of DISPLAY_CATEGORY_SLUGS) counts[slug] = 0

  for (const category of productStore.categories) {
    const slug = String(category?.slug || '').trim()
    if (counts[slug] !== undefined) {
      counts[slug] = Math.max(0, Number(category?.count || 0))
    }
  }

  return counts
})

const totalDirectionsCount = computed(() => {
  return DISPLAY_CATEGORY_SLUGS.filter((slug) => getCategoryCount(slug) > 0).length
})

async function loadCatalogPreview() {
  if (catalogLoaded) return
  catalogLoaded = true
  catalogObserver?.disconnect()
  if (catalogFallbackTimer) window.clearTimeout(catalogFallbackTimer)

  await Promise.all([
    productStore.fetchProducts('', { limit: 4 }),
    productStore.fetchCategories()
  ])
}

onMounted(() => {
  updateHeroScrollProgress()
  window.addEventListener('scroll', queueHeroScrollProgress, { passive: true })
  window.addEventListener('resize', queueHeroScrollProgress, { passive: true })

  if ('IntersectionObserver' in window && catalogPreview.value) {
    catalogObserver = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) loadCatalogPreview()
    }, { rootMargin: '600px 0px' })
    catalogObserver.observe(catalogPreview.value)
    return
  }

  catalogFallbackTimer = window.setTimeout(loadCatalogPreview, 1500)
})

onBeforeUnmount(() => {
  catalogObserver?.disconnect()
  if (catalogFallbackTimer) window.clearTimeout(catalogFallbackTimer)
  if (heroScrollFrame) window.cancelAnimationFrame(heroScrollFrame)
  if (heroScrollIdleTimer) window.clearTimeout(heroScrollIdleTimer)
  heroScrollActive = false
  window.removeEventListener('scroll', queueHeroScrollProgress)
  window.removeEventListener('resize', queueHeroScrollProgress)
})

function handleImageError(e) {
  const img = e.target
  if (img.dataset.fallbackApplied === 'true') return
  img.dataset.fallbackApplied = 'true'
  img.src = '/logo-192.webp'
}

function normalizePrice(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function formatPrice(value) {
  return normalizePrice(value).toLocaleString('ru-RU')
}

function getOldPrice(product) {
  const current = normalizePrice(product?.price)
  const old = normalizePrice(product?.comparePrice)
  if (!old || old <= current) return null
  return old
}

function getDiscountPercent(product) {
  const current = normalizePrice(product?.price)
  const old = getOldPrice(product)
  if (!old || old <= 0 || current <= 0 || old <= current) return 0
  return Math.round(((old - current) / old) * 100)
}

function isLowStock(product) {
  const stock = Number(product?.stock || 0)
  return stock > 0 && stock < 10
}

function getFeaturedBaseCartItem(productId) {
  return cartStore.items.find(item => item.id === productId && !item.selectedDosage)
}

function getFeaturedCartQty(productId) {
  const baseItem = getFeaturedBaseCartItem(productId)
  return Math.max(0, Number(baseItem?.quantity || 0))
}

function increaseFeaturedQty(product) {
  const qty = getFeaturedCartQty(product.id)
  const maxStock = Math.max(0, Number(product?.stock || 0))
  if (maxStock > 0 && qty >= maxStock) return
  cartStore.addItem({
    ...product,
    selectedDosage: null
  })
  trackProductEvent(product.id, 'add_to_cart', { source: 'home_featured', quantity: 1 })
}

function decreaseFeaturedQty(product) {
  const baseItem = getFeaturedBaseCartItem(product.id)
  if (!baseItem) return
  if (baseItem.quantity <= 1) {
    cartStore.removeItem(product.id, null)
    return
  }
  cartStore.updateQuantity(product.id, baseItem.quantity - 1, null)
}

function getCategoryCount(slug) {
  return categoryProductCountMap.value[slug] || 0
}

function getProductWord(count) {
  const value = Math.abs(Number(count) || 0)
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return 'товар'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара'
  return 'товаров'
}

function updateHeroScrollProgress() {
  heroScrollFrame = null
  if (!heroVisual.value || document.hidden) return

  const hero = heroVisual.value.closest('.hero')
  if (!hero) return

  const rect = hero.getBoundingClientRect()
  if (rect.bottom < 0 && heroScrollProgress === '1.00') return
  if (rect.top > window.innerHeight && heroScrollProgress === '0.00') return

  const range = Math.max(1, rect.height * 0.82)
  const progress = Math.min(1, Math.max(0, -rect.top / range))
  const roundedProgress = Math.round(progress * 1000) / 1000

  if (Math.abs(roundedProgress - lastHeroScrollProgress) < 0.002) return
  lastHeroScrollProgress = roundedProgress

  const next = roundedProgress.toFixed(3)

  if (next === heroScrollProgress) return
  heroScrollProgress = next
  heroVisual.value.style.setProperty('--hero-scroll-progress', next)
}

function queueHeroScrollProgress() {
  if (!heroScrollActive) {
    heroScrollActive = true
    heroVisual.value?.classList.add('is-scroll-active')
    homeRoot.value?.classList.add('is-scroll-active')
  }

  if (heroScrollIdleTimer) window.clearTimeout(heroScrollIdleTimer)
  heroScrollIdleTimer = window.setTimeout(() => {
    heroScrollActive = false
    heroVisual.value?.classList.remove('is-scroll-active')
    homeRoot.value?.classList.remove('is-scroll-active')
  }, 320)

  if (heroScrollFrame) return
  heroScrollFrame = window.requestAnimationFrame(updateHeroScrollProgress)
}

</script>

<style scoped>
@property --hero-land-y {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@property --hero-land-opacity {
  syntax: '<number>';
  inherits: false;
  initial-value: 1;
}

@property --hero-pen-enter-y {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@property --hero-platform-enter-x {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@property --hero-orbit-enter-scale {
  syntax: '<number>';
  inherits: false;
  initial-value: 1;
}

@property --hero-scene-enter-opacity {
  syntax: '<number>';
  inherits: false;
  initial-value: 1;
}

@property --hero-idle-x {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@property --hero-idle-y {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@property --hero-idle-rotate {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.home {
  position: relative;
  padding-bottom: 0;
  overflow-x: hidden;
  isolation: isolate;
  background:
    radial-gradient(circle at 14% 10%, rgba(42, 107, 255, 0.08), transparent 26%),
    radial-gradient(circle at 88% 28%, rgba(54, 141, 255, 0.1), transparent 24%),
    radial-gradient(circle at 18% 56%, rgba(166, 185, 248, 0.06), transparent 24%),
    radial-gradient(circle at 78% 76%, rgba(36, 109, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #07080e 0%, #080910 28%, #07080e 58%, #090a12 100%);
}

.home > section {
  position: relative;
  z-index: 1;
}

.home-global-decor {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
}

.home-global-decor::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.012) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.012) 1px, transparent 1px);
  background-size: 96px 96px;
  mask-image: linear-gradient(180deg, transparent 0%, black 7%, black 94%, transparent 100%);
}

.home-global-decor__item {
  position: absolute;
  display: block;
  height: auto;
  object-fit: contain;
  mix-blend-mode: screen;
  pointer-events: none;
  user-select: none;
}

.home-global-decor__item--molecule-1 {
  width: clamp(150px, 12vw, 240px);
  right: -4%;
  top: 18%;
  opacity: 0.22;
  filter: saturate(0.96) blur(5px) drop-shadow(0 0 14px rgba(44, 133, 255, 0.14));
}

.home-global-decor__item--molecule-2 {
  width: clamp(170px, 14vw, 280px);
  left: -5%;
  top: 33%;
  opacity: 0.18;
  filter: saturate(0.9) blur(8px) drop-shadow(0 0 14px rgba(44, 133, 255, 0.12));
  animation-duration: 18s;
  animation-delay: -6s;
}

.home-global-decor__item--molecule-3 {
  width: clamp(120px, 10vw, 200px);
  right: 13%;
  top: 47%;
  opacity: 0.26;
  filter: saturate(1.05) blur(2px) drop-shadow(0 0 16px rgba(44, 133, 255, 0.16));
  animation-duration: 13s;
  animation-delay: -3s;
}

.home-global-decor__item--molecule-4 {
  width: clamp(150px, 13vw, 260px);
  left: 8%;
  top: 68%;
  opacity: 0.16;
  filter: saturate(0.88) blur(9px) drop-shadow(0 0 12px rgba(44, 133, 255, 0.1));
  animation-duration: 20s;
  animation-delay: -10s;
}

.home-global-decor__item--molecule-5 {
  width: clamp(150px, 12vw, 245px);
  right: -3%;
  top: 84%;
  opacity: 0.2;
  filter: saturate(0.98) blur(5px) drop-shadow(0 0 14px rgba(44, 133, 255, 0.12));
  animation-duration: 17s;
  animation-delay: -8s;
}

.home-global-decor__item--drop-1 {
  width: clamp(48px, 4vw, 82px);
  left: 44%;
  top: 22%;
  opacity: 0.28;
  filter: saturate(1.05) blur(1px) drop-shadow(0 0 16px rgba(78, 159, 255, 0.16));
  animation-duration: 12s;
  animation-delay: -2s;
}

.home-global-decor__item--drop-2 {
  width: clamp(80px, 7vw, 140px);
  right: 18%;
  top: 38%;
  opacity: 0.15;
  filter: saturate(0.82) blur(12px) drop-shadow(0 0 10px rgba(78, 159, 255, 0.08));
  animation-duration: 19s;
  animation-delay: -7s;
}

.home-global-decor__item--drop-3 {
  width: clamp(52px, 4.5vw, 88px);
  left: 16%;
  top: 50%;
  opacity: 0.2;
  filter: saturate(0.95) blur(4px) drop-shadow(0 0 12px rgba(78, 159, 255, 0.1));
  animation-duration: 14s;
  animation-delay: -5s;
}

.home-global-decor__item--drop-4 {
  width: clamp(100px, 8vw, 160px);
  right: 5%;
  top: 61%;
  opacity: 0.16;
  filter: saturate(0.88) blur(10px) drop-shadow(0 0 10px rgba(78, 159, 255, 0.08));
  animation-duration: 21s;
  animation-delay: -11s;
}

.home-global-decor__item--drop-5 {
  width: clamp(48px, 4vw, 78px);
  left: 55%;
  top: 76%;
  opacity: 0.22;
  filter: saturate(1) blur(2px) drop-shadow(0 0 12px rgba(78, 159, 255, 0.12));
  animation-duration: 13s;
  animation-delay: -4s;
}

.home-global-decor__item--drop-6 {
  width: clamp(88px, 7vw, 145px);
  left: -3%;
  top: 90%;
  opacity: 0.14;
  filter: saturate(0.8) blur(13px) drop-shadow(0 0 10px rgba(78, 159, 255, 0.08));
  animation-duration: 22s;
  animation-delay: -12s;
}

@keyframes pageDecorDrift {
  0% { translate: 0 0; rotate: -1deg; }
  100% { translate: 12px -18px; rotate: 2deg; }
}

[data-theme="light"] .home {
  background:
    radial-gradient(circle at 12% 9%, rgba(120, 153, 247, 0.2), transparent 28%),
    radial-gradient(circle at 88% 26%, rgba(66, 149, 255, 0.16), transparent 25%),
    radial-gradient(circle at 20% 58%, rgba(120, 153, 247, 0.12), transparent 25%),
    radial-gradient(circle at 80% 80%, rgba(66, 149, 255, 0.13), transparent 28%),
    linear-gradient(180deg, #f8f9ff 0%, #eef3ff 30%, #f7f9ff 62%, #ffffff 100%);
}

[data-theme="light"] .home-global-decor::before {
  background-image:
    linear-gradient(rgba(31, 55, 110, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31, 55, 110, 0.04) 1px, transparent 1px);
  opacity: 0.62;
}

[data-theme="light"] .home-global-decor__item {
  mix-blend-mode: multiply;
}

[data-theme="light"] .home-global-decor__item--molecule-1,
[data-theme="light"] .home-global-decor__item--molecule-3,
[data-theme="light"] .home-global-decor__item--molecule-5 {
  opacity: 0.1;
  filter: saturate(0.85) blur(4px);
}

[data-theme="light"] .home-global-decor__item--molecule-2,
[data-theme="light"] .home-global-decor__item--molecule-4 {
  opacity: 0.08;
  filter: saturate(0.75) blur(9px);
}

[data-theme="light"] .home-global-decor__item--drop-1,
[data-theme="light"] .home-global-decor__item--drop-3,
[data-theme="light"] .home-global-decor__item--drop-5 {
  opacity: 0.12;
  filter: saturate(0.9) blur(2px);
}

[data-theme="light"] .home-global-decor__item--drop-2,
[data-theme="light"] .home-global-decor__item--drop-4,
[data-theme="light"] .home-global-decor__item--drop-6 {
  opacity: 0.08;
  filter: saturate(0.75) blur(12px);
}

.hero {
  position: relative;
  min-height: calc(100svh - 76px);
  display: flex;
  align-items: center;
  padding: clamp(3.75rem, 6vh, 5.75rem) 0 clamp(2rem, 4vh, 3rem);
  overflow: hidden;
}

.hero,
.hero * {
  box-sizing: border-box;
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
  background: radial-gradient(circle, rgba(166, 185, 248, 0.1) 0%, transparent 60%);
  bottom: -200px;
  right: -100px;
  animation: float 15s ease-in-out infinite reverse;
}

[data-theme="light"] .orb-2 {
  background: radial-gradient(circle, rgba(166, 185, 248, 0.15) 0%, transparent 60%);
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
  max-width: 1580px;
  margin: 0 auto;
  padding: 0 clamp(2rem, 3.5vw, 4rem);
  width: 100%;
  min-height: clamp(640px, calc(100svh - 120px), 820px);
  display: block;
}

.hero__container::before {
  content: '';
  position: absolute;
  top: -8%;
  bottom: -8%;
  left: calc((100vw - 100%) / -2);
  right: calc((100vw - 100%) / -2);
  z-index: 5;
  pointer-events: none;
  background:
    linear-gradient(
      90deg,
      rgba(7, 8, 14, 0.98) 0%,
      rgba(7, 8, 14, 0.94) 24%,
      rgba(7, 8, 14, 0.7) 42%,
      rgba(7, 8, 14, 0.18) 60%,
      rgba(7, 8, 14, 0) 76%
    );
}

[data-theme="light"] .hero__container::before {
  background:
    linear-gradient(
      90deg,
      rgba(248, 249, 255, 0.96) 0%,
      rgba(248, 249, 255, 0.88) 28%,
      rgba(248, 249, 255, 0.56) 46%,
      rgba(248, 249, 255, 0.18) 64%,
      rgba(248, 249, 255, 0) 80%
    );
}

.hero__content {
  position: relative;
  z-index: 10;
  min-width: 0;
  width: min(48vw, 760px);
  max-width: 760px;
  padding-top: clamp(3.25rem, 8vh, 6.5rem);
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
  font-size: clamp(2.55rem, 2.65vw, 3.25rem);
  font-weight: 800;
  line-height: 1.14;
  letter-spacing: 0;
  max-width: 760px;
  overflow-wrap: break-word;
  margin-bottom: 1.75rem;
  animation: slideUp 0.8s ease-out 0.1s both;
}

.accent {
  color: var(--accent);
  text-shadow: 0 0 80px rgba(166, 185, 248, 0.4);
}

.hero-title-break {
  display: none;
}

.hero-title-mobile-break {
  display: none;
}

.hero__desc {
  font-size: clamp(1.05rem, 1.5vw, 1.32rem);
  line-height: 1.65;
  color: var(--text-secondary);
  max-width: 720px;
  margin-bottom: 1.5rem;
  animation: slideUp 0.8s ease-out 0.2s both;
}

.hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 2.25rem;
  animation: slideUp 0.8s ease-out 0.25s both;
}

.hero-chip {
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: linear-gradient(135deg, var(--bg-card), transparent);
  color: var(--text-secondary);
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
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
  box-shadow: 0 15px 40px rgba(166, 185, 248, 0.3);
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

.btn-license {
  background: rgba(166, 185, 248, 0.1);
  color: var(--accent);
  border: 1px solid rgba(166, 185, 248, 0.28);
}

.btn-license:hover {
  background: rgba(166, 185, 248, 0.16);
  border-color: rgba(166, 185, 248, 0.46);
  transform: translateY(-3px);
}

.btn-icon {
  transition: transform 0.3s ease;
}

.btn:hover .btn-icon {
  transform: translateX(5px);
}

.hero__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1.25rem, 2.6vw, 3rem);
  max-width: 560px;
  animation: slideUp 0.8s ease-out 0.4s both;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-width: 0;
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
  white-space: nowrap;
}

.hero__visual {
  --hero-parallax-x: 0;
  --hero-parallax-y: 0;
  --hero-scroll-progress: 0;
  position: absolute;
  z-index: 2;
  top: 0;
  right: 0;
  width: 68%;
  height: 100%;
  max-width: none;
  min-height: 100%;
  transform-style: preserve-3d;
  perspective: 1200px;
  isolation: isolate;
  pointer-events: none;
  contain: layout;
}

.hero__visual::before {
  content: '';
  position: absolute;
  inset: 4% 0 1% 6%;
  background:
    radial-gradient(circle at 53% 45%, rgba(27, 107, 255, 0.2), transparent 30%),
    radial-gradient(circle at 51% 82%, rgba(30, 144, 255, 0.24), transparent 24%),
    radial-gradient(circle at 75% 27%, rgba(166, 185, 248, 0.1), transparent 20%);
  filter: blur(4px);
  opacity: 0.95;
  transform: translate3d(
    calc(var(--hero-parallax-x) * -14px),
    calc(var(--hero-parallax-y) * -12px),
    0
  );
}

[data-theme="light"] .hero__visual::before {
  background:
    radial-gradient(circle at 53% 45%, rgba(46, 119, 255, 0.12), transparent 30%),
    radial-gradient(circle at 51% 82%, rgba(45, 139, 255, 0.14), transparent 24%),
    radial-gradient(circle at 74% 30%, rgba(138, 166, 255, 0.14), transparent 32%);
  opacity: 0.82;
}

.hero-scene {
  position: absolute;
  right: 2%;
  top: 50%;
  width: min(100%, 1050px);
  height: min(100%, 760px);
  transform: translateY(-50%);
  transform-style: preserve-3d;
  pointer-events: none;
  user-select: none;
  contain: layout;
}

.hero-orbits {
  --hero-orbit-enter-scale: 1;
  --hero-scene-enter-opacity: 1;
  position: absolute;
  inset: 8% 0 12%;
  transform:
    translate3d(
      calc(var(--hero-parallax-x) * 18px),
      calc(var(--hero-parallax-y) * 12px),
      0
    )
    rotateX(58deg)
    rotateZ(-13deg);
  transform-style: preserve-3d;
}

.hero-orbit {
  position: absolute;
  left: 7%;
  top: 30%;
  width: 86%;
  height: 35%;
  border: 1px solid rgba(82, 165, 255, 0.32);
  border-radius: 50%;
  box-shadow:
    0 0 30px rgba(40, 132, 255, 0.18),
    inset 0 0 24px rgba(166, 185, 248, 0.08);
  animation: orbitDrift 18s linear infinite;
}

.hero-orbit::before,
.hero-orbit::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #65c8ff;
  box-shadow: 0 0 18px #45a7ff, 0 0 34px rgba(166, 185, 248, 0.65);
}

.hero-orbit::before {
  left: 6%;
  top: 47%;
}

.hero-orbit::after {
  right: 4%;
  top: 42%;
}

.hero-orbit--two {
  left: 12%;
  top: 38%;
  width: 80%;
  height: 28%;
  transform: rotateZ(20deg);
  border-color: rgba(166, 185, 248, 0.22);
  animation-duration: 24s;
  animation-direction: reverse;
}

.hero-orbit--three {
  left: 20%;
  top: 47%;
  width: 68%;
  height: 22%;
  transform: rotateZ(-22deg);
  opacity: 0.7;
  animation-duration: 31s;
}

.hero-platform {
  position: absolute;
  left: 15%;
  right: 7%;
  bottom: 5%;
  height: 25%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse at center, rgba(48, 151, 255, 0.34) 0%, rgba(24, 92, 202, 0.15) 32%, rgba(2, 11, 31, 0.62) 63%, transparent 74%),
    linear-gradient(180deg, rgba(48, 151, 255, 0.2), rgba(1, 11, 27, 0.02));
  box-shadow:
    0 0 44px rgba(36, 135, 255, 0.34),
    0 28px 80px rgba(0, 0, 0, 0.7);
  transform:
    translate3d(
      calc(var(--hero-parallax-x) * -10px),
      calc(var(--hero-parallax-y) * -6px),
      0
    )
    rotateX(66deg);
  transform-origin: center;
}

.hero-platform::before {
  content: '';
  position: absolute;
  inset: 12% 8%;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(77, 178, 255, 0.7), rgba(30, 111, 255, 0.13) 24%, transparent 56%);
  filter: blur(3px);
  animation: platformPulse 4.8s ease-in-out infinite;
}

.platform-ring {
  position: absolute;
  inset: 8%;
  border: 1px solid rgba(91, 180, 255, 0.72);
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(52, 146, 255, 0.58);
}

.platform-ring--middle {
  inset: 24%;
  border-color: rgba(166, 185, 248, 0.42);
  animation: platformSpin 15s linear infinite;
}

.platform-ring--inner {
  inset: 38%;
  border-color: rgba(86, 194, 255, 0.46);
  animation: platformSpin 11s linear infinite reverse;
}

.hero-pen-wrap {
  position: absolute;
  left: 37%;
  top: 0;
  width: clamp(310px, 31vw, 450px);
  height: clamp(520px, 55vw, 720px);
  transform:
    translate3d(
      calc(var(--hero-parallax-x) * 24px),
      calc(var(--hero-parallax-y) * 18px),
      80px
    );
  transform-origin: 50% 62%;
  animation: penLevitate 6.8s ease-in-out infinite;
  z-index: 5;
}

.hero-pen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.86), rgba(221, 226, 236, 0.98) 19%, #ffffff 39%, #d2d7e1 69%, #fafafa 100%);
  border: 1px solid rgba(255, 255, 255, 0.78);
  box-shadow:
    -18px 16px 42px rgba(0, 0, 0, 0.48),
    0 0 42px rgba(117, 166, 255, 0.22),
    inset 18px 0 28px rgba(255, 255, 255, 0.9),
    inset -20px 0 30px rgba(55, 71, 92, 0.16);
}

.hero-pen::before {
  content: '';
  position: absolute;
  inset: 2.8% 13% 2.8% auto;
  width: 16%;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.08));
  filter: blur(1px);
}

.hero-pen::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 11%;
  bottom: 9%;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(55, 74, 108, 0.2), transparent);
}

.pen-cap {
  position: absolute;
  inset: 0 0 auto;
  height: 29%;
  border-radius: 999px 999px 14px 14px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.88), #eef1f8 35%, #cfd4df 78%, #ffffff);
  border-bottom: 1px solid rgba(45, 58, 84, 0.12);
}

.pen-clip {
  position: absolute;
  top: 7%;
  right: 13%;
  width: 22%;
  height: 72%;
  border-radius: 999px;
  background: linear-gradient(90deg, #f9fbff, #aeb5c0 46%, #ffffff 66%, #677182);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.22), inset 0 0 0 1px rgba(43, 54, 74, 0.22);
}

.pen-ring {
  position: absolute;
  left: 0;
  width: 100%;
  height: 1.6%;
  background: linear-gradient(90deg, #7c531c, #f0d59b 36%, #8a5a1c 74%, #3a2c19);
  box-shadow: 0 0 4px rgba(240, 213, 155, 0.5);
}

.pen-ring--top {
  top: 29%;
}

.pen-ring--bottom {
  top: 74.5%;
}

.pen-brand {
  position: absolute;
  top: 32%;
  left: 26%;
  right: 25%;
  display: grid;
  place-items: center;
  gap: 0.3rem;
  color: #17326c;
  font-size: clamp(0.4rem, 0.7vw, 0.64rem);
  font-weight: 800;
  letter-spacing: 0.24em;
  line-height: 1.15;
  text-align: center;
}

.pen-brand__mark {
  display: inline-grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #17326c;
  color: white;
  font-size: 0.52rem;
  letter-spacing: 0;
  box-shadow: 0 4px 10px rgba(23, 50, 108, 0.25);
}

.pen-label {
  position: absolute;
  inset: 43% 12% 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  color: #162d63;
  text-align: center;
  background:
    linear-gradient(90deg, transparent, rgba(166, 185, 248, 0.12), transparent),
    linear-gradient(180deg, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0.06));
  border-top: 1px solid rgba(38, 69, 128, 0.12);
  border-bottom: 1px solid rgba(38, 69, 128, 0.12);
}

.pen-label strong {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: clamp(1.8rem, 3.1vw, 3.05rem);
  line-height: 1;
  letter-spacing: 0.04em;
}

.pen-label small {
  color: #1b2540;
  font-size: clamp(0.58rem, 0.85vw, 0.88rem);
  font-weight: 800;
  line-height: 1.05;
}

.pen-dose-window {
  position: absolute;
  left: 31%;
  top: 78%;
  width: 38%;
  height: 10%;
  border-radius: 12px;
  background: linear-gradient(135deg, #5a390f, #f4d497 34%, #432b12 64%, #fff1c2);
  padding: 6%;
  box-shadow: inset 0 0 0 2px rgba(61, 41, 16, 0.26), 0 5px 12px rgba(0, 0, 0, 0.23);
}

.pen-dose-window span {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 7px;
  background: linear-gradient(180deg, #fff, #d8dce5);
  color: #1b2540;
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: clamp(1rem, 1.4vw, 1.42rem);
}

.pen-grip {
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: 7.5%;
  height: 8%;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.pen-grip span {
  width: 2px;
  height: 68%;
  border-radius: 2px;
  background: rgba(67, 76, 92, 0.28);
  box-shadow: 1px 0 0 rgba(255, 255, 255, 0.78);
}

.pen-end {
  position: absolute;
  left: 5%;
  right: 5%;
  bottom: 1.2%;
  height: 6%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 48%, #1f2c37 0 28%, #0f1724 35%, #c19858 42%, #5c3710 70%, #1b1512 100%);
  box-shadow: inset 0 0 10px rgba(255, 230, 180, 0.36);
}

.hero-molecule {
  position: absolute;
  width: 150px;
  height: 150px;
  transform:
    translate3d(
      calc(var(--hero-parallax-x) * -28px),
      calc(var(--hero-parallax-y) * -18px),
      40px
    );
  animation: moleculeFloat 9s ease-in-out infinite;
  z-index: 4;
}

.hero-molecule--one {
  left: 8%;
  top: 15%;
}

.hero-molecule--two {
  right: 0;
  top: 48%;
  width: 130px;
  height: 130px;
  animation-duration: 11s;
  animation-delay: -4s;
}

.hero-molecule span {
  position: absolute;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 24%, #ffffff 0 8%, #64d4ff 18%, #0559c6 58%, #011a55 100%);
  box-shadow:
    0 0 18px rgba(32, 148, 255, 0.72),
    inset -8px -10px 14px rgba(0, 17, 76, 0.65);
}

.hero-molecule span::after {
  content: '';
  position: absolute;
  width: 58px;
  height: 4px;
  left: 50%;
  top: 50%;
  transform-origin: left center;
  background: linear-gradient(90deg, rgba(104, 199, 255, 0.8), rgba(104, 199, 255, 0.1));
  border-radius: 999px;
  box-shadow: 0 0 8px rgba(82, 184, 255, 0.6);
  z-index: -1;
}

.hero-molecule span:nth-child(1) { left: 55px; top: 48px; width: 48px; height: 48px; }
.hero-molecule span:nth-child(1)::after { transform: rotate(-62deg); width: 54px; }
.hero-molecule span:nth-child(2) { left: 44px; top: 2px; }
.hero-molecule span:nth-child(2)::after { transform: rotate(128deg); width: 60px; }
.hero-molecule span:nth-child(3) { left: 106px; top: 28px; }
.hero-molecule span:nth-child(3)::after { transform: rotate(148deg); width: 44px; }
.hero-molecule span:nth-child(4) { left: 16px; top: 82px; }
.hero-molecule span:nth-child(4)::after { transform: rotate(-33deg); width: 62px; }
.hero-molecule span:nth-child(5) { left: 85px; top: 112px; }
.hero-molecule span:nth-child(5)::after { display: none; }

.hero-pen {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
  filter:
    drop-shadow(-24px 28px 30px rgba(0, 0, 0, 0.52))
    drop-shadow(0 0 34px rgba(72, 151, 255, 0.26));
}

.hero-platform {
  left: -4%;
  right: -12%;
  bottom: -4%;
  height: 42%;
  background: none;
  box-shadow: none;
  overflow: hidden;
  transform: translate3d(
    calc(var(--hero-parallax-x) * -10px),
    calc(var(--hero-parallax-y) * -6px),
    0
  );
}

.hero-platform::before {
  inset: 53% 32% 13%;
  z-index: 2;
}

.hero-platform img {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 116%;
  max-width: none;
  transform: translateX(-50%);
  opacity: 0.86;
  mix-blend-mode: screen;
  -webkit-mask-image: radial-gradient(ellipse 57% 47% at 56% 64%, #000 42%, rgba(0, 0, 0, 0.7) 56%, transparent 78%);
  mask-image: radial-gradient(ellipse 57% 47% at 56% 64%, #000 42%, rgba(0, 0, 0, 0.7) 56%, transparent 78%);
  filter:
    saturate(1.18)
    contrast(1.06)
    drop-shadow(0 0 32px rgba(43, 142, 255, 0.34));
}

.hero-molecule {
  object-fit: contain;
  filter:
    saturate(1.1)
    drop-shadow(0 0 18px rgba(25, 134, 255, 0.42));
}

.hero-molecule--one {
  width: 150px;
  height: auto;
  left: 6%;
  top: 15%;
}

.hero-molecule--two {
  width: 118px;
  height: auto;
  left: 26%;
  top: 11%;
  animation-duration: 10.5s;
  animation-delay: -2s;
  transform:
    translate3d(
      calc(var(--hero-parallax-x) * -16px),
      calc(var(--hero-parallax-y) * -10px),
      40px
    )
    rotate(8deg);
}


.hero-orbits {
  --hero-idle-x: 0px;
  --hero-idle-y: 0px;
  --hero-idle-rotate: 0deg;
  inset: auto;
  right: -6%;
  top: 23%;
  width: 72%;
  height: 46%;
  transform:
    translate3d(
      var(--hero-idle-x),
      calc(var(--hero-idle-y) + (var(--hero-scroll-progress) * -140px)),
      0
    )
    rotate(var(--hero-idle-rotate))
    scale(calc(var(--hero-orbit-enter-scale) - (var(--hero-scroll-progress) * 0.18)));
  opacity: var(--hero-scene-enter-opacity);
  transform-origin: 52% 50%;
  animation: heroOrbitReveal 1.45s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both;
  z-index: 3;
}

.hero-orbit-image {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100%;
  max-width: none;
  height: auto;
  object-fit: contain;
  transform-origin: center;
  opacity: 0.64;
  mix-blend-mode: screen;
  filter: drop-shadow(0 0 8px rgba(70, 130, 255, 0.35));
  animation: orbitAssetDrift 24s ease-in-out infinite;
  backface-visibility: hidden;
}

.hero-orbit-image--back {
  transform: translate(-50%, -50%) rotate(-8deg);
  z-index: 1;
}

[data-theme="light"] .hero-orbit-image {
  opacity: 0.28;
  mix-blend-mode: multiply;
  filter:
    saturate(0.9)
    drop-shadow(0 0 10px rgba(70, 130, 255, 0.12));
}

.hero-pen-wrap {
  --hero-pen-enter-y: 0px;
  --hero-scene-enter-opacity: 1;
  --hero-idle-x: 0px;
  --hero-idle-y: 0px;
  --hero-idle-rotate: 0deg;
  left: auto;
  right: 12%;
  top: 8%;
  width: 36%;
  height: 72%;
  transform:
    translate3d(
      var(--hero-idle-x),
      calc(var(--hero-pen-enter-y) + var(--hero-idle-y) + (var(--hero-scroll-progress) * -260px)),
      80px
    )
    rotate(calc(12deg + var(--hero-idle-rotate)));
  opacity: var(--hero-scene-enter-opacity);
  transform-origin: 50% 63%;
  animation: heroPenDrop 1.35s cubic-bezier(0.16, 1, 0.3, 1) 0.28s both;
  z-index: 5;
}

.hero-pen {
  box-shadow: none;
  border: 0;
  background: transparent;
  border-radius: 0;
  overflow: visible;
  object-fit: contain;
  filter:
    drop-shadow(-22px 26px 34px rgba(0, 0, 0, 0.56))
    drop-shadow(0 0 34px rgba(72, 151, 255, 0.24));
  animation: penLevitate 6.8s ease-in-out infinite;
  will-change: transform;
  backface-visibility: hidden;
}

[data-theme="light"] .hero-pen {
  filter:
    drop-shadow(-16px 22px 26px rgba(38, 54, 96, 0.18))
    drop-shadow(0 0 28px rgba(72, 151, 255, 0.12));
}

.hero-platform {
  --hero-platform-enter-x: 0px;
  --hero-scene-enter-opacity: 1;
  --hero-idle-x: 0px;
  --hero-idle-y: 0px;
  --hero-idle-rotate: 0deg;
  left: auto;
  right: 7%;
  bottom: 0;
  width: 54%;
  height: 32%;
  border-radius: 0;
  overflow: visible;
  background: none;
  box-shadow: none;
  transform: translate3d(
    calc(var(--hero-platform-enter-x) + var(--hero-idle-x) + (var(--hero-scroll-progress) * 260px)),
    var(--hero-idle-y),
    0
  )
  rotate(var(--hero-idle-rotate));
  opacity: var(--hero-scene-enter-opacity);
  animation: heroPlatformSlide 1.25s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
  z-index: 4;
}

.hero-platform::before {
  inset: 42% 34% 21%;
  background: radial-gradient(circle at center, rgba(61, 183, 255, 0.82), rgba(32, 125, 255, 0.2) 31%, transparent 68%);
  filter: blur(8px);
  z-index: 3;
}

.hero-platform img {
  left: 50%;
  bottom: 0;
  width: 100%;
  height: auto;
  transform: translateX(-50%);
  opacity: 0.95;
  mix-blend-mode: screen;
  -webkit-mask-image: none;
  mask-image: none;
  filter:
    saturate(1.12)
    contrast(1.04)
    drop-shadow(0 0 24px rgba(43, 142, 255, 0.28));
  animation: platformImageFloat 7.8s ease-in-out infinite alternate;
  will-change: transform;
  backface-visibility: hidden;
}

[data-theme="light"] .hero-platform img {
  opacity: 0.7;
  mix-blend-mode: multiply;
  filter:
    saturate(0.92)
    contrast(0.96)
    drop-shadow(0 0 18px rgba(43, 142, 255, 0.12));
}

.hero-molecule {
  --hero-object-opacity: 0.9;
  --hero-land-y: 0px;
  --hero-land-opacity: 1;
  --hero-idle-x: 0px;
  --hero-idle-y: 0px;
  --hero-idle-rotate: 0deg;
  display: block;
  position: absolute;
  object-fit: contain;
  mix-blend-mode: screen;
  pointer-events: none;
  user-select: none;
  z-index: 4;
  opacity: calc(var(--hero-object-opacity) * var(--hero-land-opacity));
  will-change: transform;
  animation: heroObjectLand 1.18s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
}

.hero-molecule__image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  mix-blend-mode: screen;
  filter:
    saturate(1.12)
    blur(0.6px)
    drop-shadow(0 0 16px rgba(25, 134, 255, 0.36));
  animation: moleculeFloat 9s ease-in-out infinite;
  will-change: transform;
  backface-visibility: hidden;
}

.hero-molecule--one {
  --hero-object-opacity: 0.94;
  width: 24%;
  left: 15%;
  top: 8%;
  animation-duration: 1.18s;
  animation-delay: 0.08s;
  transform:
    translate3d(
      0,
      calc(var(--hero-land-y) + (var(--hero-scroll-progress) * -210px)),
      42px
    )
    rotate(-7deg);
}

.hero-molecule--one .hero-molecule__image {
  filter:
    saturate(1.14)
    blur(0.35px)
    drop-shadow(0 0 18px rgba(25, 134, 255, 0.36));
  animation-duration: 10.5s;
}

.hero-molecule--two {
  --hero-object-opacity: 0.84;
  width: 19%;
  left: auto;
  right: 2%;
  top: 48%;
  animation-duration: 1.22s;
  animation-delay: 0.28s;
  transform:
    translate3d(
      0,
      calc(var(--hero-land-y) + (var(--hero-scroll-progress) * -230px)),
      40px
    )
    rotate(-8deg);
}

.hero-molecule--two .hero-molecule__image {
  filter:
    saturate(1.12)
    blur(0.8px)
    drop-shadow(0 0 16px rgba(25, 134, 255, 0.28));
  animation-duration: 8.6s;
}

.hero-molecule--background {
  --hero-object-opacity: 0.28;
  width: 11%;
  left: 37%;
  top: 22%;
  z-index: 2;
  animation-duration: 1.26s;
  animation-delay: 0.46s;
  transform:
    translate3d(
      0,
      calc(var(--hero-land-y) + (var(--hero-scroll-progress) * -170px)),
      10px
    )
    rotate(7deg);
}

.hero-molecule--background .hero-molecule__image {
  filter:
    saturate(0.95)
    blur(8px)
    drop-shadow(0 0 12px rgba(25, 134, 255, 0.18));
  animation-duration: 9.4s;
}

.hero-sphere {
  --hero-object-opacity: 0.9;
  --hero-land-y: 0px;
  --hero-land-opacity: 1;
  --hero-idle-x: 0px;
  --hero-idle-y: 0px;
  --hero-idle-rotate: 0deg;
  display: block;
  position: absolute;
  height: auto;
  aspect-ratio: auto;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  object-fit: contain;
  mix-blend-mode: screen;
  pointer-events: none;
  user-select: none;
  z-index: 4;
  opacity: calc(var(--hero-object-opacity) * var(--hero-land-opacity));
  will-change: transform;
  animation: heroObjectLand 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
}

.hero-sphere::before,
.hero-sphere::after {
  content: none;
}

.hero-sphere__image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  mix-blend-mode: screen;
  filter:
    saturate(1.12)
    blur(1px)
    drop-shadow(0 0 18px rgba(62, 157, 255, 0.28));
  animation: sphereAssetDrift 7.4s ease-in-out infinite;
  will-change: transform;
  backface-visibility: hidden;
}

.home.is-scroll-active .home-global-decor__item,
.home.is-scroll-active .orb,
.home.is-scroll-active .section-decor img,
.home.is-scroll-active .float-shape,
.hero__visual.is-scroll-active .hero-pen,
.hero__visual.is-scroll-active .hero-platform::before,
.hero__visual.is-scroll-active .hero-platform img,
.hero__visual.is-scroll-active .hero-orbit-image,
.hero__visual.is-scroll-active .hero-molecule__image,
.hero__visual.is-scroll-active .hero-sphere__image {
  animation-play-state: paused;
}

[data-theme="light"] .hero-molecule,
[data-theme="light"] .hero-sphere {
  mix-blend-mode: normal;
}

[data-theme="light"] .hero-molecule__image,
[data-theme="light"] .hero-sphere__image {
  mix-blend-mode: multiply;
}

[data-theme="light"] .hero-molecule {
  opacity: calc((var(--hero-object-opacity) * 0.38) * var(--hero-land-opacity));
}

[data-theme="light"] .hero-molecule__image {
  filter:
    saturate(0.82)
    blur(2px)
    drop-shadow(0 0 10px rgba(25, 134, 255, 0.08));
}

[data-theme="light"] .hero-sphere {
  opacity: calc((var(--hero-object-opacity) * 0.42) * var(--hero-land-opacity));
}

[data-theme="light"] .hero-sphere__image {
  filter:
    saturate(0.85)
    blur(2px)
    drop-shadow(0 0 10px rgba(62, 157, 255, 0.08));
}

.hero-sphere--top {
  --hero-object-opacity: 0.86;
  width: 5%;
  left: 30%;
  top: 20%;
  z-index: 4;
  animation-duration: 1.16s;
  animation-delay: 0.18s;
  transform:
    translate3d(
      0,
      calc(var(--hero-land-y) + (var(--hero-scroll-progress) * -190px)),
      40px
    )
    rotate(3deg);
}

.hero-sphere--top .hero-sphere__image {
  filter:
    saturate(1.08)
    blur(0.2px)
    drop-shadow(0 0 18px rgba(82, 157, 255, 0.24));
  animation-duration: 6.2s;
}

.hero-sphere--right {
  --hero-object-opacity: 0.56;
  width: 10%;
  right: 2%;
  top: 18%;
  z-index: 3;
  animation-duration: 1.2s;
  animation-delay: 0.34s;
  transform:
    translate3d(
      0,
      calc(var(--hero-land-y) + (var(--hero-scroll-progress) * -165px)),
      60px
    )
    rotate(-5deg);
}

.hero-sphere--right .hero-sphere__image {
  filter:
    saturate(1.02)
    blur(1.6px)
    drop-shadow(0 0 20px rgba(82, 157, 255, 0.22));
  animation-duration: 8.8s;
}

.hero-sphere--orbit {
  --hero-object-opacity: 0.68;
  width: 5.5%;
  left: 36%;
  bottom: 30%;
  z-index: 4;
  animation-duration: 1.22s;
  animation-delay: 0.42s;
  transform:
    translate3d(
      0,
      calc(var(--hero-land-y) + (var(--hero-scroll-progress) * -155px)),
      38px
    )
    rotate(2deg);
}

.hero-sphere--orbit .hero-sphere__image {
  filter:
    saturate(1.1)
    blur(0.9px)
    drop-shadow(0 0 16px rgba(82, 157, 255, 0.22));
  animation-duration: 7.8s;
}

.hero-sphere--far-left {
  --hero-object-opacity: 0.24;
  width: 8%;
  left: 38%;
  top: 20%;
  z-index: 1;
  animation-duration: 1.25s;
  animation-delay: 0.52s;
  transform:
    translate3d(
      0,
      calc(var(--hero-land-y) + (var(--hero-scroll-progress) * -130px)),
      6px
    )
    rotate(-2deg);
}

.hero-sphere--far-left .hero-sphere__image {
  filter:
    saturate(0.82)
    blur(11px)
    drop-shadow(0 0 10px rgba(82, 157, 255, 0.12));
  animation-duration: 9.8s;
}

.hero-sphere--far-right {
  --hero-object-opacity: 0.24;
  width: 13%;
  right: 1%;
  bottom: 15%;
  z-index: 1;
  animation-duration: 1.28s;
  animation-delay: 0.64s;
  transform:
    translate3d(
      0,
      calc(var(--hero-land-y) + (var(--hero-scroll-progress) * -145px)),
      4px
    )
    rotate(4deg);
}

.hero-sphere--far-right .hero-sphere__image {
  filter:
    saturate(0.78)
    blur(14px)
    drop-shadow(0 0 10px rgba(82, 157, 255, 0.1));
  animation-duration: 10s;
}

@keyframes heroPenDrop {
  0% {
    --hero-pen-enter-y: -360px;
    --hero-scene-enter-opacity: 0;
  }
  68% {
    --hero-pen-enter-y: 18px;
    --hero-scene-enter-opacity: 1;
  }
  100% {
    --hero-pen-enter-y: 0px;
    --hero-scene-enter-opacity: 1;
  }
}

@keyframes heroPlatformSlide {
  0% {
    --hero-platform-enter-x: 420px;
    --hero-scene-enter-opacity: 0;
  }
  70% {
    --hero-platform-enter-x: -16px;
    --hero-scene-enter-opacity: 1;
  }
  100% {
    --hero-platform-enter-x: 0px;
    --hero-scene-enter-opacity: 1;
  }
}

@keyframes heroOrbitReveal {
  0% {
    --hero-orbit-enter-scale: 0;
    --hero-scene-enter-opacity: 0;
  }
  72% {
    --hero-orbit-enter-scale: 1.05;
    --hero-scene-enter-opacity: 1;
  }
  100% {
    --hero-orbit-enter-scale: 1;
    --hero-scene-enter-opacity: 1;
  }
}

@keyframes penLevitate {
  0%, 100% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  50% {
    transform: translate3d(0, -8px, 0) rotate(-0.8deg);
  }
}

@keyframes orbitDrift {
  from { rotate: 0deg; }
  to { rotate: 360deg; }
}

@keyframes orbitAssetDrift {
  0%, 100% { transform: translate(-50%, -50%) rotate(-8deg); }
  50% { transform: translate(-50%, calc(-50% - 5px)) rotate(-6.4deg); }
}

@keyframes platformImageFloat {
  0%, 100% { transform: translateX(-50%) translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translateX(-50%) translate3d(-5px, -6px, 0) rotate(-0.5deg); }
}

@keyframes platformPulse {
  0%, 100% { opacity: 0.68; transform: scale(0.96); }
  50% { opacity: 1; transform: scale(1.04); }
}

@keyframes platformSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes moleculeFloat {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(4px, -10px, 0) rotate(3deg); }
}

@keyframes sphereAssetDrift {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
  50% { transform: translate3d(-5px, 9px, 0) rotate(2.5deg); }
}

@keyframes heroObjectLand {
  0% {
    --hero-land-y: -96px;
    --hero-land-opacity: 0;
    scale: 0.96;
  }
  62% {
    --hero-land-y: 7px;
    --hero-land-opacity: 1;
    scale: 1.015;
  }
  100% {
    --hero-land-y: 0px;
    --hero-land-opacity: 1;
    scale: 1;
  }
}

.features {
  position: relative;
  padding: 8rem 0;
  overflow: hidden;
  isolation: isolate;
  background: transparent;
}

.features > .container,
.categories-preview > .container {
  position: relative;
  z-index: 2;
}

.section-decor {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  user-select: none;
  overflow: hidden;
}

.section-decor img {
  position: absolute;
  display: block;
  height: auto;
  object-fit: contain;
  mix-blend-mode: screen;
}

[data-theme="light"] .section-decor img {
  mix-blend-mode: multiply;
}

[data-theme="light"] .section-decor__molecule {
  opacity: 0.1;
  filter: saturate(0.82) blur(4px);
}

[data-theme="light"] .section-decor__drop {
  opacity: 0.12;
  filter: saturate(0.86) blur(3px);
}

.section-decor__molecule {
  filter:
    saturate(1.08)
    drop-shadow(0 0 18px rgba(45, 139, 255, 0.22));
}

.section-decor__drop {
  filter:
    saturate(1.04)
    drop-shadow(0 0 20px rgba(67, 154, 255, 0.2));
}

.section-decor__molecule--features-main {
  width: clamp(150px, 14vw, 230px);
  right: clamp(-80px, -4vw, -34px);
  top: 8%;
  opacity: 0.42;
  transform: rotate(-11deg);
}

.section-decor__molecule--features-soft {
  width: clamp(120px, 11vw, 190px);
  left: clamp(-76px, -4vw, -32px);
  bottom: 7%;
  opacity: 0.22;
  filter:
    saturate(0.9)
    blur(7px)
    drop-shadow(0 0 12px rgba(45, 139, 255, 0.14));
  animation-duration: 13s;
  animation-delay: -5s;
}

.section-decor__drop--features-top {
  width: clamp(44px, 4.6vw, 74px);
  left: 46%;
  top: 11%;
  opacity: 0.38;
  filter:
    saturate(1.05)
    blur(1.2px)
    drop-shadow(0 0 16px rgba(67, 154, 255, 0.18));
  animation-delay: -2s;
}

.section-decor__drop--features-low {
  width: clamp(88px, 8vw, 138px);
  right: 18%;
  bottom: 0;
  opacity: 0.18;
  filter:
    saturate(0.86)
    blur(12px)
    drop-shadow(0 0 10px rgba(67, 154, 255, 0.1));
  animation-duration: 15s;
  animation-delay: -7s;
}

.features-panel {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 1.25rem;
}

.features-lead {
  position: relative;
  padding: 2.2rem;
  border-radius: 22px;
  border: 1px solid var(--border);
  background:
    radial-gradient(circle at 18% 15%, rgba(166, 185, 248, 0.16), transparent 42%),
    linear-gradient(160deg, var(--bg-card), var(--bg-secondary));
  overflow: hidden;
}

.features-lead::after {
  content: '';
  position: absolute;
  right: -120px;
  bottom: -120px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  border: 1px dashed rgba(166, 185, 248, 0.2);
}

.features-kicker {
  display: inline-flex;
  margin-bottom: 1rem;
  padding: 0.32rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.features-lead h2 {
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.4vw, 2rem);
  line-height: 1.15;
  margin-bottom: 0.9rem;
}

.features-lead p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1.2rem;
}

.features-license {
  position: relative;
  z-index: 1;
  display: inline-grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0.75rem;
  width: min(100%, 420px);
  padding: 0.85rem 1rem;
  margin-bottom: 1.2rem;
  border: 1px solid rgba(166, 185, 248, 0.24);
  border-radius: 14px;
  background: rgba(166, 185, 248, 0.08);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 700;
  transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease;
}

.features-license:hover {
  transform: translateY(-2px);
  border-color: rgba(166, 185, 248, 0.44);
  background: rgba(166, 185, 248, 0.12);
}

.features-license__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--accent);
  color: var(--bg-primary);
}

.features-license small {
  display: block;
  margin-top: 0.1rem;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.features-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.features-metric {
  background: rgba(166, 185, 248, 0.08);
  border: 1px solid rgba(166, 185, 248, 0.18);
  border-radius: 14px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.features-metric strong {
  font-family: var(--font-mono);
  color: var(--accent);
  font-size: 1.15rem;
}

.features-metric span {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.features-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.feature-card {
  position: relative;
  padding: 1.35rem;
  background:
    linear-gradient(145deg, rgba(166, 185, 248, 0.07), transparent 35%),
    linear-gradient(145deg, var(--bg-card) 0%, var(--bg-secondary) 100%);
  border: 1px solid var(--border);
  border-radius: 18px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.feature-card:hover {
  border-color: rgba(166, 185, 248, 0.3);
  transform: translateY(-6px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-dim);
  border-radius: 14px;
  color: var(--accent);
  margin-bottom: 0.9rem;
  transition: all 0.4s ease;
}

.feature-card:hover .feature-icon {
  background: var(--accent);
  color: var(--bg-primary);
  transform: rotate(-5deg) scale(1.1);
}

.feature-card h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.45rem;
}

.feature-card p {
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.categories-preview {
  position: relative;
  padding: 4rem 0 8rem;
  overflow: hidden;
  isolation: isolate;
  background: transparent;
}

.section-decor--categories {
  inset: -6% 0 0;
}

.section-decor__molecule--categories-main {
  width: clamp(160px, 15vw, 260px);
  right: clamp(-46px, -2.4vw, -18px);
  top: 18%;
  opacity: 0.4;
  transform: rotate(9deg);
  animation-duration: 12s;
  animation-delay: -3s;
}

.section-decor__molecule--categories-soft {
  width: clamp(110px, 10vw, 180px);
  left: 34%;
  top: 7%;
  opacity: 0.2;
  filter:
    saturate(0.88)
    blur(8px)
    drop-shadow(0 0 12px rgba(45, 139, 255, 0.12));
  animation-duration: 14s;
  animation-delay: -6s;
}

.section-decor__drop--categories-top {
  width: clamp(50px, 4.8vw, 78px);
  right: 30%;
  top: 13%;
  opacity: 0.36;
  filter:
    saturate(1.08)
    blur(0.8px)
    drop-shadow(0 0 16px rgba(67, 154, 255, 0.18));
  animation-delay: -1s;
}

.section-decor__drop--categories-mid {
  width: clamp(78px, 7vw, 120px);
  left: clamp(-44px, -2vw, -18px);
  top: 42%;
  opacity: 0.24;
  filter:
    saturate(0.9)
    blur(8px)
    drop-shadow(0 0 12px rgba(67, 154, 255, 0.1));
  animation-duration: 13s;
  animation-delay: -4s;
}

.section-decor__drop--categories-low {
  width: clamp(58px, 5.4vw, 90px);
  right: 43%;
  bottom: 8%;
  opacity: 0.32;
  filter:
    saturate(1.02)
    blur(2px)
    drop-shadow(0 0 14px rgba(67, 154, 255, 0.14));
  animation-duration: 10s;
  animation-delay: -7s;
}

@keyframes sectionDecorFloat {
  0% { translate: 0 0; rotate: 0deg; }
  100% { translate: 10px -16px; rotate: 2deg; }
}

@keyframes sectionDecorFloatSoft {
  0% { translate: 0 0; rotate: 0deg; }
  100% { translate: -8px 13px; rotate: -2deg; }
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

.categories-lab {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) 1.2fr;
  gap: 1rem;
}

.categories-lab__panel {
  padding: 1.5rem;
  border-radius: 22px;
  border: 1px solid var(--border);
  background:
    radial-gradient(circle at 25% 12%, rgba(166, 185, 248, 0.16), transparent 40%),
    linear-gradient(155deg, var(--bg-card), var(--bg-secondary));
}

.categories-lab__kicker {
  display: inline-flex;
  margin-bottom: 0.9rem;
  padding: 0.32rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(166, 185, 248, 0.35);
  color: var(--accent);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.categories-lab__panel h3 {
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2.1vw, 1.8rem);
  line-height: 1.2;
  margin-bottom: 0.75rem;
}

.categories-lab__panel p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.65;
}

.categories-lab__metrics {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.categories-lab__metric {
  padding: 0.55rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  text-align: center;
}

.categories-lab__metric strong {
  display: block;
  font-family: var(--font-mono);
  color: var(--accent);
  font-size: 0.98rem;
}

.categories-lab__metric span {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.categories-lab__cta {
  margin-top: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent);
  font-weight: 600;
  font-size: 0.85rem;
}

.categories-lab__cta:hover {
  gap: 0.7rem;
}

.categories-lanes {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.category-lane {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
  border-radius: 18px;
  border: 1px solid var(--border);
  background:
    linear-gradient(90deg, rgba(166, 185, 248, 0.08), transparent 42%),
    var(--bg-card);
  overflow: hidden;
  transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
}

.category-lane::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: var(--lane-progress, 40%);
  height: 2px;
  background: linear-gradient(90deg, var(--accent), transparent);
}

.category-lane:hover {
  transform: translateX(6px);
  border-color: rgba(166, 185, 248, 0.32);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.2);
}

.lane-longevity { --lane-progress: 88%; }
.lane-immune { --lane-progress: 76%; }
.lane-neuro { --lane-progress: 74%; }
.lane-growth { --lane-progress: 62%; }

.category-lane__left {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.8rem;
  align-items: center;
}

.category-lane__icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  background: rgba(166, 185, 248, 0.13);
  border: 1px solid rgba(166, 185, 248, 0.3);
}

.category-lane h4 {
  margin: 0 0 0.3rem;
  font-family: var(--font-display);
  font-size: 1.05rem;
}

.category-lane p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.83rem;
  line-height: 1.45;
}

.category-lane__right {
  text-align: right;
  min-width: 72px;
}

.category-lane__count {
  display: block;
  font-family: var(--font-mono);
  font-size: 1.4rem;
  color: var(--accent);
  line-height: 1;
}

.category-lane__meta {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
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
  position: relative;
  background:
    linear-gradient(160deg, rgba(166, 185, 248, 0.07), transparent 35%),
    var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.featured-card:hover {
  border-color: rgba(166, 185, 248, 0.3);
  transform: translateY(-8px) scale(1.01);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.featured-card::after {
  content: '';
  position: absolute;
  inset: -120% auto auto -40%;
  width: 60%;
  height: 260%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  transform: rotate(18deg);
  pointer-events: none;
  transition: transform 0.7s ease;
}

.featured-card:hover::after {
  transform: translateX(280%) rotate(18deg);
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

.featured-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
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
}

.featured-low-stock {
  display: inline-flex;
  align-items: center;
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-radius: 999px;
  padding: 0.28rem 0.55rem;
}

.featured-content h3 {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.featured-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.featured-price-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.featured-price {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.featured-discount-row {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.featured-old-price {
  font-size: 0.78rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.featured-discount-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 999px;
  padding: 0.1rem 0.42rem;
}

.featured-add-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 9px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.featured-add-btn:hover:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-primary);
}

.featured-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.featured-qty-control {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.18rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg-secondary);
}

.featured-qty-btn {
  width: 26px;
  height: 26px;
  border: 1px solid transparent;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
  transition: all 0.3s ease;
}

.featured-qty-btn:hover:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-primary);
}

.featured-qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.featured-qty-value {
  min-width: 18px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.cta {
  padding: 4rem 0 8rem;
}

.cta__inner {
  position: relative;
  padding: 5rem;
  background:
    radial-gradient(circle at 90% 15%, rgba(166, 185, 248, 0.13), transparent 35%),
    var(--bg-card);
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
  border: 2px dashed rgba(166, 185, 248, 0.2);
  border-radius: 50%;
  animation: spin 30s linear infinite;
  transition: border-color 0.4s ease;
}

[data-theme="light"] .orbit {
  border-color: rgba(166, 185, 248, 0.3);
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

.benefits__timeline {
  position: relative;
  display: grid;
  gap: 0.85rem;
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 18px;
  background:
    linear-gradient(175deg, rgba(166, 185, 248, 0.06), transparent 28%),
    var(--bg-card);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.timeline-item:hover {
  transform: translateX(6px);
  border-color: rgba(166, 185, 248, 0.35);
}

.timeline-index {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--accent-dim);
  color: var(--accent);
  font-family: var(--font-mono);
  font-weight: 800;
  font-size: 1.2rem;
}

.timeline-content h3 {
  font-family: var(--font-display);
  font-size: 1.08rem;
  margin-bottom: 0.35rem;
}

.timeline-content p {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.partnership-teaser {
  position: relative;
  padding: 2rem 0 6rem;
}

.partnership-teaser__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.82fr) auto;
  gap: 1.4rem;
  align-items: center;
  padding: clamp(1.3rem, 2.2vw, 2rem);
  border: 1px solid rgba(166, 185, 248, 0.2);
  border-radius: 24px;
  background:
    radial-gradient(circle at 10% 20%, rgba(166, 185, 248, 0.14), transparent 28%),
    radial-gradient(circle at 84% 74%, rgba(52, 138, 255, 0.12), transparent 28%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.02));
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

.partnership-teaser__inner::after {
  content: '';
  position: absolute;
  right: -80px;
  top: -90px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  border: 1px solid rgba(166, 185, 248, 0.18);
  box-shadow: inset 0 0 34px rgba(70, 140, 255, 0.14);
}

.partnership-teaser__copy,
.partnership-teaser__stats,
.partnership-teaser__button {
  position: relative;
  z-index: 1;
}

.partnership-teaser__kicker {
  display: inline-flex;
  margin-bottom: 0.9rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid rgba(166, 185, 248, 0.34);
  border-radius: 999px;
  color: var(--accent);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: rgba(166, 185, 248, 0.08);
}

.partnership-teaser h2 {
  margin-bottom: 0.7rem;
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 3vw, 3rem);
  line-height: 1.05;
}

.partnership-teaser p {
  max-width: 680px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.partnership-teaser__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.partnership-teaser__stats div {
  min-height: 108px;
  padding: 1rem;
  border: 1px solid rgba(166, 185, 248, 0.16);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.035);
}

.partnership-teaser__stats strong {
  display: block;
  margin-bottom: 0.55rem;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 1.35rem;
}

.partnership-teaser__stats span {
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.45;
}

.partnership-teaser__button {
  min-width: 210px;
  min-height: 58px;
}

[data-theme="light"] .partnership-teaser__inner {
  border-color: rgba(69, 96, 179, 0.16);
  background:
    radial-gradient(circle at 10% 20%, rgba(86, 126, 255, 0.11), transparent 28%),
    radial-gradient(circle at 84% 74%, rgba(52, 138, 255, 0.08), transparent 28%),
    rgba(255, 255, 255, 0.78);
  box-shadow: 0 24px 70px rgba(47, 62, 112, 0.1);
}

[data-theme="light"] .partnership-teaser__stats div {
  background: rgba(255, 255, 255, 0.62);
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
  background: linear-gradient(135deg, var(--accent) 0%, #1a4a6e 100%);
  clip-path: polygon(0 0, 100% 0, 100% 92%, 84% 100%, 0 94%);
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
  background: rgba(166, 185, 248, 0.3);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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
  color: var(--bg-primary);
}

.btn-accent:hover {
  background: var(--bg-secondary);
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .btn-accent {
  background: var(--accent);
  color: var(--bg-primary);
}

[data-theme="dark"] .btn-accent:hover {
  background: var(--accent-hover);
}

[data-theme="light"] .btn-accent {
  background: var(--accent);
  color: var(--bg-primary);
}

[data-theme="light"] .btn-accent:hover {
  background: var(--accent-hover);
}

.promo-timer {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  opacity: 0.8;
}

.promo-link {
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
  opacity: 0.86;
  transition: opacity 0.3s ease;
}

.promo-link:hover {
  opacity: 1;
}

.home-faq {
  position: relative;
  padding: 1rem 0 7rem;
}

.home-faq__layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.75fr) minmax(0, 1.25fr);
  gap: clamp(1.25rem, 3vw, 3rem);
  align-items: start;
}

.home-faq__intro {
  position: sticky;
  top: 110px;
  padding: 2rem;
  border: 1px solid rgba(166, 185, 248, 0.18);
  border-radius: 24px;
  background:
    radial-gradient(circle at 18% 18%, rgba(166, 185, 248, 0.14), transparent 34%),
    linear-gradient(160deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.018));
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(16px);
}

.home-faq__kicker {
  display: inline-flex;
  margin-bottom: 1rem;
  padding: 0.35rem 0.68rem;
  border-radius: 999px;
  border: 1px solid rgba(166, 185, 248, 0.35);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
}

.home-faq__intro h2 {
  margin: 0 0 1rem;
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 2.8vw, 2.65rem);
  line-height: 1.08;
}

.home-faq__intro p {
  margin: 0 0 1.4rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

.home-faq__manager {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--accent);
  font-weight: 800;
  transition: gap 0.25s ease, opacity 0.25s ease;
}

.home-faq__manager:hover {
  gap: 0.8rem;
  opacity: 0.9;
}

.home-faq__list {
  display: grid;
  gap: 0.75rem;
}

.home-faq__item {
  position: relative;
  border: 1px solid rgba(166, 185, 248, 0.16);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(166, 185, 248, 0.08), rgba(255, 255, 255, 0.018) 42%),
    rgba(18, 18, 24, 0.62);
  overflow: hidden;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.16);
  transition: border-color 0.3s ease, background 0.3s ease, transform 0.3s ease;
}

.home-faq__item:hover {
  transform: translateY(-2px);
  border-color: rgba(166, 185, 248, 0.32);
}

.home-faq__item[open] {
  border-color: rgba(166, 185, 248, 0.42);
  background:
    radial-gradient(circle at 92% 12%, rgba(166, 185, 248, 0.13), transparent 30%),
    linear-gradient(135deg, rgba(166, 185, 248, 0.11), rgba(255, 255, 255, 0.026) 52%),
    rgba(18, 18, 24, 0.72);
}

.home-faq__item summary {
  list-style: none;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
  cursor: pointer;
  color: var(--text-primary);
  font-weight: 800;
}

.home-faq__item summary::-webkit-details-marker {
  display: none;
}

.home-faq__item summary svg {
  color: var(--accent);
  transition: transform 0.25s ease;
}

.home-faq__item[open] summary svg {
  transform: rotate(180deg);
}

.home-faq__answer {
  box-sizing: border-box;
  overflow: hidden;
  max-height: 0;
  padding: 0 1.25rem;
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 0.95rem;
  opacity: 0;
  transform: translate3d(0, -6px, 0);
  transition:
    max-height 0.42s cubic-bezier(0.16, 1, 0.3, 1),
    padding-bottom 0.32s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.22s ease,
    transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: max-height, opacity, transform;
}

.home-faq__item[open] .home-faq__answer {
  max-height: 520px;
  padding-bottom: 1.2rem;
  opacity: 1;
  transform: translate3d(0, 0, 0);
}

.home-faq__answer p {
  margin: 0;
}

.home-faq__answer p + p {
  margin-top: 0.75rem;
}

.home-faq__answer strong,
.home-faq__answer a {
  color: var(--accent);
}

.home-faq__answer a {
  font-weight: 800;
}

[data-theme="light"] .home-faq__intro {
  background:
    radial-gradient(circle at 18% 18%, rgba(120, 153, 247, 0.16), transparent 34%),
    rgba(255, 255, 255, 0.82);
  box-shadow: 0 24px 70px rgba(33, 55, 110, 0.1);
}

[data-theme="light"] .home-faq__item {
  background:
    linear-gradient(135deg, rgba(120, 153, 247, 0.11), rgba(255, 255, 255, 0.88) 48%),
    rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 40px rgba(33, 55, 110, 0.08);
}

[data-theme="light"] .home-faq__item[open] {
  background:
    radial-gradient(circle at 92% 12%, rgba(120, 153, 247, 0.15), transparent 30%),
    rgba(255, 255, 255, 0.94);
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
  background:
    radial-gradient(circle at 12% 20%, rgba(166, 185, 248, 0.12), transparent 30%),
    var(--bg-card);
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
  .hero__container {
    min-height: clamp(570px, calc(100svh - 110px), 720px);
  }

  .hero__visual {
    width: 70%;
  }

  .hero-scene {
    right: 1%;
    width: min(100%, 900px);
    height: min(100%, 660px);
  }

  .hero__title {
    font-size: clamp(2rem, 3.05vw, 2.7rem);
    max-width: 660px;
  }

  .hero__badge {
    margin-bottom: 2rem;
  }

  .hero__actions {
    gap: 0.75rem;
    margin-bottom: 3.5rem;
  }

  .hero__actions .btn {
    padding: 0.95rem 1.5rem;
  }

  .hero__stats {
    max-width: 480px;
    gap: 1.5rem;
  }

  .stat-value {
    font-size: 2.25rem;
  }

  .hero-pen-wrap {
    top: 8%;
    right: 12%;
    width: 36%;
    height: 72%;
  }

  .hero-platform {
    right: 7%;
    width: 54%;
    height: 32%;
  }

  .hero__actions {
    flex-wrap: wrap;
  }

  .features-panel { grid-template-columns: 1fr; }
  .features-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .featured-grid { grid-template-columns: repeat(2, 1fr); }

  .categories-lab {
    grid-template-columns: 1fr;
  }

}

@media (min-width: 769px) and (max-width: 900px) {
  .hero {
    min-height: auto;
    align-items: flex-start;
    padding: 1.75rem 0 4rem;
  }

  .hero__container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.75rem;
    padding: 0 clamp(1.5rem, 5vw, 3rem);
    min-height: 0;
  }

  .hero__container::before {
    content: none;
  }

  .hero__visual {
    position: relative;
    order: 1;
    min-height: clamp(430px, 56vw, 500px);
    width: min(100%, 760px);
    height: auto;
    justify-self: center;
    margin: 0 auto;
  }

  .hero-scene {
    right: 50%;
    top: 50%;
    width: min(100%, 760px);
    height: min(100%, 500px);
    transform: translate(50%, -50%);
  }

  .hero__visual::before {
    inset: 0 4% 0;
  }

  .hero__content {
    order: 2;
    width: min(100%, 680px);
    max-width: 680px;
    justify-self: center;
    overflow: visible;
  }

  .hero__badge {
    margin-bottom: 1.5rem;
  }

  .hero__title {
    font-size: clamp(2rem, 5.1vw, 2.9rem);
    max-width: 680px;
    margin-bottom: 1.4rem;
  }

  .hero__chips {
    margin-bottom: 1.6rem;
  }

  .hero__actions {
    margin-bottom: 2.25rem;
  }

  .hero__stats {
    max-width: 520px;
  }

  .hero-orbits {
    right: -6%;
    top: 23%;
    width: 72%;
    height: 46%;
  }

  .hero-pen-wrap {
    left: auto;
    right: 12%;
    top: 8%;
    width: 36%;
    height: 72%;
  }

  .hero-platform {
    left: auto;
    right: 13%;
    width: 36%;
    bottom: 1%;
    height: 23%;
  }

  .hero-molecule--one {
    left: 15%;
    top: 8%;
    width: 24%;
  }

  .hero-molecule--two {
    right: 2%;
    top: 48%;
    width: 19%;
  }

  .hero-sphere--top {
    left: 39%;
    top: 15%;
  }

  .hero-sphere--right {
    right: 9%;
    top: 20%;
  }

  .hero-molecule--background {
    left: 36%;
    top: 34%;
  }

  .hero-sphere--orbit {
    left: 48%;
    bottom: 27%;
  }

  .hero-sphere--far-left {
    left: 25%;
    top: 21%;
  }

  .hero-sphere--far-right {
    right: -8%;
    bottom: 20%;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 0.35rem 0 2.75rem;
    min-height: auto;
    align-items: flex-start;
  }

  .hero__badge,
  .hero__title,
  .hero__desc,
  .hero__chips,
  .hero__actions,
  .hero__stats {
    animation: none;
  }

  .orb,
  .promo-orb {
    animation: none;
  }

  .hero__container {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.2rem;
    padding: 0 clamp(1rem, 4.5vw, 1.35rem);
    min-width: 0;
    min-height: 0;
  }

  .hero__container::before {
    content: '';
    position: absolute;
    left: -1.5rem;
    right: -1.5rem;
    top: clamp(220px, 54vw, 300px);
    height: clamp(210px, 48vw, 270px);
    z-index: 7;
    pointer-events: none;
    background:
      linear-gradient(
        180deg,
        rgba(7, 8, 14, 0) 0%,
        rgba(7, 8, 14, 0.58) 36%,
        rgba(7, 8, 14, 0.78) 58%,
        rgba(7, 8, 14, 0.18) 82%,
        rgba(7, 8, 14, 0) 100%
      ),
      linear-gradient(
        90deg,
        rgba(10, 22, 48, 0.14) 0%,
        rgba(7, 8, 14, 0.02) 38%,
        rgba(7, 8, 14, 0.34) 100%
      );
  }

  .hero__content {
    order: 2;
    width: 100%;
    max-width: 420px;
    justify-self: center;
    overflow: visible;
    margin-top: -0.45rem;
  }

  .hero-scene {
    right: 50%;
    top: 49%;
    width: min(100%, 430px);
    height: min(100%, 330px);
    transform: translate(50%, -50%);
  }

  .hero__visual {
    position: relative;
    order: 1;
    width: calc(100% + 2rem);
    max-width: none;
    min-height: clamp(292px, 72vw, 342px);
    height: auto;
    margin: 0 -1rem -0.2rem;
    overflow: visible;
  }

  .hero__visual::before {
    inset: 0 -10% 0;
    opacity: 0.75;
  }

  .hero__visual::after {
    content: '';
    position: absolute;
    inset: 0 0 -5.25rem;
    z-index: 6;
    pointer-events: none;
    background:
      linear-gradient(
        180deg,
        rgba(7, 8, 14, 0) 38%,
        rgba(7, 8, 14, 0.32) 64%,
        rgba(7, 8, 14, 0.82) 86%,
        rgba(7, 8, 14, 0) 100%
      ),
      linear-gradient(
        90deg,
        rgba(7, 8, 14, 0.34) 0%,
        rgba(7, 8, 14, 0.04) 26%,
        rgba(7, 8, 14, 0) 58%,
        rgba(7, 8, 14, 0.5) 100%
      );
  }

  .hero-orbits {
    right: 6%;
    top: 24%;
    width: 78%;
    height: 39%;
    transform:
      translate3d(
        var(--hero-idle-x),
        calc(var(--hero-idle-y) + (var(--hero-scroll-progress) * -90px)),
        0
      )
      rotate(var(--hero-idle-rotate))
      scale(calc(var(--hero-orbit-enter-scale) - (var(--hero-scroll-progress) * 0.12)));
  }

  .hero-orbit-image {
    width: 112%;
    left: 50%;
    top: 52%;
    opacity: 0.36;
  }

  .hero-molecule--two,
  .hero-sphere--right,
  .hero-sphere--far-left,
  .hero-sphere--far-right,
  .hero-molecule--background {
    display: none;
  }

  .hero-molecule--one {
    left: 12%;
    top: 20%;
    width: 92px;
    height: auto;
    opacity: 0.58;
  }

  .hero-molecule span {
    width: 24px;
    height: 24px;
  }

  .hero-molecule span:nth-child(1) {
    width: 36px;
    height: 36px;
  }

  .hero-sphere--top {
    left: auto;
    right: 18%;
    top: 18%;
    width: 48px;
    opacity: 0.6;
  }

  .hero-sphere--orbit {
    left: 50%;
    bottom: 28%;
    width: 46px;
    opacity: 0.42;
  }

  .hero-pen-wrap {
    left: 53%;
    right: auto;
    top: 3%;
    width: clamp(178px, 48vw, 218px);
    height: clamp(260px, 69vw, 318px);
    transform:
      translate3d(
        calc(-50% + var(--hero-idle-x)),
        calc(var(--hero-pen-enter-y) + var(--hero-idle-y) + (var(--hero-scroll-progress) * -165px)),
        80px
      )
      rotate(calc(10deg + var(--hero-idle-rotate)));
  }

  .hero-platform {
    left: 13%;
    right: auto;
    width: 76%;
    bottom: -28%;
    height: 34%;
    transform: translate3d(
      calc(var(--hero-platform-enter-x) + var(--hero-idle-x) + (var(--hero-scroll-progress) * 170px)),
      var(--hero-idle-y),
      0
    )
    rotate(var(--hero-idle-rotate));
  }

  .hero-platform img {
    width: 108%;
  }

  .floating-elements {
    display: none;
  }

  .hero__badge {
    padding: 0.46rem 0.8rem;
    font-size: clamp(0.58rem, 2.8vw, 0.66rem);
    gap: 0.52rem;
    max-width: 100%;
    margin-bottom: 0.9rem;
    letter-spacing: 0.055em;
  }

  .hero__title {
    font-size: clamp(1.5rem, 6.35vw, 1.82rem);
    line-height: 1.08;
    width: min(100%, 370px);
    max-width: 100%;
    overflow-wrap: break-word;
    text-wrap: balance;
    margin-bottom: 1.15rem;
  }

  .hero-title-break {
    display: block;
  }

  .hero-title-mobile-break {
    display: block;
  }

  .hero__title .accent {
    display: block;
  }

  .hero__desc {
    font-size: 0.98rem;
    line-height: 1.55;
    margin-bottom: 2rem;
  }

  .hero__chips {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
    max-width: 100%;
    margin-bottom: 1.25rem;
  }

  .hero-chip {
    width: 100%;
    max-width: 100%;
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(0.52rem, 2.45vw, 0.6rem);
    padding: 0.36rem 0.52rem;
    letter-spacing: 0.03em;
    text-align: center;
  }

  .hero__stats {
    width: 100%;
    max-width: 360px;
    gap: 0.35rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow: hidden;
  }

  .stat-value {
    font-size: clamp(1.42rem, 6.8vw, 1.76rem);
  }

  .stat-label {
    font-size: clamp(0.5rem, 2.25vw, 0.6rem);
    letter-spacing: 0.04em;
    white-space: normal;
  }

  .hero__actions {
    width: 100%;
    max-width: 100%;
    flex-direction: column;
    gap: 0.62rem;
    margin-bottom: 1.6rem;
  }

  .hero__actions .btn {
    width: 100%;
    box-sizing: border-box;
    justify-content: center;
  }

  .feature-card,
  .btn {
    padding: 0.78rem 1.25rem;
    font-size: 0.82rem;
  }

  .features {
    padding: 4rem 0;
  }

  .home-global-decor__item--molecule-2,
  .home-global-decor__item--molecule-4,
  .home-global-decor__item--molecule-5,
  .home-global-decor__item--drop-2,
  .home-global-decor__item--drop-4,
  .home-global-decor__item--drop-6 {
    display: none;
  }

  .home-global-decor::before {
    background-size: 72px 72px;
    opacity: 0.72;
  }

  .home-global-decor__item--molecule-1 {
    width: 138px;
    right: -42px;
    top: 24%;
    opacity: 0.16;
  }

  .home-global-decor__item--molecule-3 {
    width: 120px;
    right: -24px;
    top: 61%;
    opacity: 0.18;
  }

  .home-global-decor__item--drop-1,
  .home-global-decor__item--drop-3,
  .home-global-decor__item--drop-5 {
    opacity: 0.16;
  }

  .section-decor__molecule--features-main,
  .section-decor__molecule--categories-main {
    width: 140px;
    opacity: 0.24;
  }

  .section-decor__molecule--features-soft,
  .section-decor__molecule--categories-soft,
  .section-decor__drop--features-low,
  .section-decor__drop--categories-mid {
    display: none;
  }

  .section-decor__drop--features-top,
  .section-decor__drop--categories-top,
  .section-decor__drop--categories-low {
    opacity: 0.2;
  }

  .features-panel,
  .featured-grid {
    grid-template-columns: 1fr;
  }

  .features-lead {
    padding: 1.4rem;
  }

  .features-metrics {
    grid-template-columns: 1fr;
  }

  .features-cards {
    grid-template-columns: 1fr;
  }

  .categories-lab {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .categories-lab__panel {
    padding: 1.2rem 1rem;
  }

  .categories-lab__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .categories-lane {
    grid-template-columns: 1fr;
    align-items: start;
    padding: 0.95rem;
  }

  .category-lane:hover {
    transform: none;
  }

  .category-lane__left {
    grid-template-columns: 46px 1fr;
    gap: 0.65rem;
  }

  .category-lane__icon {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }

  .category-lane h4 {
    font-size: 0.95rem;
  }

  .category-lane p {
    font-size: 0.79rem;
  }

  .category-lane__right {
    margin-top: 0.55rem;
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    text-align: left;
  }

  .featured-products {
    padding: 0 0 2rem;
  }

  .featured-products .section-header {
    margin-bottom: 1rem;
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

  .categories-lab__panel p {
    font-size: 0.85rem;
    line-height: 1.55;
  }

  .cta {
    padding: 1rem 0 3rem;
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

  .timeline-item {
    grid-template-columns: 52px 1fr;
    padding: 0.85rem;
  }

  .timeline-index {
    font-size: 1rem;
  }

  .timeline-content h3 {
    font-size: 0.95rem;
  }

  .timeline-content p {
    font-size: 0.84rem;
  }

  .partnership-teaser {
    padding: 0 0 3rem;
  }

  .partnership-teaser__inner {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1.15rem;
    border-radius: 18px;
  }

  .partnership-teaser__stats {
    grid-template-columns: 1fr;
  }

  .partnership-teaser__stats div {
    min-height: auto;
    padding: 0.9rem;
  }

  .partnership-teaser__button {
    width: 100%;
  }

  .promo-banner {
    padding: 3rem 0;
    margin: 2rem 0 4rem;
  }

  .promo-bg {
    clip-path: none;
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

  .home-faq {
    padding: 1rem 0 3rem;
  }

  .home-faq__layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .home-faq__intro {
    position: relative;
    top: auto;
    padding: 1.35rem;
    border-radius: 20px;
  }

  .home-faq__intro h2 {
    font-size: 1.55rem;
  }

  .home-faq__item {
    border-radius: 16px;
  }

  .home-faq__item summary {
    padding: 1rem;
    font-size: 0.92rem;
  }

  .home-faq__answer {
    padding: 0 1rem;
    font-size: 0.86rem;
  }

  .home-faq__item[open] .home-faq__answer {
    padding-bottom: 1rem;
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

@media (min-width: 641px) and (max-width: 900px) {
  .hero {
    min-height: auto;
    align-items: flex-start;
    padding: 1.75rem 0 4rem;
  }

  .hero__container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.75rem;
    padding: 0 clamp(1.5rem, 5vw, 3rem);
    min-height: 0;
  }

  .hero__container::before {
    content: none;
  }

  .hero__visual {
    position: relative;
    order: 1;
    min-height: clamp(430px, 56vw, 500px);
    width: min(100%, 760px);
    height: auto;
    justify-self: center;
    margin: 0 auto;
    overflow: hidden;
  }

  .hero-scene {
    right: 50%;
    top: 50%;
    width: min(100%, 760px);
    height: min(100%, 500px);
    transform: translate(50%, -50%);
  }

  .hero__visual::before {
    inset: 0 4% 0;
  }

  .hero__content {
    order: 2;
    width: min(100%, 680px);
    max-width: 680px;
    justify-self: center;
    overflow: visible;
  }

  .hero__badge {
    margin-bottom: 1.5rem;
  }

  .hero__title {
    font-size: clamp(2rem, 5.1vw, 2.9rem);
    max-width: 680px;
    margin-bottom: 1.4rem;
    overflow-wrap: normal;
  }

  .hero__chips {
    display: flex;
    margin-bottom: 1.6rem;
  }

  .hero__actions {
    width: auto;
    max-width: none;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-bottom: 2.25rem;
  }

  .hero__actions .btn {
    width: auto;
    min-width: 205px;
  }

  .hero__stats {
    max-width: 520px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .stat-value {
    font-size: 2.1rem;
  }

  .hero-orbits {
    right: -6%;
    top: 23%;
    width: 72%;
    height: 46%;
  }

  .hero-molecule--two,
  .hero-molecule--background,
  .hero-sphere--right,
  .hero-sphere--orbit,
  .hero-sphere--far-left,
  .hero-sphere--far-right {
    display: block;
  }

  .hero-pen-wrap {
    left: auto;
    right: 12%;
    top: 8%;
    width: 36%;
    height: 72%;
    transform:
      translate3d(
        var(--hero-idle-x),
        calc(var(--hero-pen-enter-y) + var(--hero-idle-y) + (var(--hero-scroll-progress) * -220px)),
        80px
      )
      rotate(calc(-9deg + var(--hero-idle-rotate)));
  }

  .hero-platform {
    left: auto;
    right: 4%;
    width: 57%;
    bottom: 1%;
    height: 33%;
  }

  .hero-platform img {
    width: 100%;
  }

  .hero-molecule--one {
    left: 15%;
    top: 8%;
    width: 24%;
  }

  .hero-molecule--two {
    right: 2%;
    top: 48%;
    width: 19%;
  }

  .hero-sphere--top {
    left: 39%;
    top: 15%;
    width: clamp(50px, 7vw, 70px);
  }

  .hero-sphere--right {
    right: 9%;
    top: 20%;
    width: clamp(86px, 13vw, 118px);
  }

  .hero-sphere--orbit {
    left: 48%;
    bottom: 27%;
    width: clamp(56px, 8vw, 78px);
  }

  .hero-sphere--far-left {
    left: 25%;
    top: 21%;
    width: clamp(74px, 10vw, 96px);
  }

  .hero-sphere--far-right {
    right: -8%;
    bottom: 20%;
    width: clamp(106px, 14vw, 136px);
  }

  .hero-molecule--background {
    left: 36%;
    top: 34%;
    width: clamp(72px, 10vw, 96px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-pen-wrap,
  .hero-orbits,
  .hero-orbit,
  .hero-platform::before,
  .hero-platform,
  .platform-ring,
  .hero-molecule,
  .hero-sphere {
    animation: none;
  }
}

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
  background: linear-gradient(90deg, transparent, rgba(166, 185, 248, 0.05), transparent);
  transition: left 0.5s ease;
}

.feature-card:hover::before {
  left: 100%;
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
