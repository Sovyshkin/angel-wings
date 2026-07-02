import { PrismaClient } from '@prisma/client'
import { findUserByEmail, normalizeEmail } from '../src/utils/userEmail.js'

const prisma = new PrismaClient()
const requestedEmail = String(process.argv[2] || 'Nickkirillov001@gmail.com').trim()
const normalizedTargetEmail = normalizeEmail(requestedEmail)

if (!normalizedTargetEmail || !normalizedTargetEmail.includes('@')) {
  console.error('Укажите корректный email администратора')
  process.exitCode = 1
} else {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      orderBy: { id: 'asc' }
    })

    if (!admin) {
      throw new Error('Администратор не найден')
    }

    const occupied = await findUserByEmail(prisma, normalizedTargetEmail)
    if (occupied && occupied.id !== admin.id) {
      throw new Error('Этот email уже используется другим аккаунтом')
    }

    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: {
        email: requestedEmail,
        emailVerified: true
      },
      select: { id: true, email: true, role: true }
    })

    console.log(`Email администратора #${updated.id} изменён на ${updated.email}`)
  } catch (error) {
    console.error(error.message || error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}
