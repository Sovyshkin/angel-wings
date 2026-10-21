function parseCalendarDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date
}

// Report dates are calendar days in Moscow, matching the order dates shown in admin.
export function parseReportPeriod(query = {}) {
  const dateFrom = query.dateFrom || ''
  const dateTo = query.dateTo || ''
  if (!dateFrom && !dateTo) return {}
  const from = parseCalendarDay(dateFrom)
  const to = parseCalendarDay(dateTo)
  if (!from || !to || from > to) {
    const error = new Error('Укажите корректный период: дата начала не позже даты окончания')
    error.status = 400
    throw error
  }
  const nextDay = new Date(to.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return {
    createdAt: {
      gte: new Date(`${dateFrom}T00:00:00+03:00`),
      lt: new Date(`${nextDay}T00:00:00+03:00`)
    }
  }
}
