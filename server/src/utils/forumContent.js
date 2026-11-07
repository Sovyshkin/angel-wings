const assets = '/hero-assets/'
export const FORUM_DEFAULTS = {
  hero: { visible: true, navLabel: 'Главная', eyebrow: 'ФОРУМ ANGEL WINGS', title: 'Форум современных пептидных решений', description: 'Научные доклады • Новые разработки • Обмен опытом', date: '', place: '', button: 'Подать заявку', secondaryButton: 'О форуме', programLabel: 'Программа форума', programLink: '', background: `${assets}neon-lab-background.webp`, image: `${assets}ручка-720.webp`, video: '', objects: [
    ['podium', 'Подиум', 'neon-lab-podium.webp'], ['molecule-top', 'Верхняя молекула', 'neon-lab-molecule-top.webp'], ['molecule-mid', 'Средняя молекула', 'neon-lab-molecule-mid.webp'], ['molecule-right', 'Правая молекула', 'neon-lab-molecule-right.webp'], ['sphere-top', 'Верхняя сфера', 'neon-lab-sphere-top.webp'], ['sphere-right', 'Правая сфера', 'neon-lab-sphere-right.webp'], ['sphere-small', 'Малая сфера', 'neon-lab-sphere-small.webp'], ['bubbles-left', 'Левые пузыри', 'neon-lab-bubbles-left.webp'], ['bubbles-right', 'Правые пузыри', 'neon-lab-bubbles-right.webp']
  ].map(([name, label, file]) => ({ name, label, image: `${assets}${file}`, visible: true })) },
  advantages: { visible: true, navLabel: 'Преимущества', eyebrow: 'ПОЧЕМУ СТОИТ УЧАСТВОВАТЬ', title: 'Почему стоит участвовать?', description: '', items: [
    { icon: 'flask', title: 'Актуальные исследования', text: 'Новые научные данные и практические результаты.', image: '' },
    { icon: 'layers', title: 'Презентация новинок', text: 'Знакомство с разработками Angel Wings.', image: '' },
    { icon: 'people', title: 'Эксперты отрасли', text: 'Диалог с профильными специалистами.', image: '' },
    { icon: 'network', title: 'Нетворкинг и партнёрства', text: 'Новые профессиональные контакты.', image: '' }
  ] },
  products: { visible: true, navLabel: 'Товары', eyebrow: 'НАШИ ПРОДУКТЫ', title: 'Ключевые решения Angel Wings', description: 'Линейка высокоактивных пептидов для научных, клинических и прикладных задач.', catalogButton: 'Перейти в каталог', items: [
    { title: 'РЕТА', category: 'СНИЖЕНИЕ ВЕСА', price: '', text: '', image: '', video: '', link: '' },
    { title: 'UNI Бальзам', category: 'КРАСОТА И ВОССТАНОВЛЕНИЕ ТКАНЕЙ', price: '', text: '', image: '', video: '', link: '' },
    { title: 'Тимозин Альфа', category: 'ИММУНИТЕТ', price: '', text: '', image: '', video: '', link: '' }
  ] },
  about: { visible: true, navLabel: 'О нас', eyebrow: 'О КОМПАНИИ', title: 'Angel Wings — наука и качество', description: 'Разрабатываем и производим высокочистые пептиды по международным стандартам качества, объединяя научный подход, инновации и практическую пользу.', image: '/home-scene-light/dna.webp', video: '/about-assets/about-sphere-transparent.webm', button: 'Подробнее о компании', link: 'https://angel-wings.ru/about', stats: [
    { value: '', label: 'лет на рынке' }, { value: '', label: 'продуктов' }, { value: '', label: 'специалистов доверяют нам' }
  ] },
  events: { visible: true, navLabel: 'Мероприятия', eyebrow: 'МЕРОПРИЯТИЯ', title: 'Ближайшие события', description: '', items: [
    { title: 'Научный форум Angel Wings', date: '', place: '', image: '/event-assets/forum_conference.png', video: '', link: '' },
    { title: 'Семинар для специалистов', date: '', place: '', image: '/event-assets/forum_seminar.png', video: '', link: '' },
    { title: 'Презентация новой линейки', date: '', place: '', image: '/event-assets/forum_launch.png', video: '', link: '' }
  ] },
  cta: { visible: true, eyebrow: '', title: 'Станьте частью сообщества Angel Wings', description: 'Участвуйте в форуме, узнавайте о новинках первыми и расширяйте профессиональные связи.', button: 'Подать заявку на участие', image: '/cta-assets/blue-wave-banner.png', video: '', leftMolecule: '/home-scene/molecule-01-diagonal.webp', rightMolecule: '/home-scene/molecule-05-cluster.webp' },
  form: { visible: true, navLabel: 'Контакты', navButton: 'Подать заявку', eyebrow: 'ЗАЯВКА НА УЧАСТИЕ', title: 'Оставьте заявку на форум', description: 'Заполните форму, и мы свяжемся с вами для подтверждения участия.', button: 'Отправить заявку', success: 'Заявка сохранена. Мы свяжемся с вами для подтверждения участия.', policyLabel: 'политикой конфиденциальности', policyLink: '/policy.pdf', fields: [
    { key: 'name', label: 'ФИО', placeholder: 'Ваше имя и фамилия', required: true, visible: true },
    { key: 'company', label: 'Компания / Организация', placeholder: 'Название организации', required: false, visible: true },
    { key: 'position', label: 'Должность', placeholder: 'Ваша должность', required: false, visible: true },
    { key: 'email', label: 'E-mail', placeholder: 'name@company.ru', required: true, visible: true },
    { key: 'phone', label: 'Телефон', placeholder: '+7 (999) 000-00-00', required: true, visible: true }
  ] },
  footer: { visible: true, navHeading: 'Навигация', infoHeading: 'Информация', contactsHeading: 'Контакты', mainSiteLabel: 'Основной сайт', privacyLabel: 'Политика конфиденциальности', telegramLabel: 'Telegram', description: 'Инновационные пептидные решения для здоровья и долголетия.', email: 'info@angel-wings.ru', phone: '+7 966 179-00-13', copyright: '© 2026 Angel Wings. Все права защищены.', mainSite: 'https://angel-wings.ru', telegram: 'https://t.me/+UwZu11Bt55FhNTIy', privacyLink: '/policy.pdf' }
}
export const FORUM_SECTION_KEYS = Object.keys(FORUM_DEFAULTS)
const clean = (value, limit = 700) => String(value ?? '').trim().slice(0, limit)
const safeUrl = value => { const url = clean(value, 1000); return /^(https:\/\/|\/(?!\/))/i.test(url) ? url : '' }
function sanitizeValue(raw, fallback, key) {
  if (typeof fallback === 'boolean') return raw !== false
  if (typeof fallback === 'string') return ['image', 'video', 'background', 'leftMolecule', 'rightMolecule', 'link', 'programLink', 'policyLink', 'privacyLink', 'mainSite', 'telegram'].includes(key) ? safeUrl(raw ?? fallback) : clean(raw ?? fallback, key === 'description' || key === 'text' ? 1600 : 700)
  if (Array.isArray(fallback)) {
    const source = Array.isArray(raw) ? raw : fallback
    if (key === 'objects' || key === 'fields') return fallback.map(template => {
      const item = source.find(candidate => candidate?.[key === 'fields' ? 'key' : 'name'] === template[key === 'fields' ? 'key' : 'name']) || template
      const next = sanitizeValue(item, template)
      if (key === 'fields' && ['name', 'email', 'phone'].includes(template.key)) { next.required = true; next.visible = true }
      return next
    })
    return source.slice(0, 12).map(item => sanitizeValue(item, fallback[0] || {}))
  }
  if (fallback && typeof fallback === 'object') {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
    return Object.fromEntries(Object.entries(fallback).map(([name, value]) => [name, sanitizeValue(source[name], value, name)]))
  }
  return fallback
}
export function sanitizeForumContent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Некорректное содержимое страницы')
  return sanitizeValue(input, FORUM_DEFAULTS)
}
