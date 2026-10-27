import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireSuperAdmin } from '../middleware/auth.js'
import { ADMIN_SECTIONS, ADMIN_SECTION_CODES, parsePermissions } from '../utils/adminPermissions.js'

const router = Router()
const prisma = new PrismaClient()
router.use(authenticate, requireSuperAdmin)

const present = (role, count = 0) => ({
  id: role.id, code: role.code, name: role.name, description: role.description,
  permissions: parsePermissions(role.permissions), usersCount: count
})

function validate(body) {
  const name = String(body?.name ?? '').trim()
  const description = String(body?.description ?? '').trim()
  const permissions = body?.permissions
  if (name.length < 2 || name.length > 60) return { error: 'Название роли: от 2 до 60 символов' }
  if (description.length > 240) return { error: 'Описание не должно превышать 240 символов' }
  if (!Array.isArray(permissions) || !permissions.length || permissions.some(value => typeof value !== 'string' || !ADMIN_SECTION_CODES.has(value))) {
    return { error: 'Выберите хотя бы один разрешённый раздел' }
  }
  return { name, description, permissions: JSON.stringify([...new Set(permissions)]) }
}

router.get('/', async (_req, res, next) => {
  try {
    const roles = await prisma.adminRole.findMany({ orderBy: { createdAt: 'asc' } })
    const counts = await Promise.all(roles.map(role => prisma.user.count({ where: { role: role.code } })))
    res.json({ sections: ADMIN_SECTIONS.map(([code, name]) => ({ code, name })), roles: roles.map((role, index) => present(role, counts[index])) })
  } catch (error) { next(error) }
})

router.post('/', async (req, res, next) => {
  try {
    const data = validate(req.body)
    if (data.error) return res.status(400).json({ error: data.error })
    const role = await prisma.adminRole.create({ data: { ...data, code: `STAFF_${randomBytes(16).toString('hex').toUpperCase()}` } })
    res.status(201).json({ role: present(role) })
  } catch (error) { next(error) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректная роль' })
    const data = validate(req.body)
    if (data.error) return res.status(400).json({ error: data.error })
    const current = await prisma.adminRole.findUnique({ where: { id } })
    if (!current) return res.status(404).json({ error: 'Роль не найдена' })
    const role = await prisma.adminRole.update({ where: { id }, data })
    res.json({ role: present(role, await prisma.user.count({ where: { role: role.code } })) })
  } catch (error) { next(error) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректная роль' })
    const role = await prisma.adminRole.findUnique({ where: { id } })
    if (!role) return res.status(404).json({ error: 'Роль не найдена' })
    if (role.code === 'COPYWRITER') return res.status(409).json({ error: 'Предустановленную роль можно настроить, но нельзя удалить' })
    if (await prisma.user.count({ where: { role: role.code } })) return res.status(409).json({ error: 'Сначала назначьте пользователям другую роль' })
    await prisma.adminRole.delete({ where: { id } })
    res.json({ message: 'Роль удалена' })
  } catch (error) { next(error) }
})

export default router
