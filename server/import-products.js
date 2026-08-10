import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

// Парсим CSV правильно (с учётом кавычек и переносов строк)
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
  // Используем файл с описаниями
  const csvPath = path.join(__dirname, 'products-with-descriptions.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  
  const lines = parseCSV(csvContent)
  
  // Пропускаем заголовок
  const products = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    
    // Разделяем по запятым
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
    const country = parts[4]?.trim() || 'Россия'
    const description = parts[5]?.trim() || ''
    
    if (title && price > 0) {
      const slug = title.toLowerCase().replace(/[^а-яa-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      
      products.push({
        title,
        slug,
        price,
        country,
        description
      })
    }
  }
  
  console.log(`Найдено ${products.length} товаров для импорта`)
  
  // Находим категорию "Долголетие" или создаём
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
    console.log('Создана категория "Долголетие"')
  }
  
  let imported = 0
  let updated = 0
  
  for (const prod of products) {
    const existing = await prisma.product.findUnique({ where: { slug: prod.slug } })
    
    if (existing) {
      await prisma.product.update({
        where: { slug: prod.slug },
        data: {
          title: prod.title,
          price: prod.price,
          country: prod.country || null,
          description: prod.description,
          specs: '{}',
          stock: 99,
          active: true
        }
      })
      updated++
    } else {
      await prisma.product.create({
        data: {
          title: prod.title,
          slug: prod.slug,
          price: prod.price,
          country: prod.country || null,
          description: prod.description,
          specs: '{}',
          stock: 99,
          active: true,
          sku: prod.slug.toUpperCase(),
          categories: { connect: { id: category.id } }
        }
      })
      imported++
    }
    
    console.log(`✓ ${prod.title}${prod.description ? ' [с описанием]' : ' [без описания]'}`)
  }
  
  console.log(`\nГотово! Импортировано: ${imported}, обновлено: ${updated}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
