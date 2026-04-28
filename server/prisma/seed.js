import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const categories = [
  { name: 'Долголетие', slug: 'longevitiya', description: 'Пептиды для продления жизни и замедления старения' },
  { name: 'Иммуномодуляторы', slug: 'immunomodulyatory', description: 'Пептиды для укрепления иммунной системы' },
  { name: 'Нейропептиды', slug: 'neiropeptide', description: 'Пептиды для улучшения работы мозга' },
  { name: 'Факторы роста', slug: 'growth', description: 'Пептиды для роста мышц и восстановления' }
]

const products = [
  { title: 'CJC-1295', slug: 'cjc-1295', description: 'Пептид для увеличения выработки гормона роста. Стимулирует синтез белка и способствует наращиванию мышечной массы. Улучшает восстановление после тренировок.', price: 4500, stock: 25, specs: { 'Чистота': '99.9%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }, categorySlug: 'longevitiya' },
  { title: 'BPC-157', slug: 'bpc-157', description: 'Пептид для заживления тканей и суставов. Ускоряет восстановление мышц, сухожилий и связок. Обладает противовоспалительным действием.', price: 3800, stock: 30, specs: { 'Чистота': '99.8%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }, categorySlug: 'longevitiya' },
  { title: 'TB-500', slug: 'tb-500', description: 'Пептид для восстановления мышечных тканей. Способствует заживлению ран и уменьшению воспаления. Повышает гибкость и подвижность.', price: 5200, stock: 18, specs: { 'Чистота': '99.5%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }, categorySlug: 'longevitiya' },
  { title: 'Epithalon', slug: 'epithalon', description: 'Пептид для замедления процессов старения. Активирует теломеразу и удлиняет теломеры. Улучшает общее самочувствие и сон.', price: 4800, stock: 22, specs: { 'Чистота': '99.7%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }, categorySlug: 'longevitiya' },
  { title: 'Sermorelin', slug: 'sermorelin', description: 'Аналог гомона роста GHRH. Стимулирует гипофиз к выработке собственного гормона роста. Безопасен при длительном применении.', price: 4100, stock: 15, specs: { 'Чистота': '99.6%', 'Форма': 'Лиофилизат', 'Упаковка': '2 мг' }, categorySlug: 'longevitiya' },
  { title: 'Ipamorelin', slug: 'ipamorelin', description: 'Селективный аналог грелина. Стимулирует выработку гормона роста без побочных эффектов. Способствует жиросжиганию и наращиванию мышц.', price: 4600, stock: 20, specs: { 'Чистота': '99.9%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }, categorySlug: 'longevitiya' },
  { title: 'Thymosin Beta-4', slug: 'thymosin-beta-4', description: 'Иммуномодулирующий пептид для укрепления иммунитета. Ускоряет заживление тканей и защищает от инфекций.', price: 5500, stock: 12, specs: { 'Чистота': '99.8%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }, categorySlug: 'immunomodulyatory' },
  { title: 'LL-37', slug: 'll-37', description: 'Антимикробный пептид для укрепления иммунной системы. Борется с бактериями и вирусами. Поддерживает здоровье кожи.', price: 4900, stock: 8, specs: { 'Чистота': '99.5%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }, categorySlug: 'immunomodulyatory' },
  { title: 'Immuno-Peptide', slug: 'immuno-peptide', description: 'Комплексный пептид для поддержки иммунитета. Повышает устойчивость к инфекциям и стрессам.', price: 4200, stock: 16, specs: { 'Чистота': '99.7%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }, categorySlug: 'immunomodulyatory' },
  { title: 'Selank', slug: 'selank', description: 'Анксиолитический пептид для снижения тревожности. Улучшает настроение и когнитивные функции. Не вызывает привыкания.', price: 5300, stock: 20, specs: { 'Чистота': '99.9%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }, categorySlug: 'neiropeptide' },
  { title: 'Semax', slug: 'semax', description: 'Нейропептид для улучшения мозговой деятельности. Повышает концентрацию и память. Защищает нейроны от повреждений.', price: 4800, stock: 25, specs: { 'Чистота': '99.7%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }, categorySlug: 'neiropeptide' },
  { title: 'Dihexa', slug: 'dihexa', description: 'Пептид для улучшения памяти и обучения. Стимулирует рост нейронов и синаптическую пластичность.', price: 6800, stock: 7, specs: { 'Чистота': '99.5%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }, categorySlug: 'neiropeptide' },
  { title: 'IGF-1 LR3', slug: 'igf-1-lr3', description: 'Фактор роста для наращивания мышечной массы. Стимулирует синтез белка и гипертрофию мышц.', price: 6200, stock: 14, specs: { 'Чистота': '99.9%', 'Форма': 'Лиофилизат', 'Упаковка': '1 мг' }, categorySlug: 'growth' },
  { title: 'Follistatin 344', slug: 'follistatin-344', description: 'Миостатин-ингибирующий пептид. Блокирует миостатин и способствует росту мышц. Увеличивает силу и выносливость.', price: 7500, stock: 9, specs: { 'Чистота': '99.7%', 'Форма': 'Лиофилизат', 'Упаковка': '1 мг' }, categorySlug: 'growth' },
  { title: 'HGH Fragment 176-191', slug: 'hgh-fragment-176-191', description: 'Жиросжигающий пептид для похудения. Ускоряет липолиз и формирует фигуру. Не влияет на уровень сахара в крови.', price: 5800, stock: 16, specs: { 'Чистота': '99.6%', 'Форма': 'Лиофилизат', 'Упаковка': '2 мг' }, categorySlug: 'growth' }
]

async function main() {
  console.log('Seeding database...')
  
  const adminPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@peptidi.shop' },
    update: {},
    create: {
      email: 'admin@peptidi.shop',
      password: adminPassword,
      name: 'Администратор',
      role: 'ADMIN'
    }
  })
  
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    })
  }
  
  const cats = await prisma.category.findMany()
  const catMap = new Map(cats.map(c => [c.slug, c.id]))
  
  for (const prod of products) {
    const categoryId = catMap.get(prod.categorySlug)
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: {
        title: prod.title,
        slug: prod.slug,
        description: prod.description,
        price: prod.price,
        stock: prod.stock,
        specs: JSON.stringify(prod.specs),
        sku: prod.slug.toUpperCase(),
        image: `https://picsum.photos/seed/${prod.slug}/400/300`,
        active: true,
        categories: { connect: { id: categoryId } }
      }
    })
  }
  
  console.log('Seeding completed!')
  console.log('Admin login: admin@peptidi.shop / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())