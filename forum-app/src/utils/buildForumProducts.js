const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ru-RU')

export function buildForumProducts(catalog, settings = {}) {
  const selections = settings.items || []
  const valid = (catalog || []).filter(product => product?.id && product.active !== false &&
    !/тестов|test/i.test(product.description || '') && !/picsum\.photos|placeholder/i.test(product.image || ''))
  const findSelection = product => selections.find(item =>
    item.productId ? String(item.productId) === String(product.id) : normalize(item.title) === normalize(product.title))
  const featured = selections.map(item => valid.find(product =>
    item.productId ? String(item.productId) === String(product.id) : normalize(item.title) === normalize(product.title)))
    .filter(Boolean)
  const ordered = settings.showAllCatalog === false
    ? featured
    : [...featured, ...valid.filter(product => !featured.some(picked => picked.id === product.id))]

  return ordered.filter((product, index) =>
    ordered.findIndex(candidate => candidate.id === product.id) === index &&
    findSelection(product)?.visible !== false)
    .map(product => {
      const item = findSelection(product) || {}
      const sourceImage = item.image || product.image || ''
      const image = sourceImage.startsWith('/uploads/') ? `https://angel-wings.ru${sourceImage}` : sourceImage
      return {
        ...product,
        title: item.title || product.title,
        category: item.category || product.category || '',
        categories: item.category ? [{ name: item.category }] : product.categories,
        image,
        video: item.video || '',
        text: item.text || (product.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        price: item.price || product.price || null,
        link: item.link || `https://angel-wings.ru/product/${product.id}`
      }
    })
}
