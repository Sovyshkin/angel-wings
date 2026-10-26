import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const published = process.env.BLOG_SEED_PUBLISHED === '1'
const examples = [
  { title: 'Пептиды: как читать научные публикации', slug: 'kak-chitat-issledovaniya-peptidov', excerpt: 'Разбираемся, как отделить результаты исследования от рекламных обещаний и на что обратить внимание в первоисточнике.', cover: 'dna-molecules.webp', category: 'issledovaniya', featured: true, headings: ['С чего начать', 'Что проверить в методике'], text: 'Начните с полного текста публикации, а не только с заголовка или краткого пересказа. Посмотрите, какой именно объект изучался и какие результаты измеряли. Обратите внимание на ограничения исследования и на то, совпадает ли вывод автора с представленными данными.' },
  { title: 'Пептиды и работа мозга: вопросы к исследованиям', slug: 'peptidy-i-issledovaniya-mozga', excerpt: 'Как разобраться в публикациях о нервной системе и не делать поспешных выводов по отдельным экспериментам.', cover: 'neural-network.webp', category: 'zdorove', headings: ['Модель исследования', 'Границы выводов'], text: 'Результаты лабораторной модели нельзя автоматически переносить на человека. Для оценки практической значимости важно знать дизайн исследования, число участников и критерии результата. Если этих сведений нет, уверенный вывод делать рано.' },
  { title: 'Спорт и восстановление: как оценивать данные', slug: 'sport-i-vosstanovlenie-dannye', excerpt: 'Краткий ориентир по исследовательским данным, когда речь идёт о нагрузках и восстановлении.', cover: 'sport.webp', category: 'vosstanovlenie', headings: ['Сравнение групп', 'Что ещё влияет на результат'], text: 'На результат могут влиять тренировки, питание, сон и множество других факторов. Хорошее исследование описывает их и объясняет, с чем сравнивали наблюдения. Отдельная история успеха не заменяет контролируемые данные.' },
  { title: 'Кожа и пептиды: как отличать факты от обещаний', slug: 'kozha-i-peptidy-fakty', excerpt: 'Что стоит проверить в описании косметических исследований и почему важны формула и условия испытания.', cover: 'skin.webp', category: 'zdorove', headings: ['Что исследовали', 'Как оценивали изменения'], text: 'Название ингредиента само по себе не описывает готовый продукт. Для понимания результата важно знать состав, способ применения и способ измерения изменений. Сравнивайте утверждения с первоисточником и условиями эксперимента.' },
  { title: 'Как устроен контроль качества образцов', slug: 'kontrol-kachestva-obraztsov', excerpt: 'Понятное введение в лабораторные показатели, документы и прослеживаемость исследовательских образцов.', cover: 'laboratory.webp', category: 'issledovaniya', headings: ['Партия и документы', 'Методы проверки'], text: 'Для каждого образца важно иметь идентификацию партии и документацию с описанием проведённых проверок. Разные аналитические методы отвечают на разные вопросы. Уточняйте, какие именно параметры измерены и какие критерии указаны в документах.' },
  { title: 'Сон и восстановление: как читать исследования', slug: 'son-i-vosstanovlenie-issledovaniya', excerpt: 'Какие вопросы помогают оценить материалы о сне, восстановлении и самочувствии.', cover: 'sleep.webp', category: 'sovety', headings: ['Что измеряли', 'Почему важен контекст'], text: 'Исследования сна могут использовать разные показатели: самоотчёт, дневник или инструментальные измерения. Эти способы не всегда взаимозаменяемы. Проверяйте, кто участвовал в исследовании и какие ограничения указали авторы.' },
  { title: 'Иммунная система: как не потеряться в терминах', slug: 'immunnaya-sistema-i-terminy', excerpt: 'Ориентир по понятиям, которые встречаются в публикациях, и по границам лабораторных результатов.', cover: 'dna-molecules.webp', category: 'peptidy', headings: ['Термины и показатели', 'Контекст эксперимента'], text: 'Один биомаркер не описывает состояние всей иммунной системы. Читайте, как авторы определяют термины и какие именно показатели они изучали. Обобщение за пределами исходного эксперимента требует дополнительных данных.' }
]

try {
  for (const item of examples) {
    const category = await prisma.blogCategory.findUnique({ where: { slug: item.category } })
    if (!category) continue
    const existing = await prisma.blogPost.findUnique({ where: { slug: item.slug } })
    if (existing) continue
    const content = `<h2>${item.headings[0]}</h2><p>${item.text}</p><h2>${item.headings[1]}</h2><p>Проверяйте дату публикации, источник данных и доступность полного текста. Материал носит информационный характер и не является медицинской рекомендацией.</p>`
    await prisma.blogPost.create({ data: {
      title: item.title, slug: item.slug, excerpt: item.excerpt, content,
      cover: `/blog-assets/${item.cover}`, coverAlt: item.title,
      categoryId: category.id, featured: item.featured,
      status: published ? 'PUBLISHED' : 'DRAFT', publishedAt: published ? new Date() : null,
      readingMinutes: 1
    } })
  }
  console.log(`[DB] Example blog articles added as ${published ? 'published' : 'drafts'}; existing articles were not changed`)
} finally { await prisma.$disconnect() }
