export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export async function findUserByEmail(prisma, value) {
  const email = normalizeEmail(value)
  if (!email) return null

  const exactUser = await prisma.user.findUnique({ where: { email } })
  if (exactUser) return exactUser

  // Older admin-created accounts could retain uppercase letters in SQLite.
  const matches = await prisma.$queryRaw`
    SELECT "id"
    FROM "users"
    WHERE LOWER("email") = ${email}
    LIMIT 1
  `

  const userId = Number(matches?.[0]?.id)
  if (!Number.isFinite(userId)) return null

  return prisma.user.findUnique({ where: { id: userId } })
}
