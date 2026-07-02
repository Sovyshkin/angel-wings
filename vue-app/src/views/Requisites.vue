<template>
  <div class="info-page">
    <div class="container">
      <h1 class="page-title">Реквизиты</h1>
      <div class="info-card">
        <h2 class="info-heading">РЕКВИЗИТЫ ПРОДАВЦА</h2>
        <p><strong>ИП Кириллов Никита Сергеевич</strong></p>
        <p>ИНН: 773323389224</p>
        <p>ОГРН: 325774600301379</p>
        <p>Юридический адрес: 125362, РОССИЯ, Г МОСКВА, УЛ ТУШИНСКАЯ, Д 13, КВ 70</p>
        <p>Email: <a href="mailto:info@angel-wings.ru">info@angel-wings.ru</a></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-page { padding: 3rem 0 5rem; }
.info-card {
  margin-top: 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}
.info-heading {
  margin-bottom: 1rem;
  font-size: 1rem;
  letter-spacing: 0.03em;
}
.info-card p { color: var(--text-secondary); line-height: 1.75; margin-bottom: 0.5rem; }
.info-card p:last-child { margin-bottom: 0; }
.info-card a { color: var(--accent); }
</style>
