import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

// Парсим CSV
function parseCSV(content) {
  const lines = []
  let currentLine = ''
  let inQuotes = false
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine)
      }
      currentLine = ''
    } else {
      currentLine += char
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine)
  }
  
  return lines
}

async function main() {
  const csvPath = path.join(__dirname, 'products-with-descriptions.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  
  const lines = parseCSV(csvContent)
  
  const products = []
  const seenSlugs = new Set()
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    
    const parts = []
    let current = ''
    let inQuotes = false
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    parts.push(current.trim())
    
    const title = parts[0]?.trim()
    const price = parseInt(parts[1]) || 0
    const volume = parts[2]?.trim() || ''
    const purity = parts[3]?.trim() || ''
    const country = parts[4]?.trim() || 'Россия'
    const description = parts[5]?.trim() || ''
    
    if (title && price > 0) {
      let slug = title.toLowerCase().replace(/[^а-яa-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      
      // Делаем slug уникальным
      let counter = 1
      let uniqueSlug = slug
      while (seenSlugs.has(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }
      seenSlugs.add(uniqueSlug)
      
      const sku = `PRD-${Date.now()}-${i}`
      products.push({ title, slug: uniqueSlug, price, volume, purity: purity ? `${purity}%` : '', country, description, sku })
    }
  }
  
  console.log(`Товаров в CSV: ${products.length}`)
  
  // Получаем все slug из CSV
  const csvSlugs = products.map(p => p.slug)
  
  // Удаляем связанные записи и товары
  console.log('Удаляю связанные записи и товары...')
  await prisma.orderItem.deleteMany({})
  await prisma.product.deleteMany({})
  console.log('Все товары удалены')
  
  // Находим или создаём категорию "Долголетие"
  let category = await prisma.category.findFirst({
    where: { slug: 'longevitiya' }
  })
  
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Долголетие',
        slug: 'longevitiya',
        description: 'Пептиды для продления жизни и замедления старения',
        active: true
      }
    })
  }
  
  // Создаём товары из CSV
  for (const prod of products) {
    await prisma.product.create({
      data: {
        title: prod.title,
        slug: prod.slug,
        price: prod.price,
        volume: prod.volume || null,
        purity: prod.purity || null,
        country: prod.country || null,
        description: prod.description,
        specs: JSON.stringify({
          ...(prod.purity ? { 'Чистота': prod.purity } : {}),
          ...(prod.volume ? { 'Объём': prod.volume } : {})
        }),
        stock: 99,
        active: true,
        sku: prod.sku,
        categories: { connect: { id: category.id } }
      }
    })
    console.log(`✓ ${prod.title}`)
  }
  
  console.log(`\nГотово! Создано ${products.length} товаров из CSV`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())