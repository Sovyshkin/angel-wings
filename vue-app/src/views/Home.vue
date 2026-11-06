<template>
  <div class="home">
    <section ref="heroRoot" class="hero hero--neon" :class="{ 'is-assembly-pending': !heroMotionReady, 'is-background-paused': heroFxPaused }">
      <div class="hero-neon__background hero-neon__background--dark" aria-hidden="true"></div>
      <div class="hero-neon__background hero-neon__background--light" aria-hidden="true"></div>
      <div class="hero-neon__background-fx" aria-hidden="true">
        <div class="hero-neon__comets">
          <span v-for="comet in heroComets" :key="comet.id" class="hero-neon__comet" :style="comet.style"></span>
        </div>
        <div class="hero-neon__stars">
          <span v-for="star in heroStars" :key="star.id" class="hero-neon__star" :style="star.style"></span>
        </div>
        <div class="hero-neon__light-fx">
          <div class="hero-neon__light-sparks">
            <span v-for="index in 7" :key="index" class="hero-neon__light-spark"></span>
          </div>
          <div class="hero-neon__light-grid-glints">
            <span v-for="index in 6" :key="index" class="hero-neon__light-grid-glint"></span>
          </div>
        </div>
      </div>
      <div ref="heroScene" class="hero-neon__scene" aria-hidden="true">
        <div class="hero-neon__floor-light"></div>
        <div class="hero-neon__assembly hero-neon__assembly--molecule-top" data-assembly="molecule-top"><img class="hero-neon__object hero-neon__object--molecule-top hero-neon__object--theme-dark" src="/hero-assets/neon-lab-molecule-top.webp" alt="" width="512" height="512" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--molecule-top hero-neon__object--theme-light" src="/hero-assets/neon-lab-light-molecule-top.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--molecule-mid" data-assembly="molecule-mid"><img class="hero-neon__object hero-neon__object--molecule-mid hero-neon__object--theme-dark" src="/hero-assets/neon-lab-molecule-mid.webp" alt="" width="512" height="512" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--molecule-mid hero-neon__object--theme-light" src="/hero-assets/neon-lab-light-molecule-mid.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--molecule-right" data-assembly="molecule-right"><img class="hero-neon__object hero-neon__object--molecule-right hero-neon__object--theme-dark" src="/hero-assets/neon-lab-molecule-right.webp" alt="" width="512" height="512" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--molecule-right hero-neon__object--theme-light" src="/hero-assets/neon-lab-light-molecule-right.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--sphere-top" data-assembly="sphere-top"><img class="hero-neon__object hero-neon__object--sphere-top hero-neon__object--theme-dark" src="/hero-assets/neon-lab-sphere-top.webp" alt="" width="384" height="384" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--sphere-top hero-neon__object--theme-light" src="/hero-assets/neon-lab-light-sphere-top.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--sphere-right" data-assembly="sphere-right"><img class="hero-neon__object hero-neon__object--sphere-right hero-neon__object--theme-dark" src="/hero-assets/neon-lab-sphere-right.webp" alt="" width="384" height="384" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--sphere-right hero-neon__object--theme-light" src="/hero-assets/neon-lab-light-sphere-right.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--sphere-small" data-assembly="sphere-small"><img class="hero-neon__object hero-neon__object--sphere-small hero-neon__object--theme-dark" src="/hero-assets/neon-lab-sphere-small.webp" alt="" width="384" height="384" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--sphere-small hero-neon__object--theme-light" src="/hero-assets/neon-lab-light-sphere-small.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--bubbles-left" data-assembly="bubbles-left"><img class="hero-neon__object hero-neon__object--bubbles-left hero-neon__object--theme-dark" src="/hero-assets/neon-lab-bubbles-left.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--bubbles-left hero-neon__object--theme-light" src="/hero-assets/neon-lab-light-bubbles.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--bubbles-right" data-assembly="bubbles-right"><img class="hero-neon__object hero-neon__object--bubbles-right hero-neon__object--theme-dark" src="/hero-assets/neon-lab-bubbles-right.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--bubbles-right hero-neon__object--theme-light" src="/hero-assets/neon-lab-light-bubbles.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__assembly hero-neon__assembly--podium" data-assembly="podium"><img class="hero-neon__object hero-neon__object--podium hero-neon__object--theme-dark" src="/hero-assets/neon-lab-podium.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"><img class="hero-neon__object hero-neon__object--podium hero-neon__object--theme-light" src="/hero-assets/neon-lab-light-podium.webp" alt="" width="1254" height="1254" loading="eager" decoding="async"></div>
        <div class="hero-neon__energy" aria-hidden="true"></div>
        <div class="hero-neon__assembly hero-neon__assembly--pen" data-assembly="pen"><img class="hero-neon__object hero-neon__object--pen" src="/hero-assets/ручка-720.webp" alt="" width="720" height="1080" loading="eager" decoding="async" fetchpriority="high"></div>
      </div>
      <div class="hero-neon__content">
          <div class="hero-neon__badge"><span class="hero-neon__dot"></span>Высокочистые пептиды</div>
          <h1 class="hero-neon__title">
            <span>Единственный</span>{{ ' ' }}
            <span>производитель</span>{{ ' ' }}
            <span>пептидов с действующей</span>{{ ' ' }}
            <span class="hero-neon__accent">фармацевтической</span>{{ ' ' }}
            <span class="hero-neon__accent">лицензией</span>
          </h1>
          <div class="hero-neon__chips">
            <span class="hero-neon__chip"><span class="hero-neon__dot"></span>IN VITRO ONLY</span>
            <span class="hero-neon__chip"><span class="hero-neon__dot"></span>Фармлицензия</span>
            <span class="hero-neon__chip"><span class="hero-neon__dot"></span>Контроль партий</span>
          </div>
          <div class="hero-neon__actions">
            <router-link to="/catalog" class="hero-neon__button hero-neon__button--primary">
              Перейти в каталог
              <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </router-link>
            <a href="#features" class="hero-neon__button hero-neon__button--secondary">Узнать больше</a>
            <a href="/pharmaceutical-license.pdf" class="hero-neon__button hero-neon__button--license" target="_blank" rel="noopener">
              Лицензия PDF
              <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M9 15h6M9 18h4"/>
              </svg>
            </a>
          </div>
      </div>
    </section>

    <main ref="homeSectionsRoot" class="home-sections">
      <div class="home-sections__blend" aria-hidden="true"></div>
      <BackgroundScene :height="sceneHeight" />

    <section class="features" id="features" data-aos="fade-up" data-aos-offset="100">
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
                  :aria-label="hasDosages(product) ? 'Выбрать дозировку' : 'Добавить в корзину'"
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

    <ConsultationSection />

    <section class="cta" data-aos="zoom-in" data-aos-offset="100">
      <div class="container">
        <div class="cta__inner">
          <div class="cta__content">
            <div class="cta__meta" aria-label="Закрытый чат и канал">
              <img src="/consultation-cta-assets/telegram-plane.png" alt="" aria-hidden="true" width="1254" height="1254">
              <span>ЗАКРЫТЫЙ ЧАТ <b>•</b> КАНАЛ</span>
              <i aria-hidden="true"></i>
              <i aria-hidden="true"></i>
              <i aria-hidden="true"></i>
            </div>
            <h2>Наш чат и канал <em>закрыты</em></h2>
            <p>Вступай, чтобы получить доступ к закрытому чату и каналу</p>
            <div class="cta__actions">
              <a
                href="https://t.me/+G8SAtpWBSFAzZDcy"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-primary cta__contact-btn"
              >
                <img src="/consultation-cta-assets/telegram-plane.png" alt="" aria-hidden="true" width="1254" height="1254">
                <span>Вступить в чат</span>
                <img class="cta__button-arrow" src="/consultation-cta-assets/arrow.png" alt="" aria-hidden="true" width="1254" height="1254">
              </a>
              <a
                href="https://t.me/+UwZu11Bt55FhNTIy"
                target="_blank"
                rel="noopener noreferrer"
                class="btn cta__chat-btn"
              >
                <img src="/consultation-cta-assets/telegram-plane.png" alt="" aria-hidden="true" width="1254" height="1254">
                <span>Подписаться на канал</span>
                <img class="cta__button-arrow" src="/consultation-cta-assets/arrow.png" alt="" aria-hidden="true" width="1254" height="1254">
              </a>
            </div>
          </div>
          <div class="cta__decoration" aria-hidden="true">
            <div class="cta__aura"></div>
            <img class="cta__asset cta__asset--orbit" src="/consultation-cta-assets/orbit.png" alt="" width="1254" height="1254">
            <img class="cta__asset cta__asset--chat-bars" src="/consultation-cta-assets/chat-bars.png" alt="" width="1254" height="1254">
            <img class="cta__asset cta__asset--users cta__asset--users-left" src="/consultation-cta-assets/users.png" alt="" width="1254" height="1254">
            <img class="cta__asset cta__asset--telegram" src="/consultation-cta-assets/telegram-glass.png" alt="" width="1254" height="1254">
            <img class="cta__asset cta__asset--chat-dots" src="/consultation-cta-assets/chat-dots.png" alt="" width="1254" height="1254">
            <img class="cta__asset cta__asset--users cta__asset--users-right" src="/consultation-cta-assets/users.png" alt="" width="1254" height="1254">
            <img class="cta__asset cta__asset--plane" src="/consultation-cta-assets/telegram-plane.png" alt="" width="1254" height="1254">
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
    </main>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../store/products'
import { useCartStore } from '../store/cart'
import { trackProductEvent } from '../api/analytics'
import ConsultationSection from '../components/ConsultationSection.vue'
import BackgroundScene from '../components/BackgroundScene.vue'

const productStore = useProductStore()
const cartStore = useCartStore()
const router = useRouter()
const DISPLAY_CATEGORY_SLUGS = ['longevitiya', 'immunomodulyatory', 'neiropeptide', 'growth']
const homeSectionsRoot = ref(null)
const catalogPreview = ref(null)
const heroRoot = ref(null)
const heroScene = ref(null)
const heroMotionReady = ref(false)
const heroFxPaused = ref(false)
const heroAnimations = new Set()
let heroMotionStarted = false
let heroIsUnmounted = false
const heroComets = [
  { id: 'c1', style: { '--fx-top': '12%', '--fx-right': '-15%', '--fx-length': '166px', '--fx-distance-x': '-64vw', '--fx-distance-y': '33vh', '--fx-angle': '-27deg', '--fx-cycle': '13s', '--fx-delay': '3.1s', '--fx-peak': '.66' } },
  { id: 'c2', style: { '--fx-top': '26%', '--fx-right': '-20%', '--fx-length': '114px', '--fx-distance-x': '-60vw', '--fx-distance-y': '26vh', '--fx-angle': '-23deg', '--fx-cycle': '17s', '--fx-delay': '6.7s', '--fx-peak': '.5' } },
  { id: 'c3', style: { '--fx-top': '5%', '--fx-right': '-17%', '--fx-length': '205px', '--fx-distance-x': '-62vw', '--fx-distance-y': '39vh', '--fx-angle': '-32deg', '--fx-cycle': '21s', '--fx-delay': '10.3s', '--fx-peak': '.56' } },
  { id: 'c4', style: { '--fx-top': '35%', '--fx-right': '-13%', '--fx-length': '92px', '--fx-distance-x': '-55vw', '--fx-distance-y': '22vh', '--fx-angle': '-20deg', '--fx-cycle': '24s', '--fx-delay': '14.2s', '--fx-peak': '.42' } }
]
const heroStars = [
  { id: 's1', style: { '--fx-top': '13%', '--fx-right': '15%', '--fx-distance-x': '-110px', '--fx-distance-y': '58px', '--fx-angle': '-28deg', '--fx-cycle': '10s', '--fx-delay': '4.2s' } },
  { id: 's2', style: { '--fx-top': '31%', '--fx-right': '33%', '--fx-distance-x': '-85px', '--fx-distance-y': '44px', '--fx-angle': '-27deg', '--fx-cycle': '13s', '--fx-delay': '7.9s' } },
  { id: 's3', style: { '--fx-top': '8%', '--fx-right': '41%', '--fx-distance-x': '-65px', '--fx-distance-y': '32px', '--fx-angle': '-24deg', '--fx-cycle': '17s', '--fx-delay': '11.4s' } },
  { id: 's4', style: { '--fx-top': '22%', '--fx-right': '8%', '--fx-distance-x': '-95px', '--fx-distance-y': '52px', '--fx-angle': '-29deg', '--fx-cycle': '19s', '--fx-delay': '5.8s' } },
  { id: 's5', style: { '--fx-top': '42%', '--fx-right': '22%', '--fx-distance-x': '-80px', '--fx-distance-y': '41px', '--fx-angle': '-25deg', '--fx-cycle': '22s', '--fx-delay': '12.6s' } },
  { id: 's6', style: { '--fx-top': '17%', '--fx-right': '48%', '--fx-distance-x': '-68px', '--fx-distance-y': '35px', '--fx-angle': '-31deg', '--fx-cycle': '24s', '--fx-delay': '8.6s' } },
  { id: 's7', style: { '--fx-top': '36%', '--fx-right': '4%', '--fx-distance-x': '-102px', '--fx-distance-y': '54px', '--fx-angle': '-25deg', '--fx-cycle': '27s', '--fx-delay': '16.1s' } },
  { id: 's8', style: { '--fx-top': '6%', '--fx-right': '26%', '--fx-distance-x': '-73px', '--fx-distance-y': '39px', '--fx-angle': '-29deg', '--fx-cycle': '29s', '--fx-delay': '19.3s' } }
]
let catalogObserver = null
let catalogFallbackTimer = null
let catalogLoaded = false
let sceneResizeObserver = null
let sceneAnchorFrame = null

const sceneSections = ['features', 'categories-preview', 'featured-products', 'consultation-section', 'cta', 'benefits', 'partnership-teaser', 'home-faq', 'newsletter']
const sceneHeight = ref(0)

function updateSceneAnchors() {
  sceneAnchorFrame = null
  if (homeSectionsRoot.value) sceneHeight.value = homeSectionsRoot.value.offsetHeight
}

function scheduleSceneAnchors() {
  if (sceneAnchorFrame) return
  sceneAnchorFrame = window.requestAnimationFrame(updateSceneAnchors)
}

function setupSceneAnchors() {
  const root = homeSectionsRoot.value
  if (!root) return
  scheduleSceneAnchors()
  if ('ResizeObserver' in window) {
    sceneResizeObserver = new ResizeObserver(scheduleSceneAnchors)
    sceneResizeObserver.observe(root)
    sceneSections.forEach(className => {
      const section = root.querySelector(`.${className}`)
      if (section) sceneResizeObserver.observe(section)
    })
  }
  window.addEventListener('resize', scheduleSceneAnchors, { passive: true })
}

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
    productStore.fetchProducts('', { featured: true, limit: 4 }),
    productStore.fetchCategories()
  ])
}

onMounted(() => {
  setupSceneAnchors()
  document.addEventListener('visibilitychange', syncHeroAnimationVisibility)
  syncHeroAnimationVisibility()
  startHeroAssembly()

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
  heroIsUnmounted = true
  document.removeEventListener('visibilitychange', syncHeroAnimationVisibility)
  heroAnimations.forEach(animation => animation.cancel())
  heroAnimations.clear()
  catalogObserver?.disconnect()
  sceneResizeObserver?.disconnect()
  window.removeEventListener('resize', scheduleSceneAnchors)
  if (sceneAnchorFrame) window.cancelAnimationFrame(sceneAnchorFrame)
  if (catalogFallbackTimer) window.clearTimeout(catalogFallbackTimer)
})

// One master schedule, implemented with the browser's composited animations.
// The full-scene wrappers move while their images keep the original positioning.
function startHeroAssembly() {
  if (heroMotionStarted) return
  heroMotionStarted = true
  const root = heroRoot.value
  const scene = heroScene.value
  if (!root || !scene || !Element.prototype.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroMotionReady.value = true
    return
  }

  try {
    const sceneRect = scene.getBoundingClientRect()
    const mobile = window.matchMedia('(max-width: 767px)').matches
    const tablet = !mobile && window.matchMedia('(max-width: 1100px)').matches
    const tempo = mobile ? 0.66 : tablet ? 0.85 : 1
    const sceneDelay = mobile ? 0.65 : 0
    const power3 = 'cubic-bezier(0.22, 1, 0.36, 1)'
    const power2 = 'cubic-bezier(0.3, 0.8, 0.4, 1)'
    const intro = []

    function run(target, from, delay, duration, easing = power3, to = { transform: 'none', opacity: 1 }) {
      if (!target) return
      target.style.willChange = 'transform, opacity'
      const animation = target.animate([from, to], {
        delay: delay * tempo * 1000,
        duration: duration * tempo * 1000,
        easing,
        fill: 'both'
      })
      heroAnimations.add(animation)
      animation.addEventListener('finish', () => {
        target.style.willChange = ''
        heroAnimations.delete(animation)
        animation.cancel()
      }, { once: true })
      intro.push(animation.finished.catch(() => {}))
      return animation
    }

    function layer(name) {
      const wrapper = scene.querySelector(`[data-assembly="${name}"]`)
      const image = wrapper?.querySelector('img')
      if (!wrapper || !image) return null
      const rect = image.getBoundingClientRect()
      wrapper.style.transformOrigin = `${rect.left + rect.width / 2 - sceneRect.left}px ${rect.top + rect.height / 2 - sceneRect.top}px`
      return { wrapper, rect }
    }

    const podium = layer('podium')
    const pen = layer('pen')
    const topMolecule = layer('molecule-top')
    const midMolecule = layer('molecule-mid')
    const rightMolecule = layer('molecule-right')
    const leftBubbles = layer('bubbles-left')
    const rightBubbles = layer('bubbles-right')
    const topSphere = layer('sphere-top')
    const rightSphere = layer('sphere-right')
    const smallSphere = layer('sphere-small')

    if (podium) run(podium.wrapper, { transform: `translate3d(${Math.ceil(sceneRect.right - podium.rect.left + 24)}px, 20px, 0) scale(.88)`, opacity: 1 }, .15 + sceneDelay, 1.35)
    if (pen) run(pen.wrapper, { transform: `translate3d(38px, ${Math.floor(sceneRect.top - pen.rect.bottom - 24)}px, 0) rotate(8deg) scale(1.05)`, opacity: 1 }, .4 + sceneDelay, 1.5)
    if (topMolecule) run(topMolecule.wrapper, { transform: 'translate3d(35px, -120px, 0) rotate(-12deg) scale(.35)', opacity: 0 }, .65 + sceneDelay, 1.2)
    if (midMolecule) run(midMolecule.wrapper, { transform: 'translate3d(100px, 0, 0) rotate(9deg) scale(.45)', opacity: 0 }, .9 + sceneDelay, 1.1, power2)
    if (rightMolecule) run(rightMolecule.wrapper, { transform: `translate3d(${Math.ceil(sceneRect.right - rightMolecule.rect.left + 20)}px, 0, 0) rotate(-15deg) scale(.8)`, opacity: 1 }, 1.05 + sceneDelay, 1.1)
    if (leftBubbles) run(leftBubbles.wrapper, { transform: `translate3d(${Math.floor(sceneRect.left - leftBubbles.rect.right - 24)}px, 0, 0) scale(1.12)`, opacity: 1 }, .9 + sceneDelay, 1.2)
    if (rightBubbles) run(rightBubbles.wrapper, { transform: `translate3d(${Math.ceil(sceneRect.right - rightBubbles.rect.left + 24)}px, 30px, 0) scale(1.08)`, opacity: 1 }, 1.1 + sceneDelay, 1.25)
    if (topSphere) run(topSphere.wrapper, { transform: 'translate3d(70px, -50px, 0) scale(.6)', opacity: 0 }, 1.12 + sceneDelay, .85, power2)
    if (rightSphere) run(rightSphere.wrapper, { transform: 'translate3d(80px, 35px, 0) scale(.6)', opacity: 0 }, 1.25 + sceneDelay, .85, power2)
    if (smallSphere) run(smallSphere.wrapper, { transform: 'translate3d(-35px, -65px, 0) scale(.6)', opacity: 0 }, 1.38 + sceneDelay, .8, power2)

    run(root.querySelector('.hero-neon__badge'), { transform: 'translateY(16px)', opacity: 0 }, mobile ? .05 : .1, .65, power2)
    run(root.querySelector('.hero-neon__title'), { transform: 'translateY(16px)', opacity: 0 }, mobile ? .2 : .25, .75, power2)
    run(root.querySelector('.hero-neon__chips'), { transform: 'translateY(16px)', opacity: 0 }, mobile ? .45 : .55, .65, power2)
    run(root.querySelector('.hero-neon__actions'), { transform: 'translateY(16px)', opacity: 0 }, mobile ? 2.65 : .75, .65, power2)

    const energy = scene.querySelector('.hero-neon__energy')
    if (energy) {
      const pulse = energy.animate([{ opacity: 0 }, { opacity: .82, offset: .36 }, { opacity: 0 }], {
        delay: (1.95 + sceneDelay) * tempo * 1000,
        duration: .65 * tempo * 1000,
        easing: 'ease-in-out',
        fill: 'both'
      })
      heroAnimations.add(pulse)
      pulse.addEventListener('finish', () => { heroAnimations.delete(pulse); pulse.cancel() }, { once: true })
      intro.push(pulse.finished.catch(() => {}))
    }

    heroMotionReady.value = true
    syncHeroAnimationVisibility()
    Promise.all(intro).then(() => {
      if (heroIsUnmounted || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      startHeroIdle(scene, mobile)
    })
  } catch (error) {
    heroAnimations.forEach(animation => animation.cancel())
    heroAnimations.clear()
    heroMotionReady.value = true
    console.warn('[Hero] Assembly animation unavailable:', error)
  }
}

function startHeroIdle(scene, mobile) {
  const easing = 'ease-in-out'
  const idle = [
    ['pen', mobile ? -10 : -16, mobile ? 2 : 4, 6000],
    ['molecule-top', mobile ? -12 : -20, mobile ? -3 : -5, 7800],
    ['molecule-mid', mobile ? 10 : 17, mobile ? 2 : 5, 9200],
    ['molecule-right', mobile ? -9 : -15, mobile ? 3 : 6, 8400],
    ['sphere-top', mobile ? -11 : -18, mobile ? -2 : -4, 7100],
    ['sphere-right', mobile ? 9 : 15, mobile ? 2 : 4, 8800],
    ['sphere-small', mobile ? -8 : -13, mobile ? 2 : 4, 6600]
  ]
  for (const [name, y, x, duration] of idle) {
    const target = scene.querySelector(`[data-assembly="${name}"]`)
    if (!target) continue
    const animation = target.animate([
      { transform: 'translate3d(0, 0, 0)' },
      { transform: `translate3d(${x}px, ${y}px, 0)` },
      { transform: 'translate3d(0, 0, 0)' }
    ], { duration, iterations: Infinity, easing })
    heroAnimations.add(animation)
  }
  syncHeroAnimationVisibility()
}

function syncHeroAnimationVisibility() {
  heroFxPaused.value = document.hidden
  for (const animation of heroAnimations) {
    if (document.hidden) animation.pause()
    else if (animation.playState === 'paused') animation.play()
  }
}

function handleImageError(e) {
  const img = e.target
  if (img.dataset.fallbackApplied === 'true') return
  img.dataset.fallbackApplied = 'true'
  img.src = '/angel-wings-logo-light.svg'
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

function hasDosages(product) {
  return Array.isArray(product?.specs?.dosages) && product.specs.dosages.length > 0
}

function increaseFeaturedQty(product) {
  if (hasDosages(product)) {
    router.push(`/product/${product.id}`)
    return
  }
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
  --molecule-parallax-up: 0px;
  --molecule-parallax-up-soft: 0px;
  --molecule-parallax-down: 0px;
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

.home-sections {
  position: relative;
  z-index: 1;
  isolation: isolate;
  overflow: clip;
  background: linear-gradient(180deg, #020817 0%, #041127 42%, #031023 70%, #020817 100%);
}


.home-sections__blend {
  position: absolute;
  z-index: 1;
  inset: 0 0 auto;
  height: 230px;
  background: linear-gradient(180deg, #020817 0%, rgba(2, 8, 23, 0) 100%);
  pointer-events: none;
}

.home-sections > section {
  position: relative;
  z-index: 2;
}

.home-sections :deep(.consultation-section) {
  background: transparent;
}

.home-sections :deep(.consultation-section::before),
.home-sections :deep(.consultation-section__glow),
.home-sections :deep(.consultation-section__orb) {
  display: none;
}

.home-global-decor {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  user-select: none;
  overflow: visible;
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

.home-global-decor__item[class*="--molecule-"],
.section-decor__molecule {
  --molecule-base-rotate: 0deg;
  --molecule-idle-x: 26px;
  --molecule-idle-y: -38px;
  translate: 0 var(--molecule-shift, 0px);
  transform: rotate(var(--molecule-base-rotate));
  will-change: translate, transform;
}

.home-global-decor__item[class*="--molecule-"].is-ambient-active,
.section-decor__molecule.is-ambient-active {
  animation: ambientMoleculeFloat 10s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
}

.home-global-decor__item[class*="--drop-"],
.section-decor__drop {
  --drop-idle-x: 18px;
  --drop-idle-y: -26px;
  --drop-base-rotate: 0deg;
  transform: rotate(var(--drop-base-rotate));
  will-change: transform;
}

.home-global-decor__item[class*="--drop-"].is-ambient-active,
.section-decor__drop.is-ambient-active {
  animation: ambientDropFloat 12s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite alternate;
}

.home-global-decor__item--molecule-1 {
  --molecule-shift: var(--molecule-parallax-up);
  --molecule-idle-x: 32px;
  --molecule-idle-y: -44px;
  width: clamp(150px, 12vw, 240px);
  right: -4%;
  top: 18%;
  opacity: 0.22;
  filter: saturate(0.96) drop-shadow(0 0 14px rgba(44, 133, 255, 0.14));
}

.home-global-decor__item--molecule-2 {
  --molecule-shift: var(--molecule-parallax-down);
  --molecule-idle-x: -38px;
  --molecule-idle-y: 34px;
  width: clamp(170px, 14vw, 280px);
  left: -5%;
  top: 33%;
  opacity: 0.18;
  filter: saturate(0.9) drop-shadow(0 0 14px rgba(44, 133, 255, 0.12));
  animation-duration: 11s;
  animation-delay: -6s;
}

.home-global-decor__item--molecule-3 {
  --molecule-shift: var(--molecule-parallax-up-soft);
  --molecule-idle-x: 28px;
  --molecule-idle-y: -36px;
  width: clamp(120px, 10vw, 200px);
  right: 13%;
  top: 47%;
  opacity: 0.26;
  filter: saturate(1.05) drop-shadow(0 0 16px rgba(44, 133, 255, 0.16));
  animation-duration: 9s;
  animation-delay: -3s;
}

.home-global-decor__item--molecule-4 {
  --molecule-shift: var(--molecule-parallax-down);
  --molecule-idle-x: -34px;
  --molecule-idle-y: 42px;
  width: clamp(150px, 13vw, 260px);
  left: 8%;
  top: 68%;
  opacity: 0.16;
  filter: saturate(0.88) drop-shadow(0 0 12px rgba(44, 133, 255, 0.1));
  animation-duration: 12s;
  animation-delay: -10s;
}

.home-global-decor__item--molecule-5 {
  --molecule-shift: var(--molecule-parallax-up);
  --molecule-idle-x: 36px;
  --molecule-idle-y: -38px;
  width: clamp(150px, 12vw, 245px);
  right: -3%;
  top: 84%;
  opacity: 0.2;
  filter: saturate(0.98) drop-shadow(0 0 14px rgba(44, 133, 255, 0.12));
  animation-duration: 11s;
  animation-delay: -8s;
}

.home-global-decor__item--molecule-6 {
  --molecule-shift: var(--molecule-parallax-down);
  --molecule-idle-x: -30px;
  --molecule-idle-y: 36px;
  width: clamp(118px, 10vw, 190px);
  right: 31%;
  top: 58%;
  opacity: 0.24;
  filter: saturate(1.02) drop-shadow(0 0 15px rgba(44, 133, 255, 0.14));
  animation-duration: 10s;
  animation-delay: -5s;
}

.home-global-decor__item--molecule-7 {
  --molecule-shift: var(--molecule-parallax-up-soft);
  --molecule-idle-x: 38px;
  --molecule-idle-y: -42px;
  width: clamp(145px, 12vw, 235px);
  left: -4%;
  top: 76%;
  opacity: 0.2;
  filter: saturate(0.92) drop-shadow(0 0 14px rgba(44, 133, 255, 0.12));
  animation-duration: 12s;
  animation-delay: -9s;
}

.home-global-decor__item--molecule-8 {
  --molecule-shift: var(--molecule-parallax-up);
  --molecule-idle-x: -32px;
  --molecule-idle-y: -34px;
  width: clamp(138px, 11vw, 220px);
  right: 9%;
  top: 92%;
  opacity: 0.23;
  filter: saturate(0.98) drop-shadow(0 0 15px rgba(44, 133, 255, 0.13));
  animation-duration: 11s;
  animation-delay: -12s;
}

.home-global-decor__item--drop-1 {
  width: clamp(48px, 4vw, 82px);
  left: 44%;
  top: 22%;
  opacity: 0.28;
  filter: saturate(1.05) drop-shadow(0 0 16px rgba(78, 159, 255, 0.16));
  animation-duration: 12s;
  animation-delay: -2s;
}

.home-global-decor__item--drop-2 {
  --drop-idle-x: -26px;
  --drop-idle-y: 30px;
  width: clamp(80px, 7vw, 140px);
  right: 18%;
  top: 38%;
  opacity: 0.15;
  filter: saturate(0.82) drop-shadow(0 0 10px rgba(78, 159, 255, 0.08));
  animation-duration: 19s;
  animation-delay: -7s;
}

.home-global-decor__item--drop-3 {
  --drop-idle-x: 22px;
  --drop-idle-y: -30px;
  width: clamp(52px, 4.5vw, 88px);
  left: 16%;
  top: 50%;
  opacity: 0.2;
  filter: saturate(0.95) drop-shadow(0 0 12px rgba(78, 159, 255, 0.1));
  animation-duration: 14s;
  animation-delay: -5s;
}

.home-global-decor__item--drop-4 {
  --drop-idle-x: -30px;
  --drop-idle-y: 24px;
  width: clamp(100px, 8vw, 160px);
  right: 5%;
  top: 61%;
  opacity: 0.16;
  filter: saturate(0.88) drop-shadow(0 0 10px rgba(78, 159, 255, 0.08));
  animation-duration: 21s;
  animation-delay: -11s;
}

.home-global-decor__item--drop-5 {
  --drop-idle-x: 20px;
  --drop-idle-y: -34px;
  width: clamp(48px, 4vw, 78px);
  left: 55%;
  top: 76%;
  opacity: 0.22;
  filter: saturate(1) drop-shadow(0 0 12px rgba(78, 159, 255, 0.12));
  animation-duration: 9s;
  animation-delay: -4s;
}

.home-global-decor__item--drop-6 {
  --drop-idle-x: -28px;
  --drop-idle-y: 30px;
  width: clamp(88px, 7vw, 145px);
  left: -3%;
  top: 90%;
  opacity: 0.14;
  filter: saturate(0.8) drop-shadow(0 0 10px rgba(78, 159, 255, 0.08));
  animation-duration: 22s;
  animation-delay: -12s;
}

@keyframes pageDecorDrift {
  0% { translate: 0 0; rotate: -1deg; }
  100% { translate: 12px -18px; rotate: 2deg; }
}

@keyframes ambientMoleculeFloat {
  0% { transform: translate3d(0, 0, 0) rotate(var(--molecule-base-rotate)); }
  50% { transform: translate3d(var(--molecule-idle-x), var(--molecule-idle-y), 0) rotate(calc(var(--molecule-base-rotate) + 2.2deg)); }
  100% { transform: translate3d(0, 0, 0) rotate(calc(var(--molecule-base-rotate) - 1.3deg)); }
}

@keyframes ambientDropFloat {
  0% { transform: translate3d(0, 0, 0) rotate(var(--drop-base-rotate)); }
  48% { transform: translate3d(var(--drop-idle-x), var(--drop-idle-y), 0) rotate(calc(var(--drop-base-rotate) + 4deg)); }
  100% { transform: translate3d(0, 0, 0) rotate(calc(var(--drop-base-rotate) - 2deg)); }
}

[data-theme="light"] .home {
  background:
    radial-gradient(circle at 12% 9%, rgba(120, 153, 247, 0.2), transparent 28%),
    radial-gradient(circle at 88% 26%, rgba(66, 149, 255, 0.16), transparent 25%),
    radial-gradient(circle at 20% 58%, rgba(120, 153, 247, 0.12), transparent 25%),
    radial-gradient(circle at 80% 80%, rgba(66, 149, 255, 0.13), transparent 28%),
    linear-gradient(180deg, #f8f9ff 0%, #eef3ff 30%, #f7f9ff 62%, #ffffff 100%);
}

[data-theme="light"] .home-sections {
  background: linear-gradient(180deg, #e3efff, #f9fcff 24%, #edf6ff 54%, #f7fbff 78%, #e3efff);
}


[data-theme="light"] .home-sections__blend {
  background: linear-gradient(180deg, #e3efff 0%, rgba(227, 239, 255, 0) 100%);
}

[data-theme="light"] .hero--neon::after {
  background: linear-gradient(180deg, transparent, #e3efff);
}

[data-theme="light"] .home-sections :deep(.consultation-section) { color: #102650; }
[data-theme="light"] .home-sections :deep(.consultation-section__lead),
[data-theme="light"] .home-sections :deep(.consultation-section__note),
[data-theme="light"] .home-sections :deep(.consultation-details li),
[data-theme="light"] .home-sections :deep(.consultation-details p) { color: #385578; }
[data-theme="light"] .home-sections :deep(.consultation-section__eyebrow),
[data-theme="light"] .home-sections :deep(.consultation-section h2 em),
[data-theme="light"] .home-sections :deep(.consultation-details h3 em),
[data-theme="light"] .home-sections :deep(.consultation-details__link) { color: #255fc1; }
[data-theme="light"] .home-sections :deep(.consultation-section__metrics),
[data-theme="light"] .home-sections :deep(.consultation-section__reward),
[data-theme="light"] .home-sections :deep(.consultation-details) {
  background: rgba(245, 250, 255, .72);
  border-color: rgba(65, 122, 210, .3);
}
[data-theme="light"] .home-sections :deep(.consultation-section__metrics strong),
[data-theme="light"] .home-sections :deep(.consultation-section__reward strong) { color: #102650; }
[data-theme="light"] .home-sections :deep(.consultation-section__metrics span),
[data-theme="light"] .home-sections :deep(.consultation-section__reward p) { color: #4b6689; }
[data-theme="light"] .home-sections :deep(.consultation-section__reward-kicker) { color: #315fa6; }
[data-theme="light"] .home-sections :deep(.consultation-section__reward-icon) { color: #255fc1; }

[data-theme="light"] .home-global-decor::before {
  background-image:
    linear-gradient(rgba(31, 55, 110, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31, 55, 110, 0.04) 1px, transparent 1px);
  opacity: 0.62;
}

[data-theme="light"] .home-global-decor__item {
  opacity: 0.9;
  mix-blend-mode: normal;
  filter: saturate(1.22) contrast(1.1) drop-shadow(0 0 14px rgba(25, 100, 220, 0.2));
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
      rgba(248, 249, 255, 0.88) 20%,
      rgba(248, 249, 255, 0.5) 34%,
      rgba(248, 249, 255, 0.12) 44%,
      rgba(248, 249, 255, 0) 54%
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

[data-theme="light"] .accent {
  text-shadow: none;
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
  opacity: 0.78;
  mix-blend-mode: multiply;
  filter:
    saturate(1.2)
    contrast(1.08)
    drop-shadow(0 0 10px rgba(30, 91, 210, 0.22));
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
  opacity: 1;
  mix-blend-mode: normal;
  filter:
    saturate(1.2)
    contrast(1.1)
    drop-shadow(0 12px 22px rgba(24, 70, 166, 0.2));
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
  mix-blend-mode: normal;
}

[data-theme="light"] .hero-molecule {
  opacity: var(--hero-land-opacity);
}

[data-theme="light"] .hero-sphere {
  opacity: var(--hero-land-opacity);
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
    drop-shadow(0 0 10px rgba(82, 157, 255, 0.1));
  animation-duration: 10s;
}

[data-theme="light"] .hero-molecule__image,
[data-theme="light"] .hero-sphere__image {
  filter: saturate(1.22) contrast(1.1) drop-shadow(0 0 12px rgba(25, 100, 220, 0.2));
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

@keyframes heroPenRevealMobile {
  from {
    opacity: 0;
    transform: translate3d(-50%, -42px, 0) rotate(7deg);
  }
  to {
    opacity: 1;
    transform: translate3d(-50%, 0, 0) rotate(10deg);
  }
}

@keyframes heroPlatformRevealMobile {
  from {
    opacity: 0;
    transform: translate3d(44px, 0, 0) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
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
  overflow: visible;
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
  overflow: visible;
}

.section-decor img {
  position: absolute;
  display: block;
  height: auto;
  object-fit: contain;
  mix-blend-mode: screen;
}

[data-theme="light"] .section-decor img {
  opacity: 0.9;
  mix-blend-mode: normal;
  filter: saturate(1.22) contrast(1.1) drop-shadow(0 0 14px rgba(25, 100, 220, 0.2));
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
  --molecule-shift: var(--molecule-parallax-up);
  --molecule-base-rotate: -11deg;
  width: clamp(150px, 14vw, 230px);
  right: clamp(-80px, -4vw, -34px);
  top: 8%;
  opacity: 0.42;
}

.section-decor__molecule--features-soft {
  --molecule-shift: var(--molecule-parallax-down);
  width: clamp(120px, 11vw, 190px);
  left: clamp(-76px, -4vw, -32px);
  bottom: 7%;
  opacity: 0.22;
  filter:
    saturate(0.9)
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
  overflow: visible;
  isolation: isolate;
  background: transparent;
}

.section-decor--categories {
  inset: -6% 0 0;
}

.section-decor__molecule--categories-main {
  --molecule-shift: var(--molecule-parallax-up-soft);
  --molecule-base-rotate: 9deg;
  width: clamp(160px, 15vw, 260px);
  right: clamp(-46px, -2.4vw, -18px);
  top: 18%;
  opacity: 0.4;
  animation-duration: 9s;
  animation-delay: -3s;
}

.section-decor__molecule--categories-soft {
  --molecule-shift: var(--molecule-parallax-down);
  width: clamp(110px, 10vw, 180px);
  left: 34%;
  top: 7%;
  opacity: 0.2;
  filter:
    saturate(0.88)
    drop-shadow(0 0 12px rgba(45, 139, 255, 0.12));
  animation-duration: 10s;
  animation-delay: -6s;
}

.section-decor__drop--categories-top {
  width: clamp(50px, 4.8vw, 78px);
  right: 30%;
  top: 13%;
  opacity: 0.36;
  filter:
    saturate(1.08)
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
  min-height: 315px;
  padding: 4.25rem 5rem;
  background:
    radial-gradient(circle at 86% 50%, rgba(50, 105, 246, 0.24), transparent 27%),
    linear-gradient(112deg, rgba(15, 25, 55, 0.97), rgba(8, 15, 35, 0.93) 58%, rgba(17, 34, 74, 0.9));
  border: 1px solid rgba(178, 202, 255, 0.38);
  border-radius: 30px;
  box-shadow: inset 0 1px rgba(233, 241, 255, 0.14), inset 0 -1px rgba(64, 113, 238, 0.16), 0 26px 65px rgba(0, 5, 22, 0.36);
  overflow: visible;
  isolation: isolate;
  transition: border-color .5s ease, box-shadow .5s ease;
}

.cta__inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 7%, rgba(191, 211, 255, .74) 48%, transparent 93%);
  border-radius: inherit;
  opacity: .7;
}

.cta__inner::after {
  position: absolute;
  z-index: -1;
  inset: 1px;
  border-radius: 29px;
  background: linear-gradient(135deg, rgba(184, 205, 255, .06), transparent 34%);
  content: '';
  pointer-events: none;
}

.cta__inner:hover {
  border-color: rgba(190, 213, 255, .62);
  box-shadow: inset 0 1px rgba(236, 243, 255, .22), inset 0 -1px rgba(79, 128, 255, .24), 0 30px 72px rgba(0, 7, 30, .46), 0 0 42px rgba(57, 108, 245, .15);
}

.cta__content {
  position: relative;
  z-index: 4;
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

.cta__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cta__contact-btn,
.cta__chat-btn {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  padding: .7rem 1rem;
  border-radius: 999px;
  font-size: .9rem;
  line-height: 1;
  transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease, background .3s ease;
}

.cta__contact-btn img,
.cta__chat-btn img {
  flex: 0 0 auto;
  width: 1.45rem;
  height: 1.45rem;
  object-fit: contain;
}

.cta__contact-btn img {
  width: 1.55rem;
  height: 1.55rem;
}

.cta__contact-btn b,
.cta__chat-btn b {
  margin-left: .2rem;
  font-size: 1.15rem;
  font-weight: 400;
  transition: transform .3s ease;
}

.cta__contact-btn:hover,
.cta__chat-btn:hover {
  transform: translateY(-2px);
}

.cta__contact-btn:hover b,
.cta__chat-btn:hover b {
  transform: translateX(3px);
}

.cta__contact-btn {
  border: 1px solid rgba(215, 227, 255, .75);
  background: linear-gradient(135deg, #b7caff, #8baaf7);
  box-shadow: 0 10px 23px rgba(57, 101, 219, .25), inset 0 1px rgba(255, 255, 255, .45);
  color: #0a1532;
}

.cta__contact-btn:hover {
  background: linear-gradient(135deg, #c8d6ff, #96b2ff);
  color: #07112a;
  box-shadow: 0 13px 29px rgba(63, 110, 240, .38), inset 0 1px rgba(255, 255, 255, .56);
}

.cta__chat-btn {
  border: 1px solid rgba(166, 185, 248, 0.38);
  background: rgba(122, 153, 237, 0.09);
  color: var(--text-primary);
  text-decoration: none;
}

.cta__chat-btn:hover {
  border-color: rgba(166, 185, 248, 0.72);
  background: rgba(166, 185, 248, 0.14);
  color: #dfe8ff;
}

.cta__decoration {
  position: absolute;
  z-index: 2;
  right: 2.25rem;
  top: 50%;
  width: min(44vw, 515px);
  height: 315px;
  transform: translateY(-50%);
  pointer-events: none;
}

.cta__aura {
  position: relative;
  z-index: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 53% 52%, rgba(103, 160, 255, .38), rgba(46, 96, 234, .16) 32%, transparent 68%);
  filter: blur(12px);
  opacity: .75;
  transition: opacity .5s ease, transform .5s ease;
}

.cta__inner:hover .cta__aura {
  opacity: 1;
  transform: scale(1.08);
}

.cta__asset {
  position: absolute;
  display: block;
  width: auto;
  height: auto;
  max-width: none;
  object-fit: contain;
  filter: drop-shadow(0 10px 19px rgba(11, 65, 190, .28));
  will-change: transform;
}

.cta__asset--orbit {
  z-index: 1;
  top: -5%;
  left: -3%;
  width: 108%;
  animation: cta-orbit-spin 28s linear infinite;
}

.cta__asset--telegram {
  z-index: 3;
  top: 13%;
  left: 31%;
  width: 48%;
  animation: cta-float-main 6.5s ease-in-out infinite;
}

.cta__asset--chat-bars {
  z-index: 4;
  top: 8%;
  left: 2%;
  width: 30%;
  animation: cta-float-left 5.7s ease-in-out -1.3s infinite;
}

.cta__asset--chat-dots {
  z-index: 5;
  right: 1%;
  bottom: 4%;
  width: 28%;
  animation: cta-float-right 6.2s ease-in-out -.6s infinite;
}

.cta__asset--users {
  z-index: 4;
  right: 8%;
  top: 1%;
  width: 21%;
  animation: cta-float-right 5.5s ease-in-out -2s infinite;
}

.cta__asset--plane {
  z-index: 6;
  left: 19%;
  bottom: 3%;
  width: 18%;
  animation: cta-float-left 4.9s ease-in-out -3.2s infinite;
}

@keyframes cta-float-main {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-2deg); }
  50% { transform: translate3d(0, -7px, 0) rotate(1deg); }
}

@keyframes cta-float-left {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(-3deg); }
  50% { transform: translate3d(-4px, -5px, 0) rotate(1deg); }
}

@keyframes cta-float-right {
  0%, 100% { transform: translate3d(0, 0, 0) rotate(3deg); }
  50% { transform: translate3d(4px, -6px, 0) rotate(-1deg); }
}

@keyframes cta-orbit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Compact consultation card — deliberately restrained so the PNG composition remains the focus. */
.cta {
  padding: 2.75rem 0 5rem;
}

.cta__inner {
  display: flex;
  align-items: center;
  min-height: 270px;
  padding: 2.85rem 4rem;
  border-color: rgba(99, 139, 225, .22);
  border-radius: 23px;
  background:
    radial-gradient(ellipse at 77% 53%, rgba(26, 72, 189, .18), transparent 29%),
    radial-gradient(circle at 88% 26%, rgba(58, 108, 232, .12), transparent 16%),
    linear-gradient(105deg, #090f1d 0%, #070d19 57%, #091426 100%);
  box-shadow: inset 0 1px rgba(159, 190, 255, .07), inset 0 -1px rgba(61, 108, 219, .1), 0 18px 42px rgba(0, 4, 16, .28);
  overflow: hidden;
}

.cta__inner::before {
  left: 8%;
  right: auto;
  width: 42%;
  background: linear-gradient(90deg, transparent, rgba(110, 162, 255, .42), transparent);
  opacity: .55;
}

.cta__inner::after {
  z-index: 0;
  border-radius: 22px;
  background: linear-gradient(125deg, rgba(130, 170, 255, .035), transparent 38%);
}

.cta__inner:hover {
  border-color: rgba(120, 166, 255, .36);
  box-shadow: inset 0 1px rgba(180, 205, 255, .1), inset 0 -1px rgba(65, 120, 242, .15), 0 19px 45px rgba(0, 5, 20, .33), 0 0 28px rgba(44, 103, 238, .09);
}

.cta__content {
  width: 48%;
  max-width: 520px;
}

.cta__meta {
  display: inline-flex;
  position: relative;
  align-items: center;
  min-height: 28px;
  margin-bottom: .75rem;
  padding: 0 .68rem 0 .38rem;
  border: 1px solid rgba(67, 132, 255, .56);
  border-radius: 999px;
  background: linear-gradient(100deg, rgba(30, 83, 187, .18), rgba(17, 41, 102, .08));
  box-shadow: inset 0 1px rgba(180, 209, 255, .15), 0 0 18px rgba(40, 104, 244, .12);
  color: #a9c5ff;
  font: 700 .62rem/1 var(--font-mono);
  letter-spacing: .15em;
}

.cta__meta img {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: .28rem;
  object-fit: contain;
}

.cta__meta b {
  color: #78a6ff;
  font-weight: 700;
}

.cta__meta i {
  position: absolute;
  right: -1.55rem;
  display: block;
  width: .62rem;
  height: 1px;
  background: #76a6ff;
  box-shadow: 0 0 8px rgba(83, 147, 255, .68);
  transform: rotate(-26deg);
}

.cta__meta i:nth-of-type(1) { top: .35rem; }
.cta__meta i:nth-of-type(2) { top: .83rem; right: -1.82rem; width: .85rem; }
.cta__meta i:nth-of-type(3) { top: 1.28rem; right: -1.52rem; width: .55rem; }

.cta__content h2 {
  margin: 0 0 .75rem;
  color: #f3f7ff;
  font-size: clamp(2rem, 3.1vw, 3.05rem);
  font-weight: 800;
  line-height: .98;
  letter-spacing: -.048em;
}

.cta__content h2 em {
  display: block;
  font: inherit;
  font-style: normal;
  background: linear-gradient(105deg, #38c8ff 0%, #6b8cff 56%, #8d74ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 14px rgba(76, 153, 255, .16));
}

.cta__content p {
  position: relative;
  max-width: 31rem;
  margin: 0 0 1.35rem;
  padding-left: .85rem;
  color: rgba(198, 214, 247, .76);
  font-size: .91rem;
  line-height: 1.47;
}

.cta__content p::before {
  position: absolute;
  top: .08rem;
  bottom: .08rem;
  left: 0;
  width: 1px;
  background: linear-gradient(#67bdff, rgba(92, 145, 255, .16));
  box-shadow: 0 0 8px rgba(70, 163, 255, .8);
  content: '';
}

.cta__actions {
  gap: .72rem;
}

.cta__contact-btn,
.cta__chat-btn {
  min-width: 0;
  min-height: 57px;
  padding: .75rem .9rem;
  border-radius: 15px;
  font-size: .82rem;
  font-weight: 650;
}

.cta__contact-btn img,
.cta__chat-btn img,
.cta__contact-btn img.cta__contact-btn img {
  width: 1.42rem;
  height: 1.42rem;
}

.cta__contact-btn b,
.cta__chat-btn b {
  margin-left: .75rem;
  color: #dce8ff;
  font-size: 1.25rem;
  font-weight: 300;
}

.cta__contact-btn .cta__button-arrow,
.cta__chat-btn .cta__button-arrow {
  width: 1.18rem;
  height: 1.18rem;
  margin-left: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 5px rgba(152, 191, 255, .46));
  transition: transform .3s ease, filter .3s ease;
}

.cta__contact-btn {
  border-color: rgba(103, 166, 255, .78);
  background: linear-gradient(120deg, rgba(36, 89, 202, .52), rgba(23, 50, 123, .34));
  box-shadow: inset 0 1px rgba(201, 220, 255, .18), inset 0 0 20px rgba(48, 107, 247, .13), 0 8px 20px rgba(9, 38, 113, .21);
  color: #e6efff;
}

.cta__contact-btn:hover {
  background: linear-gradient(120deg, rgba(48, 105, 226, .62), rgba(27, 59, 139, .43));
  color: #f3f7ff;
  box-shadow: inset 0 1px rgba(217, 230, 255, .25), inset 0 0 22px rgba(61, 124, 255, .21), 0 8px 25px rgba(23, 67, 179, .32);
}

.cta__chat-btn {
  border-color: rgba(88, 138, 234, .45);
  background: rgba(17, 34, 79, .32);
  box-shadow: inset 0 1px rgba(174, 200, 255, .08);
  color: rgba(222, 232, 255, .9);
}

.cta__chat-btn:hover {
  border-color: rgba(119, 168, 255, .64);
  background: rgba(34, 68, 151, .28);
  box-shadow: inset 0 1px rgba(193, 215, 255, .13), 0 0 18px rgba(45, 104, 240, .12);
  color: #f1f5ff;
}

.cta__contact-btn:hover,
.cta__chat-btn:hover {
  transform: translateY(-1px);
}

.cta__contact-btn:hover .cta__button-arrow,
.cta__chat-btn:hover .cta__button-arrow {
  transform: translateX(2px);
  filter: drop-shadow(0 0 8px rgba(177, 209, 255, .7));
}

.cta__decoration {
  right: 3.5rem;
  width: min(40vw, 435px);
  height: 248px;
}

.cta__aura {
  opacity: .55;
  background:
    radial-gradient(circle at 54% 51%, rgba(51, 118, 251, .24), rgba(18, 58, 154, .11) 27%, transparent 59%),
    radial-gradient(circle at 80% 18%, rgba(96, 160, 255, .16), transparent 7%),
    radial-gradient(circle at 12% 78%, rgba(64, 125, 241, .12), transparent 8%);
  filter: blur(15px);
}

.cta__inner:hover .cta__aura {
  opacity: .72;
  transform: none;
}

.cta__asset {
  filter: drop-shadow(0 8px 14px rgba(10, 56, 160, .2));
}

.cta__asset--orbit {
  top: 0;
  left: 20%;
  width: 60%;
  opacity: .56;
  filter: drop-shadow(0 5px 10px rgba(20, 81, 211, .16));
  animation: none;
  transition: transform .6s cubic-bezier(.22, 1, .36, 1), opacity .45s ease, filter .45s ease;
}

.cta__inner:hover .cta__asset--orbit {
  transform: translate3d(0, -5px, 0) rotate(-2deg) scale(1.02);
  opacity: .7;
  filter: drop-shadow(0 7px 13px rgba(38, 104, 243, .25));
}

.cta__asset--telegram {
  top: 18%;
  left: 35%;
  width: 42%;
  filter: drop-shadow(0 12px 19px rgba(30, 104, 255, .34));
  animation-duration: 8s;
}

.cta__asset--chat-bars {
  top: 6%;
  left: 15%;
  width: 23%;
  opacity: .76;
  animation-duration: 7.2s;
}

.cta__asset--chat-dots {
  right: 2%;
  bottom: 22%;
  width: 23%;
  opacity: .74;
  animation-duration: 7.8s;
}

.cta__asset--users {
  top: auto;
  width: 17%;
  opacity: .7;
}

.cta__asset--users-left {
  left: 17%;
  bottom: 6%;
  animation: cta-float-left 7.1s ease-in-out -1.8s infinite;
}

.cta__asset--users-right {
  right: 12%;
  bottom: 5%;
  animation: cta-float-right 7.4s ease-in-out -3.4s infinite;
}

.cta__asset--plane {
  left: auto;
  right: 17%;
  bottom: auto;
  top: 2%;
  width: 12%;
  opacity: .83;
  animation-duration: 7s;
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
  }

  .hero__actions .btn {
    padding: 0.95rem 1.5rem;
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
    padding: 0 clamp(1rem, 3vw, 1.5rem);
    min-height: 0;
  }

  .hero__container::before {
    content: none;
  }

  .hero__visual {
    position: relative;
    order: 1;
    min-height: clamp(430px, 56vw, 500px);
    width: 100%;
    max-width: none;
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
    width: 100%;
    max-width: none;
    justify-self: stretch;
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
  .hero__actions {
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
    content: none;
  }

  .hero__content {
    order: 2;
    width: 100%;
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
    content: none;
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
    transform: translate3d(-50%, 0, 0) rotate(10deg);
    opacity: 1;
    animation: heroPenRevealMobile 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.14s both;
  }

  .hero-platform {
    left: 13%;
    right: auto;
    width: 76%;
    bottom: -28%;
    height: 34%;
    transform: translate3d(0, 0, 0);
    opacity: 1;
    animation: heroPlatformRevealMobile 0.82s cubic-bezier(0.16, 1, 0.3, 1) 0.06s both;
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
  .home-global-decor__item--molecule-7,
  .home-global-decor__item--molecule-8,
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

  .home-global-decor__item--molecule-6 {
    width: 110px;
    right: -18px;
    top: 64%;
    opacity: 0.17;
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
    padding: 1.25rem 0 3rem;
  }

  .cta__decoration {
    position: relative;
    top: auto;
    right: auto;
    width: min(100%, 310px);
    height: 190px;
    margin: .85rem auto -1rem;
    transform: none;
  }

  .cta__inner {
    min-height: 0;
    padding: 1.4rem;
    overflow: hidden;
  }

  .cta__content {
    width: 100%;
  }

  .cta__meta {
    margin-bottom: .65rem;
    font-size: .56rem;
  }

  .cta__content h2 {
    font-size: clamp(1.85rem, 8vw, 2.25rem);
    line-height: .98;
  }

  .cta__content p {
    max-width: 28rem;
    margin-bottom: 1.15rem;
    font-size: .86rem;
  }

  .cta__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .cta__actions .btn {
    width: 100%;
  }

  .cta__actions .cta__contact-btn,
  .cta__actions .cta__chat-btn {
    justify-content: flex-start;
    min-height: 54px;
  }

  .cta__asset--telegram {
    top: 16%;
    left: 34%;
    width: 42%;
  }

  .cta__asset--chat-bars {
    top: 5%;
    left: 14%;
    width: 23%;
  }

  .cta__asset--chat-dots {
    right: 2%;
    bottom: 22%;
    width: 23%;
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
    padding: 0 clamp(1rem, 3vw, 1.5rem);
    min-height: 0;
  }

  .hero__container::before {
    content: none;
  }

  .hero__visual {
    position: relative;
    order: 1;
    min-height: clamp(430px, 56vw, 500px);
    width: 100%;
    max-width: none;
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
    width: 100%;
    max-width: none;
    justify-self: stretch;
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
  }

  .hero__actions .btn {
    width: auto;
    min-width: 205px;
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

@media (min-width: 769px) and (max-width: 1080px) {
  .cta {
    padding: 2.25rem 0 4rem;
  }

  .cta__inner {
    display: block;
    min-height: 0;
    padding: 2.4rem 2.5rem 2.1rem;
  }

  .cta__content {
    width: 100%;
    max-width: 34rem;
  }

  .cta__content h2 {
    font-size: clamp(2.35rem, 5.2vw, 2.85rem);
  }

  .cta__content p {
    max-width: 32rem;
    margin-bottom: 1.25rem;
  }

  .cta__actions {
    flex-wrap: nowrap;
  }

  .cta__contact-btn,
  .cta__chat-btn {
    min-width: 15.5rem;
  }

  .cta__decoration {
    position: relative;
    top: auto;
    right: auto;
    width: min(100%, 25rem);
    height: 14.5rem;
    margin: 1rem auto -.35rem;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-global-decor__item[class*="--molecule-"],
  .home-global-decor__item[class*="--drop-"],
  .section-decor__molecule,
  .section-decor__drop {
    animation: none !important;
    translate: 0 0 !important;
  }

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

/* The landing hero is a single coordinate system; every image remains an
   independent asset so the composition can adapt without flattening it. */
.hero--neon {
  position: relative;
  display: block;
  width: 100%;
  height: calc(100svh - 72px);
  min-height: 620px;
  padding: 0;
  overflow: hidden;
  isolation: isolate;
  background: #020b23;
  color: #fff;
  transition: background-color .45s ease, color .45s ease;
}

.hero--neon::after {
  content: '';
  position: absolute;
  z-index: 11;
  inset: auto 0 0;
  height: 150px;
  background: linear-gradient(180deg, transparent, #020a1b);
  pointer-events: none;
}

.hero-neon__background,
.hero-neon__background::after,
.hero-neon__scene {
  position: absolute;
  inset: 0;
}

.hero-neon__background {
  z-index: 0;
  background: #020b23 url('/hero-assets/neon-lab-background.webp') center bottom / cover no-repeat;
  transition: opacity 0.45s ease;
  pointer-events: none;
}

.hero-neon__background--light {
  opacity: 0;
  background: #e8f2ff url('/hero-assets/neon-lab-background-light.webp') center bottom / cover no-repeat;
}

.hero-neon__background::after {
  content: '';
  background:
    linear-gradient(90deg, rgba(1, 7, 24, .84) 0%, rgba(1, 7, 24, .58) 28%, rgba(1, 7, 24, .15) 52%, transparent 74%),
    linear-gradient(0deg, rgba(0, 5, 25, .08), transparent 32%);
}

.hero-neon__background-fx {
  position: absolute;
  z-index: 1;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.hero-neon__comets,
.hero-neon__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-neon__light-fx {
  display: none;
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-neon__light-sparks,
.hero-neon__light-grid-glints {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-neon__light-spark,
.hero-neon__light-grid-glint {
  position: absolute;
  display: block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
}

.hero-neon__light-spark {
  left: var(--spark-x);
  top: var(--spark-y);
  background: #f7fdff;
  box-shadow: 0 0 5px 2px rgba(127, 207, 255, .52), 0 0 13px 4px rgba(89, 179, 255, .2);
  animation: heroLightSparkFloat var(--spark-duration) ease-in-out var(--spark-delay) infinite;
}

.hero-neon__light-spark:nth-child(1) { --spark-x: 55%; --spark-y: 51%; --spark-rise: -42px; --spark-duration: 9s; --spark-delay: -2s; }
.hero-neon__light-spark:nth-child(2) { --spark-x: 63%; --spark-y: 33%; --spark-rise: -54px; --spark-duration: 11s; --spark-delay: -7s; }
.hero-neon__light-spark:nth-child(3) { --spark-x: 71%; --spark-y: 59%; --spark-rise: -36px; --spark-duration: 10s; --spark-delay: -4s; }
.hero-neon__light-spark:nth-child(4) { --spark-x: 79%; --spark-y: 27%; --spark-rise: -48px; --spark-duration: 12s; --spark-delay: -9s; }
.hero-neon__light-spark:nth-child(5) { --spark-x: 88%; --spark-y: 43%; --spark-rise: -60px; --spark-duration: 10.5s; --spark-delay: -6s; }
.hero-neon__light-spark:nth-child(6) { --spark-x: 95%; --spark-y: 58%; --spark-rise: -39px; --spark-duration: 9.5s; --spark-delay: -8s; }
.hero-neon__light-spark:nth-child(7) { --spark-x: 68%; --spark-y: 19%; --spark-rise: -47px; --spark-duration: 11.5s; --spark-delay: -3s; }

.hero-neon__light-grid-glint {
  left: var(--glint-x);
  top: var(--glint-y);
  width: 3px;
  height: 3px;
  background: #d6f7ff;
  box-shadow: 0 0 5px 2px rgba(53, 183, 255, .58), 0 0 10px 3px rgba(48, 150, 240, .24);
  animation: heroLightGridGlint 6s ease-in-out var(--glint-delay) infinite;
}

.hero-neon__light-grid-glint:nth-child(1) { --glint-x: 48%; --glint-y: 78%; --glint-delay: -1s; }
.hero-neon__light-grid-glint:nth-child(2) { --glint-x: 58%; --glint-y: 87%; --glint-delay: -4s; }
.hero-neon__light-grid-glint:nth-child(3) { --glint-x: 67%; --glint-y: 76%; --glint-delay: -2.5s; }
.hero-neon__light-grid-glint:nth-child(4) { --glint-x: 76%; --glint-y: 90%; --glint-delay: -5s; }
.hero-neon__light-grid-glint:nth-child(5) { --glint-x: 85%; --glint-y: 79%; --glint-delay: -3.5s; }
.hero-neon__light-grid-glint:nth-child(6) { --glint-x: 93%; --glint-y: 93%; --glint-delay: -.5s; }

@keyframes heroLightSparkFloat {
  0%, 100% { opacity: 0; transform: translate3d(0, 0, 0); }
  26% { opacity: .7; }
  72% { opacity: .55; }
  88% { opacity: 0; transform: translate3d(0, var(--spark-rise), 0); }
}

@keyframes heroLightGridGlint {
  0%, 100% { opacity: 0; transform: scale(.65); }
  42% { opacity: .8; transform: scale(1.2); }
  70% { opacity: .35; transform: scale(1); }
}

.hero-neon__comet,
.hero-neon__star {
  position: absolute;
  top: var(--fx-top);
  right: var(--fx-right);
  display: block;
  border-radius: 999px;
  opacity: 0;
  pointer-events: none;
  transform: translate3d(0, 0, 0) rotate(var(--fx-angle));
  transform-origin: 0 50%;
  animation-delay: var(--fx-delay);
  animation-duration: var(--fx-cycle);
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

.hero-neon__comet {
  width: var(--fx-length);
  height: 3px;
  background: linear-gradient(90deg, rgba(225, 253, 255, .98) 0%, rgba(80, 203, 255, .7) 7%, rgba(12, 117, 255, .26) 38%, transparent 100%);
  box-shadow: 0 0 7px rgba(32, 165, 255, .33);
  animation-name: heroCometPass;
}

.hero-neon__comet::before,
.hero-neon__star::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #e7fbff;
  box-shadow: 0 0 7px 1px rgba(77, 189, 255, .74);
  transform: translateY(-50%);
}

.hero-neon__star {
  width: 28px;
  height: 2px;
  background: linear-gradient(90deg, rgba(231, 251, 255, .92), rgba(35, 146, 255, .28) 48%, transparent);
  animation-name: heroStarPass;
}

.hero-neon__star::before { width: 3px; height: 3px; }

.hero--neon.is-background-paused :is(.hero-neon__comet, .hero-neon__star, .hero-neon__light-spark, .hero-neon__light-grid-glint) {
  animation-play-state: paused;
}

@keyframes heroCometPass {
  0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(var(--fx-angle)); }
  1.5% { opacity: var(--fx-peak); }
  6.5% { opacity: var(--fx-peak); }
  9% { opacity: 0; transform: translate3d(var(--fx-distance-x), var(--fx-distance-y), 0) rotate(var(--fx-angle)); }
  100% { opacity: 0; transform: translate3d(var(--fx-distance-x), var(--fx-distance-y), 0) rotate(var(--fx-angle)); }
}

@keyframes heroStarPass {
  0% { opacity: 0; transform: translate3d(0, 0, 0) rotate(var(--fx-angle)) scale(.7); }
  1% { opacity: .65; }
  2.5% { opacity: .5; }
  4% { opacity: 0; transform: translate3d(var(--fx-distance-x), var(--fx-distance-y), 0) rotate(var(--fx-angle)) scale(1); }
  100% { opacity: 0; transform: translate3d(var(--fx-distance-x), var(--fx-distance-y), 0) rotate(var(--fx-angle)) scale(1); }
}

.hero-neon__scene {
  z-index: 2;
  pointer-events: none;
  user-select: none;
}

.hero-neon__assembly {
  position: absolute;
  inset: 0;
  transform: none;
  pointer-events: none;
}
.hero-neon__assembly--molecule-top { z-index: 3; }
.hero-neon__assembly--molecule-mid { z-index: 2; }
.hero-neon__assembly--molecule-right { z-index: 5; }
.hero-neon__assembly--sphere-top { z-index: 5; }
.hero-neon__assembly--sphere-right { z-index: 6; }
.hero-neon__assembly--sphere-small { z-index: 4; }
.hero-neon__assembly--bubbles-left { z-index: 9; }
.hero-neon__assembly--bubbles-right { z-index: 7; }
.hero-neon__assembly--podium { z-index: 4; }
.hero-neon__assembly--pen { z-index: 8; }

.hero--neon.is-assembly-pending .hero-neon__assembly,
.hero--neon.is-assembly-pending :is(.hero-neon__badge, .hero-neon__title, .hero-neon__chips, .hero-neon__actions) {
  visibility: hidden;
}

.hero-neon__energy {
  position: absolute;
  z-index: 7;
  left: 70%;
  top: 71%;
  width: 18%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(222, 252, 255, .95), rgba(50, 190, 255, .55) 20%, rgba(0, 112, 255, .12) 52%, transparent 70%);
  opacity: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.hero-neon__floor-light {
  position: absolute;
  z-index: 1;
  left: 71%;
  top: 80%;
  width: 45%;
  height: 27%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0, 142, 255, .55), rgba(0, 58, 191, .2) 42%, transparent 74%);
  filter: blur(32px);
}

.hero-neon__object {
  position: absolute;
  display: block;
  height: auto;
  max-width: none;
  object-fit: contain;
  pointer-events: none;
  -webkit-user-drag: none;
  backface-visibility: hidden;
}

/* Theme assets share their animated wrapper; only their opacity changes. */
.hero-neon__object.hero-neon__object--theme-light { opacity: 0; }
.hero-neon__object--theme-dark,
.hero-neon__object--theme-light { transition: opacity .45s ease; }

.hero-neon__object--podium {
  z-index: 4;
  left: 70%;
  top: 32%;
  width: 36%;
  transform: translateX(-50%);
  filter: drop-shadow(0 16px 24px rgba(0, 47, 148, .5));
}

.hero-neon__object--pen {
  z-index: 8;
  left: 60%;
  top: 6%;
  width: auto;
  height: 62%;
  filter: drop-shadow(-19px 19px 25px rgba(0, 2, 18, .68)) drop-shadow(0 0 18px rgba(45, 153, 255, .28));
}

.hero-neon__object--molecule-top {
  z-index: 3;
  left: 43%;
  top: 10%;
  width: 11%;
  transform: rotate(-15deg);
  filter: drop-shadow(0 0 13px rgba(42, 157, 255, .35));
}

.hero-neon__object--molecule-mid {
  z-index: 2;
  left: 55%;
  top: 20%;
  width: 13%;
  opacity: .7;
}

.hero-neon__object--molecule-right {
  z-index: 5;
  left: 82%;
  top: 40%;
  width: 13%;
  filter: drop-shadow(0 0 12px rgba(51, 154, 255, .25));
}

.hero-neon__object--sphere-top {
  z-index: 5;
  left: 85%;
  top: 15%;
  width: 8%;
}

.hero-neon__object--sphere-right {
  z-index: 6;
  left: 84%;
  top: 57%;
  width: 9%;
}

.hero-neon__object--sphere-small {
  z-index: 4;
  left: 49%;
  top: 22%;
  width: 4%;
}

.hero-neon__object--bubbles-left {
  z-index: 9;
  left: -18%;
  top: 36%;
  width: 30%;
  opacity: .57;
  filter: blur(2px);
}

.hero-neon__object--bubbles-right {
  z-index: 7;
  right: -10%;
  top: 21%;
  width: 25%;
  opacity: .75;
  filter: blur(2px);
}

.hero-neon__content {
  position: relative;
  z-index: 12;
  width: min(52%, 700px);
  margin-left: clamp(40px, 9.5vw, 180px);
  padding-top: clamp(48px, 7.5vh, 80px);
  text-shadow: 0 2px 18px rgba(0, 3, 18, .6);
}

.hero-neon__badge,
.hero-neon__chip {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border: 1px solid rgba(35, 137, 255, .68);
  border-radius: 999px;
  background: rgba(1, 14, 44, .72);
  box-shadow: inset 0 0 13px rgba(13, 81, 178, .2), 0 0 14px rgba(0, 94, 255, .32);
  color: #d9efff;
  white-space: nowrap;
  transition: background-color .45s ease, border-color .45s ease, color .45s ease, box-shadow .45s ease;
}

.hero-neon__badge {
  min-height: 32px;
  padding: 5px 15px;
  margin-bottom: clamp(19px, 3vh, 27px);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: .015em;
  text-transform: uppercase;
}

.hero-neon__dot {
  flex: 0 0 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2dd5ff;
  box-shadow: 0 0 5px 2px #11b7ff, 0 0 12px #007dff;
}

.hero-neon__title {
  margin: 0 0 21px;
  font-family: var(--font-display);
  font-size: clamp(34px, 3.4vw, 54px);
  font-weight: 800;
  line-height: .98;
  letter-spacing: -.055em;
  transition: color .45s ease, text-shadow .45s ease;
}
.hero-neon__title span { display: block; }
.hero-neon__accent {
  width: fit-content;
  background: linear-gradient(100deg, #64b2ff 5%, #319bff 55%, #b1e1ff 100%);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 20px rgba(17, 122, 255, .23));
}

.hero-neon__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-bottom: 21px;
}
.hero-neon__chip {
  min-height: 27px;
  padding: 4px 11px;
  font-size: 10px;
  font-weight: 650;
  text-transform: uppercase;
}
.hero-neon__chip .hero-neon__dot { flex-basis: 5px; width: 5px; height: 5px; }

.hero-neon__actions { display: flex; flex-wrap: wrap; gap: 11px; }
.hero-neon__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 46px;
  padding: 0 20px;
  border: 1px solid rgba(25, 120, 255, .7);
  border-radius: 11px;
  background: rgba(1, 13, 39, .75);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: inset 0 0 12px rgba(0, 82, 189, .16), 0 0 16px rgba(0, 83, 247, .16);
  transition: transform .25s ease, border-color .45s ease, box-shadow .45s ease, background-color .45s ease, color .45s ease;
}
.hero-neon__button:hover,
.hero-neon__button:focus-visible { transform: translateY(-2px); border-color: #42c8ff; box-shadow: 0 0 22px rgba(0, 116, 255, .42); }
.hero-neon__button--primary {
  border-color: #4ec9ff;
  background: linear-gradient(115deg, #0b77f9, #03aafa);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.27), 0 0 14px rgba(0, 127, 255, .76), 0 0 27px rgba(0, 99, 255, .55);
}
.hero-neon__button--license { color: #aee7ff; }
.hero-neon__button svg { width: 17px; height: 17px; }


@media (max-width: 1100px) {
  .hero-neon__comet:nth-child(4),
  .hero-neon__star:nth-child(n+7) { display: none; }
  .hero--neon { height: auto; min-height: 650px; }
  .hero-neon__content { width: 53%; margin-left: 5%; padding-top: 80px; }
  .hero-neon__title { font-size: clamp(33px, 3.8vw, 43px); }
  .hero-neon__button { padding: 0 14px; font-size: 12px; }
  .hero-neon__object--pen { left: 62%; height: 56%; top: 9%; }
  .hero-neon__object--podium { left: 76%; top: 46%; width: 42%; }
}

@media (max-width: 767px) {
  .hero-neon__background-fx { opacity: .65; }
  .hero-neon__comet:nth-child(n+3),
  .hero-neon__star:nth-child(n+5) { display: none; }
  .hero--neon {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto auto auto;
    min-height: 0;
    height: auto;
    padding: 26px 0 calc(104px + env(safe-area-inset-bottom));
  }
  .hero-neon__background { background-position: 58% bottom; background-size: auto 100%; }
  .hero-neon__background::after {
    background: linear-gradient(180deg, rgba(0, 5, 23, .78) 0%, rgba(0, 5, 23, .62) 35%, rgba(0, 5, 23, .05) 70%, rgba(0, 5, 23, .68) 100%);
  }
  .hero-neon__content { display: contents; }
  .hero-neon__badge,
  .hero-neon__title,
  .hero-neon__chips,
  .hero-neon__actions { position: relative; z-index: 12; min-width: 0; }
  .hero-neon__badge {
    grid-row: 1;
    justify-self: start;
    min-height: 30px;
    margin: 0 20px 20px;
    padding: 4px 13px;
    font-size: 10px;
  }
  .hero-neon__title {
    grid-row: 2;
    margin: 0 20px 20px;
    font-size: clamp(28px, 7.5vw, 38px);
    line-height: 1.06;
    letter-spacing: -.048em;
    text-shadow: 0 2px 18px rgba(0, 3, 18, .65);
  }
  .hero-neon__title span { display: inline; }
  .hero-neon__accent { -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .hero-neon__chips {
    grid-row: 3;
    gap: 8px;
    margin: 0 20px 0;
    text-shadow: 0 2px 14px rgba(0, 3, 18, .6);
  }
  .hero-neon__chip { min-height: 26px; font-size: 9px; padding: 4px 9px; }
  .hero-neon__scene {
    --mobile-product-x: 52%;
    --mobile-scene-height: clamp(390px, 101vw, 450px);
    --mobile-podium-width: min(75vw, 400px);
    /* Keep the pen and podium at their original height, but reserve enough
       canvas below the podium before the action buttons begin. */
    --mobile-product-y: calc(var(--mobile-scene-height) - 70px);
    --mobile-pen-height: clamp(300px, 47vw, 360px);
    --mobile-pen-tip-offset: clamp(72px, 11.3vw, 86px);
    position: relative;
    grid-row: 4;
    inset: auto;
    width: 100%;
    height: calc(var(--mobile-scene-height) + min(37.5vw, 200px) - 58px);
    margin-top: 8px;
    overflow: hidden;
  }
  .hero-neon__object--pen {
    left: calc(var(--mobile-product-x) - var(--mobile-pen-tip-offset));
    top: calc(var(--mobile-product-y) - var(--mobile-pen-height) - 18px);
    height: var(--mobile-pen-height);
  }
  .hero-neon__object--podium {
    left: var(--mobile-product-x);
    top: var(--mobile-product-y);
    width: var(--mobile-podium-width);
    transform: translate(-50%, -50%);
  }
  .hero-neon__floor-light { left: var(--mobile-product-x); top: var(--mobile-product-y); width: 88%; }
  .hero-neon__energy { left: var(--mobile-product-x); top: var(--mobile-product-y); width: 22%; }
  .hero-neon__object--molecule-top { left: 12%; top: 8%; width: 23%; }
  .hero-neon__object--molecule-mid { left: 29%; top: 29%; width: 24%; }
  .hero-neon__object--molecule-right { left: 75%; top: 39%; width: 22%; }
  .hero-neon__object--sphere-top { left: 77%; top: 12%; width: 17%; }
  .hero-neon__object--sphere-right { left: 78%; top: 66%; width: 18%; }
  .hero-neon__object--sphere-small { left: 22%; top: 63%; width: 10%; }
  .hero-neon__object--bubbles-left { left: -19%; top: 49%; width: 39%; }
  .hero-neon__object--bubbles-right { right: -20%; top: 10%; width: 38%; }
  .hero-neon__actions {
    grid-row: 5;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 11px;
    margin: 10px 20px 0;
  }
  .hero-neon__button { min-width: 0; min-height: 50px; padding: 0 8px; border-radius: 14px; font-size: 12px; }
  .hero-neon__button--primary { grid-column: 1 / -1; min-height: 56px; font-size: 15px; }
  .hero-neon__button--license { gap: 6px; }
}

@media (max-width: 360px) {
  .hero-neon__badge { margin-inline: 16px; }
  .hero-neon__title { margin-inline: 16px; }
  .hero-neon__chips { margin-inline: 16px; }
  .hero-neon__actions { margin-inline: 16px; gap: 9px; }
  .hero-neon__button { font-size: 11px; }
  .hero-neon__button--primary { font-size: 14px; }
}

[data-theme="light"] .hero--neon {
  background: #e8f2ff;
  color: #081a35;
}

[data-theme="light"] .hero-neon__background--dark { opacity: 0; }
[data-theme="light"] .hero-neon__background--light { opacity: 1; }
[data-theme="light"] .hero-neon__comets,
[data-theme="light"] .hero-neon__stars { display: none; }
[data-theme="light"] .hero-neon__light-fx { display: block; }
[data-theme="light"] .hero-neon__background--light::after {
  background: none;
}
[data-theme="light"] .hero-neon__object--theme-dark { opacity: 0; }
[data-theme="light"] .hero-neon__object--theme-light { opacity: 1; }
[data-theme="light"] .hero-neon__content { margin-left: clamp(40px, 7.8vw, 150px); }
[data-theme="light"] .hero-neon__floor-light {
  background: radial-gradient(ellipse, rgba(37, 166, 255, .28), rgba(78, 176, 255, .12) 42%, transparent 74%);
  filter: blur(26px);
}
[data-theme="light"] .hero-neon__object--podium { filter: drop-shadow(0 18px 20px rgba(16, 90, 205, .16)); }
[data-theme="light"] .hero-neon__object--pen { filter: drop-shadow(0 18px 20px rgba(24, 92, 181, .22)); }
[data-theme="light"] .hero-neon__object--molecule-top,
[data-theme="light"] .hero-neon__object--molecule-right { filter: drop-shadow(0 4px 10px rgba(42, 145, 255, .12)); }
[data-theme="light"] .hero-neon__object--molecule-mid.hero-neon__object--theme-light { opacity: .8; }
[data-theme="light"] .hero-neon__object--bubbles-left.hero-neon__object--theme-light { opacity: .54; }
[data-theme="light"] .hero-neon__object--bubbles-right.hero-neon__object--theme-light { opacity: .48; transform: scaleX(-1); }
[data-theme="light"] .hero-neon__content { text-shadow: none; }
[data-theme="light"] .hero-neon__title { color: #071a38; text-shadow: none; }
[data-theme="light"] .hero-neon__accent {
  background-image: linear-gradient(100deg, #1769f5, #329cf5);
  filter: none;
}
[data-theme="light"] .hero-neon__badge,
[data-theme="light"] .hero-neon__chip {
  border-color: rgba(76, 151, 242, .44);
  background: rgba(255, 255, 255, .73);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .92), 0 4px 14px rgba(34, 106, 216, .16);
}
[data-theme="light"] .hero-neon__badge { color: #1769e8; }
[data-theme="light"] .hero-neon__chip { color: #12254b; }
[data-theme="light"] .hero-neon__chips { text-shadow: none; }
[data-theme="light"] .hero-neon__button--primary {
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .36), 0 5px 18px rgba(14, 107, 234, .3);
}
[data-theme="light"] .hero-neon__button--secondary {
  border-color: rgba(65, 142, 240, .32);
  background: rgba(255, 255, 255, .86);
  color: #12254b;
  box-shadow: 0 5px 17px rgba(40, 92, 166, .13);
}
[data-theme="light"] .hero-neon__button--license {
  border-color: rgba(65, 142, 240, .37);
  background: rgba(239, 247, 255, .76);
  color: #1769e8;
  box-shadow: 0 5px 17px rgba(40, 92, 166, .12);
}
[data-theme="light"] .hero-neon__comet {
  background: linear-gradient(90deg, rgba(5, 99, 220, .9), rgba(24, 125, 233, .42) 38%, transparent 100%);
  box-shadow: 0 0 8px rgba(16, 108, 221, .3);
}
[data-theme="light"] .hero-neon__star {
  background: linear-gradient(90deg, rgba(17, 108, 229, .84), rgba(32, 137, 240, .25) 48%, transparent);
}
[data-theme="light"] :is(.hero-neon__comet, .hero-neon__star)::before {
  background: #1679ec;
  box-shadow: 0 0 7px 1px rgba(21, 122, 231, .62);
}

@media (min-width: 1101px) {
  [data-theme="light"] .hero-neon__object--podium { left: 69%; top: 35%; width: 38%; }
  [data-theme="light"] .hero-neon__object--pen { top: 7%; }
}

@media (min-width: 1450px) {
  [data-theme="light"] .hero-neon__content { padding-top: clamp(58px, 8.6vh, 95px); }
  [data-theme="light"] .hero-neon__badge {
    min-width: 275px;
    min-height: 44px;
    margin-bottom: 38px;
    padding-inline: 17px;
    font-size: 13px;
  }
  [data-theme="light"] .hero-neon__title { margin-bottom: 33px; }
  [data-theme="light"] .hero-neon__chips { margin-bottom: 32px; }
  [data-theme="light"] .hero-neon__chip { min-height: 36px; padding: 6px 13px; font-size: 12px; }
  [data-theme="light"] .hero-neon__button { min-height: 56px; padding-inline: 26px; font-size: 14px; }
  [data-theme="light"] .hero-neon__button--primary { min-width: 250px; }
  [data-theme="light"] .hero-neon__button--secondary { min-width: 178px; }
  [data-theme="light"] .hero-neon__button--license { min-width: 206px; }
}

@media (max-width: 767px) {
  .hero-neon__light-spark:nth-child(n+5),
  .hero-neon__light-grid-glint:nth-child(n+4) { display: none; }
  [data-theme="light"] .hero-neon__background--light {
    background-position: center bottom;
    background-size: cover;
  }
  [data-theme="light"] .hero-neon__background--light::after {
    background: none;
  }
  [data-theme="light"] .hero-neon__content { margin-left: 0; }
}

/* Tablet and compact desktop: the pen tip and podium centre use the same
   coordinates. Keep this separate from the finished phone and wide layouts. */
@media (min-width: 768px) and (max-width: 1279px) {
  .hero--neon {
    --hero-product-x: 73%;
    --hero-product-y: 72%;
    --hero-podium-size: clamp(350px, 42vw, 520px);
    --hero-pen-height: clamp(360px, 39vw, 470px);
    --hero-pen-tip-offset: clamp(86px, 9.36vw, 113px);
    height: min(calc(100svh - 72px), clamp(700px, 68vw, 800px));
    min-height: 650px;
  }

  .hero-neon__content,
  [data-theme="light"] .hero-neon__content {
    width: min(52%, 610px);
    margin-left: 5%;
    padding-top: clamp(58px, 7vh, 80px);
  }

  .hero-neon__object--podium,
  [data-theme="light"] .hero-neon__object--podium {
    left: var(--hero-product-x);
    top: var(--hero-product-y);
    width: var(--hero-podium-size);
    transform: translate(-50%, -50%);
  }

  .hero-neon__object--pen,
  [data-theme="light"] .hero-neon__object--pen {
    left: calc(var(--hero-product-x) - var(--hero-pen-tip-offset));
    top: calc(var(--hero-product-y) - var(--hero-pen-height) - 8px);
    height: var(--hero-pen-height);
  }

  .hero-neon__floor-light { left: var(--hero-product-x); top: 80%; }
  .hero-neon__energy { left: var(--hero-product-x); top: var(--hero-product-y); }

  .hero-neon__object--molecule-top { left: 54%; top: 10%; width: clamp(95px, 11vw, 140px); }
  .hero-neon__object--molecule-mid { left: 57%; top: 34%; width: clamp(100px, 12vw, 150px); }
  .hero-neon__object--molecule-right { left: 85%; top: 44%; width: clamp(100px, 12vw, 155px); }
  .hero-neon__object--sphere-top { left: 88%; top: 16%; width: clamp(74px, 8vw, 102px); }
  .hero-neon__object--sphere-right { left: 87%; top: 66%; width: clamp(80px, 9vw, 115px); }
  .hero-neon__object--sphere-small { left: 62%; top: 30%; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-neon__background-fx { display: none; }
  .hero-neon__background,
  .hero--neon,
  .hero-neon__title,
  .hero-neon__badge,
  .hero-neon__chip,
  .hero-neon__button { transition-duration: .01ms; }
  .hero-neon__object--theme-dark,
  .hero-neon__object--theme-light { transition-duration: .01ms; }
  .hero--neon.is-assembly-pending .hero-neon__assembly,
  .hero--neon.is-assembly-pending :is(.hero-neon__badge, .hero-neon__title, .hero-neon__chips, .hero-neon__actions) { visibility: visible; }
}
</style>
