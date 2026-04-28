import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import categoryRoutes from './routes/categories.js'
import orderRoutes from './routes/orders.js'
import adminRoutes from './routes/admin.js'
import { errorHandler } from './middleware/errorHandler.js'
import { uploadDir } from './utils/fileUpload.js'

dotenv.config()

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(uploadDir))

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})