<template>
  <div class="info-page">
    <div class="container">
      <h1 class="page-title">Частые вопросы</h1>
      <div class="faq-list">
        <div v-for="(item, index) in faqItems" :key="index" class="faq-item" :class="{ open: openIndex === index }">
          <button type="button" class="faq-question" @click="toggle(index)">
            <span>{{ item.question }}</span>
            <span class="faq-icon">+</span>
          </button>

          <transition name="faq-expand">
            <div v-if="openIndex === index" class="faq-answer-wrap">
              <p class="faq-answer">{{ item.answer }}</p>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const openIndex = ref(0)

const faqItems = [
  {
    question: 'Как оформить заказ на сайте?',
    answer: 'Оформление проходит в несколько простых шагов: выберите товары в каталоге, откройте карточку товара и при необходимости задайте дозировку, затем добавьте позиции в корзину. На странице оформления укажите контактные данные, выберите способ получения и проверьте итоговую сумму. После подтверждения заказа вы получите информацию о статусе, а при необходимости сможете уточнить детали через поддержку.'
  },
  {
    question: 'Как рассчитывается стоимость доставки?',
    answer: 'Стоимость доставки рассчитывается автоматически на этапе оформления заказа. На итог влияют город получения, выбранный вариант доставки (пункт выдачи или курьер), а также параметры заказа. До оплаты вы видите актуальную сумму доставки и итог по заказу, поэтому можете сравнить варианты и выбрать наиболее удобный.'
  },
  {
    question: 'Можно ли выбрать пункт выдачи или курьерскую доставку?',
    answer: 'Да, доступны оба варианта. Вы можете выбрать выдачу в пункте или курьерскую доставку до адреса. После выбора система покажет доступные условия по вашему городу, ориентировочные сроки и стоимость. Если параметры нужно изменить после выбора, это можно сделать до финального подтверждения заказа.'
  },
  {
    question: 'Где посмотреть статус заказа после оплаты?',
    answer: 'Статус заказа обновляется по этапам после подтверждения оплаты и передачи в обработку. Вы можете отслеживать прогресс по заказу через предоставленные уведомления и, при необходимости, уточнять текущее состояние у поддержки. Если требуется проверить конкретный этап (например, подготовку или передачу в доставку), команда поможет оперативно.'
  },
  {
    question: 'Что делать, если при оплате произошла ошибка?',
    answer: 'Если во время оплаты возникла ошибка, не выполняйте многократные списания подряд. Сначала проверьте, не пришло ли подтверждение от банка, затем свяжитесь с поддержкой и сообщите номер заказа и время попытки оплаты. Мы проверим статус платежа, подтвердим результат и подскажем безопасный следующий шаг: повторную оплату, ожидание обновления статуса или альтернативный сценарий.'
  },
  {
    question: 'Как связаться с поддержкой?',
    answer: 'Связаться с поддержкой можно через страницу “Контакты” и доступные каналы связи, указанные в футере. Лучше сразу указать номер заказа (если он уже создан) и кратко описать вопрос: подбор товара, статус, доставка, оплата или техническая ошибка. Это помогает быстрее передать запрос профильному специалисту и ускоряет решение.'
  }
]

function toggle(index) {
  openIndex.value = openIndex.value === index ? -1 : index
}
</script>

<style scoped>
.info-page { padding: 3rem 0 5rem; }

.faq-list {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.faq-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.faq-question {
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border-bottom: 1px solid transparent;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.faq-question:hover {
  background: var(--accent-dim);
}

.faq-item.open .faq-question {
  border-bottom-color: var(--border);
}

.faq-icon {
  font-size: 1.2rem;
  line-height: 1;
  transition: transform 0.25s ease;
}

.faq-item.open .faq-icon {
  transform: rotate(45deg);
}

.faq-answer-wrap {
  padding: 0 1.25rem 1rem;
}

.faq-answer {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
}

.faq-expand-enter-active,
.faq-expand-leave-active {
  transition: all 0.25s ease;
}

.faq-expand-enter-from,
.faq-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
