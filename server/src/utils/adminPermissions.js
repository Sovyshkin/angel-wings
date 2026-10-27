export const ADMIN_SECTIONS = Object.freeze([
  ['DASHBOARD', 'Dashboard'], ['PRODUCTS', 'Товары'], ['ANALYTICS', 'Аналитика'],
  ['CATEGORIES', 'Категории'], ['BLOG', 'Блог'], ['ORDERS', 'Заказы'],
  ['CONSULTATIONS', 'Консультации'], ['POINTS', 'Баллы'], ['PARTNERS', 'Партнёры'],
  ['APPLICATIONS', 'Заявки'], ['PAYOUTS', 'Выплаты'], ['DEALERS', 'Дилеры'],
  ['PROMO', 'Промокоды'], ['EMAIL', 'Рассылки'], ['CDEK', 'СДЭК']
])

export const ADMIN_SECTION_CODES = new Set(ADMIN_SECTIONS.map(([code]) => code))
export const isCustomAdminRole = role => /^STAFF_[A-F0-9]{32}$/.test(String(role || ''))

export function parsePermissions(value) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(code => ADMIN_SECTION_CODES.has(code)) : []
  } catch {
    return []
  }
}

// A closed allowlist: an unclassified admin endpoint remains super-admin only.
export function sectionsForAdminRequest(url, method = 'GET') {
  const path = String(url || '').split('?')[0]
  if (path.startsWith('/api/admin/roles')) return []
  if (path === '/api/admin/users') return method === 'GET' ? ['POINTS', 'ORDERS'] : []
  if (path.startsWith('/api/admin/users/')) return []
  if (path === '/api/admin/products') return method === 'GET' ? ['PRODUCTS', 'POINTS', 'ORDERS'] : ['PRODUCTS']
  if (path === '/api/admin/partners') return method === 'GET' ? ['PARTNERS', 'POINTS', 'PROMO'] : ['PARTNERS']
  if (path.startsWith('/api/admin/contact-requests')) return ['APPLICATIONS']
  if (path.startsWith('/api/admin/acquiring-settings') || path.startsWith('/api/admin/analytics/') || path.startsWith('/api/analytics/')) return ['ANALYTICS']
  if (path === '/api/admin/stats') return ['DASHBOARD']
  if (path.startsWith('/api/admin/partner-applications')) return ['APPLICATIONS']
  if (path.startsWith('/api/admin/email-campaigns') || path.startsWith('/api/admin/recovery/')) return ['EMAIL']
  if (path.startsWith('/api/admin/orders') || path.startsWith('/api/orders/')) return ['ORDERS']
  if (path.startsWith('/api/admin/products') || path.startsWith('/api/products/')) return ['PRODUCTS']
  if (path.startsWith('/api/admin/consultations')) return ['CONSULTATIONS', 'APPLICATIONS']
  if (path.startsWith('/api/admin/points')) return ['POINTS']
  if (path.startsWith('/api/admin/partners/payments')) return ['PAYOUTS']
  if (path.startsWith('/api/admin/partners/promo-codes')) return ['PROMO']
  if (path.startsWith('/api/admin/partners/orders-export/')) return ['PARTNERS', 'ORDERS']
  if (path.startsWith('/api/admin/partners/partner-users') || path.startsWith('/api/admin/partners/commissions') || path.startsWith('/api/admin/partners/')) return ['PARTNERS']
  if (path.startsWith('/api/admin/dealers')) return ['DEALERS']
  if (path.startsWith('/api/delivery/boxes')) return ['CDEK']
  if (path === '/api/products') return ['PRODUCTS']
  if (path === '/api/categories' || path.startsWith('/api/categories/')) return ['CATEGORIES']
  if (path.startsWith('/api/delivery/orders') || path.startsWith('/api/delivery/courier') || path === '/api/delivery/balance') return ['CDEK']
  return []
}
