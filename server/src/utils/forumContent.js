const assets = '/hero-assets/'
const sceneAssets = [
  ['wave-01-horizontal', 'Волна 1'], ['wave-02-reversed', 'Волна 2'], ['wave-03-flow-up', 'Волна 3'],
  ['wave-04-flow-down', 'Волна 4'], ['wave-06-curved', 'Волна 5'],
  ['molecule-01-diagonal', 'Молекула 1'], ['molecule-02-mirrored', 'Молекула 2'],
  ['molecule-03-chain', 'Молекула 3'], ['molecule-04-chain-reversed', 'Молекула 4'],
  ['molecule-05-cluster', 'Молекула 5'], ['molecule-06-ring', 'Молекула 6']
]
const LEGACY_FORUM_DEFAULTS = {
  hero: { visible: true, navLabel: 'Главная', logo: '/angel-wings-wordmark-light.svg', eyebrow: 'ФОРУМ ANGEL WINGS', title: 'Форум современных пептидных решений', description: 'Научные доклады • Новые разработки • Обмен опытом', date: '', place: '', button: 'Подать заявку', secondaryButton: 'О форуме', secondaryLink: '#advantages', programLabel: 'Программа форума', programLink: '', background: `${assets}neon-lab-background.webp`, lightBackground: `${assets}neon-lab-background-light.webp`, image: `${assets}ручка-720.webp`, video: '', penVisible: true, objects: [
    ['podium', 'Подиум', 'neon-lab-podium.webp'], ['molecule-top', 'Верхняя молекула', 'neon-lab-molecule-top.webp'], ['molecule-mid', 'Средняя молекула', 'neon-lab-molecule-mid.webp'], ['molecule-right', 'Правая молекула', 'neon-lab-molecule-right.webp'], ['sphere-top', 'Верхняя сфера', 'neon-lab-sphere-top.webp'], ['sphere-right', 'Правая сфера', 'neon-lab-sphere-right.webp'], ['sphere-small', 'Малая сфера', 'neon-lab-sphere-small.webp'], ['bubbles-left', 'Левые пузыри', 'neon-lab-bubbles-left.webp'], ['bubbles-right', 'Правые пузыри', 'neon-lab-bubbles-right.webp']
  ].map(([name, label, file]) => ({ name, label, image: `${assets}${file}`, lightImage: `${assets}neon-lab-light-${name.startsWith('bubbles-') ? 'bubbles' : name}.webp`, visible: true })),
    sceneAssets: sceneAssets.map(([name, label]) => ({ name, label, image: `/home-scene/${name}.webp`, visible: true })) },
  advantages: { visible: true, navLabel: 'Преимущества', eyebrow: 'ПОЧЕМУ СТОИТ УЧАСТВОВАТЬ', title: 'Почему стоит участвовать?', description: '', items: [
    { visible: true, icon: 'flask', title: 'Актуальные исследования', text: 'Новые научные данные и практические результаты.', image: '' },
    { visible: true, icon: 'layers', title: 'Презентация новинок', text: 'Знакомство с разработками Angel Wings.', image: '' },
    { visible: true, icon: 'people', title: 'Эксперты отрасли', text: 'Диалог с профильными специалистами.', image: '' },
    { visible: true, icon: 'network', title: 'Нетворкинг и партнёрства', text: 'Новые профессиональные контакты.', image: '' }
  ] },
  products: { visible: true, navLabel: 'Товары', eyebrow: 'НАШИ ПРОДУКТЫ', title: 'Ключевые решения Angel Wings', description: 'Линейка высокоактивных пептидов для научных, клинических и прикладных задач.', catalogButton: 'Перейти в каталог', catalogLink: 'https://angel-wings.ru/catalog', showAllCatalog: true, items: [
    { productId: '', visible: true, title: 'РЕТА', category: 'СНИЖЕНИЕ ВЕСА', price: '', text: '', image: '', video: '', link: '' },
    { productId: '', visible: true, title: 'UNI Бальзам', category: 'КРАСОТА И ВОССТАНОВЛЕНИЕ ТКАНЕЙ', price: '', text: '', image: '', video: '', link: '' },
    { productId: '', visible: true, title: 'Тимозин Альфа', category: 'ИММУНИТЕТ', price: '', text: '', image: '', video: '', link: '' }
  ] },
  about: { visible: true, navLabel: 'О нас', eyebrow: 'О КОМПАНИИ', title: 'Angel Wings — наука и качество', description: 'Разрабатываем и производим высокочистые пептиды по международным стандартам качества, объединяя научный подход, инновации и практическую пользу.', image: '/home-scene-light/dna.webp', video: '/about-assets/about-sphere-transparent.webm', button: 'Подробнее о компании', link: 'https://angel-wings.ru/about', stats: [
    { visible: true, value: '', label: 'лет на рынке' }, { visible: true, value: '', label: 'продуктов' }, { visible: true, value: '', label: 'специалистов доверяют нам' }
  ] },
  events: { visible: true, navLabel: 'Мероприятия', eyebrow: 'МЕРОПРИЯТИЯ', title: 'Ближайшие события', description: '', datePendingLabel: 'Дата уточняется', placePendingLabel: 'Место уточняется', items: [
    { visible: true, title: 'Научный форум Angel Wings', date: '', place: '', image: '/event-assets/forum_conference.png', video: '', link: '' },
    { visible: true, title: 'Семинар для специалистов', date: '', place: '', image: '/event-assets/forum_seminar.png', video: '', link: '' },
    { visible: true, title: 'Презентация новой линейки', date: '', place: '', image: '/event-assets/forum_launch.png', video: '', link: '' }
  ] },
  cta: { visible: true, eyebrow: '', title: 'Станьте частью сообщества Angel Wings', description: 'Участвуйте в форуме, узнавайте о новинках первыми и расширяйте профессиональные связи.', button: 'Подать заявку на участие', image: '/cta-assets/blue-wave-banner.png', video: '', leftMolecule: '/home-scene/molecule-01-diagonal.webp', rightMolecule: '/home-scene/molecule-05-cluster.webp' },
  form: { visible: true, navLabel: 'Контакты', navButton: 'Подать заявку', eyebrow: 'ЗАЯВКА НА УЧАСТИЕ', title: 'Оставьте заявку на форум', description: 'Заполните форму, и мы свяжемся с вами для подтверждения участия.', stepContactTitle: 'Контакты', stepProfileTitle: 'О вас', stepInterestsTitle: 'Интересы', nextButton: 'Продолжить', backButton: 'Назад', button: 'Отправить заявку', success: 'Заявка сохранена. Мы свяжемся с вами для подтверждения участия.', policyText: 'Согласен(на) на обработку персональных данных в соответствии с', policyLabel: 'политикой конфиденциальности', policyLink: '/policy.pdf', topMolecule: '/checkout-assets/molecule-top-right.png', bottomMolecule: '/checkout-assets/molecule-bottom-left.png', fields: [
    { key: 'name', label: 'ФИО', placeholder: 'Ваше имя и фамилия', required: true, visible: true },
    { key: 'email', label: 'E-mail', placeholder: 'name@company.ru', required: true, visible: true },
    { key: 'phone', label: 'Телефон', placeholder: '+7 (999) 000-00-00', required: true, visible: true },
    { key: 'city', label: 'Город / регион', placeholder: 'Ваш город или регион', required: true, visible: true },
    { key: 'role', type: 'select', label: 'Кто вы?', placeholder: 'Выберите вариант', required: true, visible: true, options: ['Врач / медицинский специалист', 'Нутрициолог / health-коуч', 'Представитель клиники / бизнеса', 'Учёный / исследователь', 'Пациент / интересующийся ЗОЖ', 'Другое'] },
    { key: 'position', label: 'Специальность / должность', placeholder: 'Укажите специальность или должность', required: true, visible: true },
    { key: 'company', label: 'Организация / место работы', placeholder: 'Если есть', required: false, visible: true },
    { key: 'topics', type: 'multiselect', label: 'Интересующие темы', placeholder: '', required: true, visible: true, options: ['Нутрициология и питание', 'Антивозрастная / longevity-медицина', 'Ранняя диагностика и скрининг', 'Регенеративная медицина', 'Ментальное здоровье и стресс', 'Цифровые технологии и ИИ в превенции', 'ЗОЖ и образ жизни', 'Другое'] }
  ] },
  footer: { visible: true, logo: '/angel-wings-wordmark-light.svg', navHeading: 'Навигация', infoHeading: 'Информация', contactsHeading: 'Контакты', mainSiteLabel: 'Основной сайт', privacyLabel: 'Политика конфиденциальности', telegramLabel: 'Telegram', description: 'Инновационные пептидные решения для здоровья и долголетия.', email: 'info@angel-wings.ru', phone: '+7 966 179-00-13', copyright: '© 2026 Angel Wings. Все права защищены.', mainSite: 'https://angel-wings.ru', telegram: 'https://t.me/+UwZu11Bt55FhNTIy', privacyLink: '/policy.pdf' }
}
// Keep the editor's existing section schema, while replacing the old event copy
// and default form fields for the giveaway landing page.
export const FORUM_DEFAULTS = structuredClone(LEGACY_FORUM_DEFAULTS)
Object.assign(FORUM_DEFAULTS.hero, {
  eyebrow: 'РОЗЫГРЫШ ANGEL WINGS',
  title: 'Разыгрываем\n50 000 ₽',
  description: 'Оставьте заявку на участие в розыгрыше денежного приза.',
  button: 'Участвовать в розыгрыше',
  secondaryButton: 'Как участвовать',
  penVisible: false,
  programLabel: 'Условия розыгрыша'
})
Object.assign(FORUM_DEFAULTS.advantages, {
  navLabel: 'Как участвовать',
  eyebrow: 'ВСЁ ПРОСТО',
  title: 'Как принять участие?',
  description: 'Три шага, чтобы оставить заявку на розыгрыш.',
  items: [
    { visible: true, icon: 'people', title: 'Заполните форму', text: 'Укажите имя и контакты в заявке ниже.', image: '' },
    { visible: true, icon: 'layers', title: 'Отправьте заявку', text: 'После отправки вы увидите подтверждение на странице.', image: '' },
    { visible: true, icon: 'network', title: 'Оставайтесь на связи', text: 'Контакты понадобятся, чтобы связаться с вами по итогам розыгрыша.', image: '' },
    { visible: false, icon: 'flask', title: '', text: '', image: '' }
  ]
})
FORUM_DEFAULTS.products.visible = false
FORUM_DEFAULTS.events.visible = false
Object.assign(FORUM_DEFAULTS.cta, {
  eyebrow: 'ВАШ ШАНС',
  title: '50 000 ₽ ждут победителя',
  description: 'Заполните короткую форму и отправьте заявку на участие.',
  button: 'Принять участие'
})
Object.assign(FORUM_DEFAULTS.form, {
  navLabel: 'Участие',
  navButton: 'Участвовать',
  eyebrow: 'УЧАСТИЕ В РОЗЫГРЫШЕ',
  title: 'Оставьте заявку на розыгрыш',
  description: 'Заполните форму в три шага. После отправки вы получите номер билета на экране и по почте.',
  formatVersion: 'giveaway-3-step',
  button: 'Отправить заявку',
  success: 'Заявка на участие принята.'
})
FORUM_DEFAULTS.form.fields = FORUM_DEFAULTS.form.fields.map(field => {
  if (field.key === 'name') return { ...field, label: 'Имя и фамилия', placeholder: 'Как к вам обращаться' }
  if (field.key === 'email') return { ...field, placeholder: 'name@example.ru' }
  return field
})

const restoredThreeStepFields = new Map([
  ['city', true], ['role', true], ['position', true], ['company', false], ['topics', true]
])

function migrateLegacyDefaults(value, oldValue, newValue) {
  if (Array.isArray(value) && Array.isArray(oldValue) && Array.isArray(newValue)) {
    return value.map((item, index) => {
      const key = item?.key || item?.name
      const oldIndex = key ? oldValue.findIndex(candidate => (candidate?.key || candidate?.name) === key) : index
      return oldIndex < 0 ? item : migrateLegacyDefaults(item, oldValue[oldIndex], newValue[oldIndex] ?? oldValue[oldIndex])
    })
  }
  if (value && typeof value === 'object' && oldValue && typeof oldValue === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, key in oldValue && key in newValue
      ? migrateLegacyDefaults(entry, oldValue[key], newValue[key]) : entry]))
  }
  return value === oldValue ? newValue : value
}
export const FORUM_SECTION_KEYS = Object.keys(FORUM_DEFAULTS)
const clean = (value, limit = 700) => String(value ?? '').trim().slice(0, limit)
const safeUrl = value => { const url = clean(value, 1000); return /^(https:\/\/|\/(?!\/)|#[a-z0-9_-]+$)/i.test(url) ? url : '' }
function sanitizeValue(raw, fallback, key) {
  if (typeof fallback === 'boolean') return typeof raw === 'boolean' ? raw : fallback
  if (typeof fallback === 'string') return ['image', 'lightImage', 'video', 'background', 'lightBackground', 'logo', 'topMolecule', 'bottomMolecule', 'leftMolecule', 'rightMolecule', 'link', 'secondaryLink', 'catalogLink', 'programLink', 'policyLink', 'privacyLink', 'mainSite', 'telegram'].includes(key) ? safeUrl(raw ?? fallback) : clean(raw ?? fallback, key === 'description' || key === 'text' ? 1600 : 700)
  if (Array.isArray(fallback)) {
    const source = Array.isArray(raw) ? raw : fallback
    if (key === 'options') {
      const options = [...new Set(source.slice(0, 12).map(option => clean(option, 100)).filter(Boolean))]
      return options.length ? options : fallback
    }
    if (key === 'objects' || key === 'sceneAssets' || key === 'fields') {
      const fixed = fallback.map(template => {
      const item = source.find(candidate => candidate?.[key === 'fields' ? 'key' : 'name'] === template[key === 'fields' ? 'key' : 'name']) || template
      const next = sanitizeValue(item, template)
      if (key === 'fields' && ['name', 'email', 'phone'].includes(template.key)) { next.required = true; next.visible = true }
      if (key === 'fields' && template.key === 'position' && item.label === 'Должность') {
        next.label = template.label
        if (item.placeholder === 'Ваша должность') next.placeholder = template.placeholder
      }
      if (key === 'fields' && template.key === 'company' && item.label === 'Компания / Организация') {
        next.label = template.label
        if (item.placeholder === 'Название организации') next.placeholder = template.placeholder
      }
      return next
      })
      if (key === 'objects' || key === 'sceneAssets') return fixed
      const seen = new Set(fixed.map(field => field.key))
      const extra = []
      for (const item of source) {
        if (extra.length >= 10) break
        if (!/^custom_[a-z0-9_]{1,40}$/.test(item?.key || '') || seen.has(item.key)) continue
        seen.add(item.key)
        extra.push(sanitizeValue(item, { key: '', label: '', placeholder: '', required: false, visible: true }))
      }
      return [...fixed, ...extra]
    }
    return source.slice(0, key === 'items' && fallback[0]?.productId !== undefined ? 200 : 12).map(item => sanitizeValue(item, fallback[0] || {}))
  }
  if (fallback && typeof fallback === 'object') {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
    return Object.fromEntries(Object.entries(fallback).map(([name, value]) => [name, sanitizeValue(source[name], value, name)]))
  }
  return fallback
}
export function sanitizeForumContent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Некорректное содержимое страницы')
  const migrated = migrateLegacyDefaults(input, LEGACY_FORUM_DEFAULTS, FORUM_DEFAULTS)
  if (input.form?.formatVersion !== FORUM_DEFAULTS.form.formatVersion && migrated.form) {
    if (migrated.form.description === 'Укажите имя, телефон и почту, чтобы мы могли с вами связаться.') migrated.form.description = FORUM_DEFAULTS.form.description
    migrated.form.fields = Array.isArray(migrated.form.fields) ? migrated.form.fields.map(field =>
      restoredThreeStepFields.has(field.key)
        ? { ...field, visible: true, required: restoredThreeStepFields.get(field.key) }
        : field
    ) : migrated.form.fields
    migrated.form.formatVersion = FORUM_DEFAULTS.form.formatVersion
  }
  return sanitizeValue(migrated, FORUM_DEFAULTS)
}
