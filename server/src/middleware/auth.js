import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { isCustomAdminRole, parsePermissions, sectionsForAdminRequest } from '../utils/adminPermissions.js'

const prisma = new PrismaClient()

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Short-lived email challenges are not API session tokens.
  if (decoded.purpose && decoded.purpose !== 'session') {
    return res.status(401).json({ error: 'Invalid token' })
  }

  try {
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, telegramId: true, email: true, name: true, role: true, phone: true, address: true, pointsBalance: true, emailVerified: true, marketingConsentAt: true, marketingUnsubscribedAt: true, createdAt: true }
    })
    
    if (!user || user.role === 'DELETED') {
      return res.status(401).json({ error: 'User not found' })
    }
    
    req.user = user
    req.auth = decoded
    if (isCustomAdminRole(user.role) && decoded.adminPanel === true) {
      const staffRole = await prisma.adminRole.findUnique({ where: { code: user.role }, select: { permissions: true } })
      if (!staffRole) return res.status(401).json({ error: 'Роль больше не доступна' })
      req.adminPermissions = parsePermissions(staffRole.permissions)
    }
    next()
  } catch (error) {
    next(error)
  }
}

export const requireAdmin = (req, res, next) => {
  if (req.user.role === 'ADMIN') return next()
  const sections = sectionsForAdminRequest(req.originalUrl, req.method)
  if (req.auth?.adminPanel === true && sections.some(section => req.adminPermissions?.includes(section))) return next()
  return res.status(403).json({ error: 'Нет доступа к этому разделу' })
}

export const requireSuperAdmin = (req, res, next) => (req.user?.role === 'ADMIN' && req.auth?.adminPanel === true)
  ? next()
  : res.status(403).json({ error: 'Только администратор может управлять ролями' })

export const isAdminPanelRole = role => role === 'ADMIN' || isCustomAdminRole(role)

export const requireBlogEditor = (req, res, next) => {
  if (req.user?.role !== 'ADMIN' && !(req.auth?.adminPanel === true && req.adminPermissions?.includes('BLOG'))) {
    return res.status(403).json({ error: 'Blog access required' })
  }
  next()
}

export const requirePartner = (req, res, next) => {
  if (req.user.role !== 'PARTNER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Partner access required' })
  }
  next()
}
