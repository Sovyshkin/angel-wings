import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

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
      select: { id: true, email: true, name: true, role: true, phone: true, address: true, pointsBalance: true, emailVerified: true, marketingConsentAt: true, marketingUnsubscribedAt: true, createdAt: true }
    })
    
    if (!user || user.role === 'DELETED') {
      return res.status(401).json({ error: 'User not found' })
    }
    
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

export const requirePartner = (req, res, next) => {
  if (req.user.role !== 'PARTNER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Partner access required' })
  }
  next()
}
