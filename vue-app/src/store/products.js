import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const MOCK_CATEGORIES = [
  { term_id: 1, name: 'Долголетие', slug: 'longevitiya', count: 6 },
  { term_id: 2, name: 'Иммуномодуляторы', slug: 'immunomodulyatory', count: 5 },
  { term_id: 3, name: 'Нейропептиды', slug: 'neiropeptide', count: 5 },
  { term_id: 4, name: 'Факторы роста', slug: 'growth', count: 4 },
]

const MOCK_PRODUCTS = [
  {
    id: 1,
    title: 'CJC-1295',
    description: 'Пептид для увеличения выработки гормона роста. Стимулирует синтез белка и способствует наращиванию мышечной массы. Улучшает восстановление после тренировок.',
    price: 4500,
    image: 'https://picsum.photos/seed/peptid1/400/300',
    category: ['longevitiya'],
    stock: 25,
    specs: { 'Чистота': '99.9%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }
  },
  {
    id: 2,
    title: 'BPC-157',
    description: 'Пептид для заживления тканей и суставов. Ускоряет восстановление мышц, сухожилий и связок. Обладает противовоспалительным действием.',
    price: 3800,
    image: 'https://picsum.photos/seed/peptid2/400/300',
    category: ['longevitiya'],
    stock: 30,
    specs: { 'Чистота': '99.8%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }
  },
  {
    id: 3,
    title: 'TB-500',
    description: 'Пептид для восстановления мышечных тканей. Способствует заживлению ран и уменьшению воспаления. Повышает гибкость и подвижность.',
    price: 5200,
    image: 'https://picsum.photos/seed/peptid3/400/300',
    category: ['longevitiya'],
    stock: 18,
    specs: { 'Чистота': '99.5%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }
  },
  {
    id: 4,
    title: 'Epithalon',
    description: 'Пептид для замедления процессов старения. Активирует теломеразу и удлиняет теломеры. Улучшает общее самочувствие и сон.',
    price: 4800,
    image: 'https://picsum.photos/seed/peptid4/400/300',
    category: ['longevitiya'],
    stock: 22,
    specs: { 'Чистота': '99.7%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }
  },
  {
    id: 5,
    title: 'Sermorelin',
    description: 'Аналог гомона роста GHRH. Стимулирует гипофиз к выработке собственного гормона роста. Безопасен при длительном применении.',
    price: 4100,
    image: 'https://picsum.photos/seed/peptid5/400/300',
    category: ['longevitiya'],
    stock: 15,
    specs: { 'Чистота': '99.6%', 'Форма': 'Лиофилизат', 'Упаковка': '2 мг' }
  },
  {
    id: 6,
    title: 'Ipamorelin',
    description: 'Селективный аналог грелина. Стимулирует выработку гормона роста без побочных эффектов. Способствует жиросжиганию и наращиванию мышц.',
    price: 4600,
    image: 'https://picsum.photos/seed/peptid6/400/300',
    category: ['longevitiya'],
    stock: 20,
    specs: { 'Чистота': '99.9%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }
  },
  {
    id: 7,
    title: 'Thymosin Beta-4',
    description: 'Иммуномодулирующий пептид для укрепления иммунитета. Ускоряет заживление тканей и защищает от инфекций.',
    price: 5500,
    image: 'https://picsum.photos/seed/peptid7/400/300',
    category: ['immunomodulyatory'],
    stock: 12,
    specs: { 'Чистота': '99.8%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }
  },
  {
    id: 8,
    title: 'LL-37',
    description: 'Антимикробный пептид для укрепления иммунной системы. Борется с бактериями и вирусами. Поддерживает здоровье кожи.',
    price: 4900,
    image: 'https://picsum.photos/seed/peptid8/400/300',
    category: ['immunomodulyatory'],
    stock: 8,
    specs: { 'Чистота': '99.5%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }
  },
  {
    id: 9,
    title: 'Immuno-Peptide',
    description: 'Комплексный пептид для поддержки иммунитета. Повышает устойчивость к инфекциям и стрессам.',
    price: 4200,
    image: 'https://picsum.photos/seed/peptid9/400/300',
    category: ['immunomodulyatory'],
    stock: 16,
    specs: { 'Чистота': '99.7%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }
  },
  {
    id: 10,
    title: 'Colonocyte-Pep',
    description: 'Пептид для здоровья кишечника и иммунитета. Восстанавливает слизистую ЖКТ. Улучшает пищеварение.',
    price: 3700,
    image: 'https://picsum.photos/seed/peptid10/400/300',
    category: ['immunomodulyatory'],
    stock: 14,
    specs: { 'Чистота': '99.6%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }
  },
  {
    id: 11,
    title: 'Liver-Pep',
    description: 'Пептид для поддержки печени и детоксикации. Защищает гепатоциты и улучшает функцию печени.',
    price: 4400,
    image: 'https://picsum.photos/seed/peptid11/400/300',
    category: ['immunomodulyatory'],
    stock: 10,
    specs: { 'Чистота': '99.8%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }
  },
  {
    id: 12,
    title: 'Selank',
    description: 'Анксиолитический пептид для снижения тревожности. Улучшает настроение и когнитивные функции. Не вызывает привыкания.',
    price: 5300,
    image: 'https://picsum.photos/seed/peptid12/400/300',
    category: ['neiropeptide'],
    stock: 20,
    specs: { 'Чистота': '99.9%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }
  },
  {
    id: 13,
    title: 'Semax',
    description: 'Нейропептид для улучшения мозговой деятельности. Повышает концентрацию и память. Защищает нейроны от повреждений.',
    price: 4800,
    image: 'https://picsum.photos/seed/peptid13/400/300',
    category: ['neiropeptide'],
    stock: 25,
    specs: { 'Чистота': '99.7%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }
  },
  {
    id: 14,
    title: 'Dihexa',
    description: 'Пептид для улучшения памяти и обучения. Стимулирует рост нейронов и синаптическую пластичность.',
    price: 6800,
    image: 'https://picsum.photos/seed/peptid14/400/300',
    category: ['neiropeptide'],
    stock: 7,
    specs: { 'Чистота': '99.5%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }
  },
  {
    id: 15,
    title: 'Noopept',
    description: 'Синтетический ноотропный пептид. Улучшает когнитивные функции и переносимость стресса. Действует быстро и эффективно.',
    price: 3500,
    image: 'https://picsum.photos/seed/peptid15/400/300',
    category: ['neiropeptide'],
    stock: 30,
    specs: { 'Чистота': '99.8%', 'Форма': 'Лиофилизат', 'Упаковка': '10 мг' }
  },
  {
    id: 16,
    title: 'Sleep-Peptide',
    description: 'Пептид для улучшения качества сна. Регулирует циркадные ритмы. Помогает при бессоннице и стрессе.',
    price: 3900,
    image: 'https://picsum.photos/seed/peptid16/400/300',
    category: ['neiropeptide'],
    stock: 18,
    specs: { 'Чистота': '99.6%', 'Форма': 'Лиофилизат', 'Упаковка': '5 мг' }
  },
  {
    id: 17,
    title: 'IGF-1 LR3',
    description: 'Фактор роста для наращивания мышечной массы. Стимулирует синтез белка и гипертрофию мышц.',
    price: 6200,
    image: 'https://picsum.photos/seed/peptid17/400/300',
    category: ['growth'],
    stock: 14,
    specs: { 'Чистота': '99.9%', 'Форма': 'Лиофилизат', 'Упаковка': '1 мг' }
  },
  {
    id: 18,
    title: 'Follistatin 344',
    description: 'Миостатин-ингибирующий пептид. Блокирует миостатин и способствует росту мышц. Увеличивает силу и выносливость.',
    price: 7500,
    image: 'https://picsum.photos/seed/peptid18/400/300',
    category: ['growth'],
    stock: 9,
    specs: { 'Чистота': '99.7%', 'Форма': 'Лиофилизат', 'Упаковка': '1 мг' }
  },
  {
    id: 19,
    title: 'MGF',
    description: 'Механический фактор роста для локального роста мышц. Активирует стволовые клетки в поврежденных мышцах.',
    price: 5400,
    image: 'https://picsum.photos/seed/peptid19/400/300',
    category: ['growth'],
    stock: 11,
    specs: { 'Чистота': '99.8%', 'Форма': 'Лиофилизат', 'Упаковка': '2 мг' }
  },
  {
    id: 20,
    title: 'HGH Fragment 176-191',
    description: 'Жиросжигающий пептид для похудения. Ускоряет липолиз и формирует фигуру. Не влияет на уровень сахара в крови.',
    price: 5800,
    image: 'https://picsum.photos/seed/peptid20/400/300',
    category: ['growth'],
    stock: 16,
    specs: { 'Чистота': '99.6%', 'Форма': 'Лиофилизат', 'Упаковка': '2 мг' }
  },
]

export const useProductStore = defineStore('products', () => {
  const products = ref([...MOCK_PRODUCTS])
  const categories = ref([...MOCK_CATEGORIES])
  const loading = ref(false)
  const error = ref(null)
  
  const API_URL = '/wp-json/peptidi/v1'
  
  async function fetchProducts(category = '') {
    if (category) {
      products.value = MOCK_PRODUCTS.filter(p => p.category.includes(category))
    } else {
      products.value = [...MOCK_PRODUCTS]
    }
  }
  
  async function fetchCategories() {
    categories.value = [...MOCK_CATEGORIES]
  }
  
  async function createProduct(data) {
    const newProduct = {
      id: MOCK_PRODUCTS.length + 1,
      ...data,
      stock: data.stock || 100,
      specs: {}
    }
    MOCK_PRODUCTS.push(newProduct)
    products.value = [...MOCK_PRODUCTS]
    return { id: newProduct.id }
  }
  
  async function deleteProduct(id) {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id)
    if (index > -1) {
      MOCK_PRODUCTS.splice(index, 1)
      products.value = [...MOCK_PRODUCTS]
    }
  }
  
  async function createCategory(data) {
    const newCat = {
      term_id: MOCK_CATEGORIES.length + 1,
      count: 0,
      ...data
    }
    MOCK_CATEGORIES.push(newCat)
    categories.value = [...MOCK_CATEGORIES]
    return { id: newCat.term_id }
  }
  
  async function deleteCategory(id) {
    const index = MOCK_CATEGORIES.findIndex(c => c.term_id === id)
    if (index > -1) {
      MOCK_CATEGORIES.splice(index, 1)
      categories.value = [...MOCK_CATEGORIES]
    }
  }
  
  async function createOrder(items, customer) {
    return { success: true }
  }
  
  return { products, categories, loading, error, fetchProducts, fetchCategories, createProduct, deleteProduct, createCategory, deleteCategory, createOrder }
})