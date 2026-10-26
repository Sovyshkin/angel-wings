const origin = 'https://angel-wings.ru'

function setMeta(key, value, attribute = 'name') {
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute(attribute, key)
    document.head.appendChild(node)
  }
  node.content = value || ''
}

export function setBlogSeo({ title, description, path, image, article, index = true }) {
  document.title = `${title} — ANGEL WINGS`
  setMeta('description', description)
  setMeta('robots', index ? 'index,follow' : 'noindex,follow')
  setMeta('og:type', article ? 'article' : 'website', 'property')
  setMeta('og:title', title, 'property')
  setMeta('og:description', description, 'property')
  setMeta('og:url', `${origin}${path}`, 'property')
  setMeta('og:image', image?.startsWith('/') ? `${origin}${image}` : image || `${origin}/blog-assets/dna-molecules.webp`, 'property')
  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = `${origin}${path}`
  document.getElementById('blog-jsonld')?.remove()
  if (article) {
    const script = document.createElement('script')
    script.id = 'blog-jsonld'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Article', headline: article.title,
      description, image: image?.startsWith('/') ? `${origin}${image}` : image,
      datePublished: article.publishedAt, dateModified: article.updatedAt,
      author: { '@type': 'Person', name: article.author },
      publisher: { '@type': 'Organization', name: 'ANGEL WINGS', url: origin },
      mainEntityOfPage: `${origin}${path}`
    })
    document.head.appendChild(script)
  }
}

export function clearBlogSeo() {
  document.getElementById('blog-jsonld')?.remove()
  document.head.querySelector('link[rel="canonical"]')?.remove()
}
