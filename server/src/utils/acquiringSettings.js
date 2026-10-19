export const UNKNOWN_PAYMENT_PERCENT = 2.5

export const DEFAULT_ACQUIRING_SETTINGS = Object.freeze({
  sbpPercent: 0.4,
  cardPercent: 2.5
})

export function parseAcquiringSettings(input) {
  const result = {}
  for (const key of Object.keys(DEFAULT_ACQUIRING_SETTINGS)) {
    const value = input?.[key]
    if (typeof value === 'boolean' || value === '' || value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 100) {
      throw new Error(`${key}: укажите число от 0 до 100`)
    }
    result[key] = Number(value)
  }
  return result
}

export async function getAcquiringSettings(prisma) {
  const saved = await prisma.acquiringSettings.findUnique({ where: { id: 1 } })
  return saved
    ? { sbpPercent: saved.sbpPercent, cardPercent: saved.cardPercent }
    : DEFAULT_ACQUIRING_SETTINGS
}
