import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Pagination from '../components/Pagination'
import ProductCard from '../components/ProductCard'
import { getCategoryName } from '../data/catalog'

const PRODUCTS_PER_PAGE = 8

function Catalog({
  products,
  onAdd,
  onPreview,
  canPurchase = true,
  onWishlist,
  wishlistIds = new Set(),
  title = 'Catalog',
  heading = 'Shop fabrics, finished garments, and textile accessories.',
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState('All')
  const [page, setPage] = useState(1)
  const query = searchParams.get('search') || ''

  useEffect(() => {
    setPage(1)
  }, [activeCategory, query])

  const categories = useMemo(() => {
    return ['All', ...new Set(products.map(getCategoryName))]
  }, [products])

  const updateQuery = (nextQuery) => {
    const nextParams = new URLSearchParams(searchParams)
    const trimmedQuery = nextQuery.trimStart()

    if (trimmedQuery) {
      nextParams.set('search', trimmedQuery)
    } else {
      nextParams.delete('search')
    }

    setSearchParams(nextParams, { replace: true })
  }

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return products.filter((product) => {
      const categoryMatch = activeCategory === 'All' || getCategoryName(product) === activeCategory
      const text = `${product.name} ${product.description} ${getCategoryName(product)}`.toLowerCase()
      return categoryMatch && (!normalizedQuery || text.includes(normalizedQuery))
    })
  }, [activeCategory, products, query])

  const totalPages = Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE)
  const pageProducts = visibleProducts.slice(
    (page - 1) * PRODUCTS_PER_PAGE,
    page * PRODUCTS_PER_PAGE,
  )

  const goToPage = (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages)
    setPage(safePage)
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main>
      <section className="page-hero">
        <p className="eyebrow">{title}</p>
        <h1>{heading}</h1>
      </section>

      <section className="toolbar" id="catalog">
        <div>
          <p className="eyebrow">Browse</p>
          <h2>{visibleProducts.length} styles</h2>
        </div>
        <form
          className="search-field"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="cotton, kurta, saree"
            aria-label="Search catalog"
          />
        </form>
      </section>

      <section className="category-tabs" aria-label="Product categories">
        {categories.map((category) => (
          <button
            className={category === activeCategory ? 'is-selected' : ''}
            type="button"
            key={category}
            onClick={() => {
              setActiveCategory(category)
              setPage(1)
            }}
          >
            {category}
          </button>
        ))}
      </section>

      <section className="product-grid">
        {pageProducts.map((product, index) => (
          <ProductCard
            product={product}
            index={(page - 1) * PRODUCTS_PER_PAGE + index}
            key={product._id}
            onAdd={onAdd}
            onPreview={onPreview}
            canPurchase={canPurchase}
            onWishlist={onWishlist}
            isWishlisted={wishlistIds.has(product._id)}
          />
        ))}
      </section>
      {visibleProducts.length === 0 && (
        <section className="catalog-empty-state">
          <h2>{products.length === 0 ? 'Our collection is loading.' : 'No products found.'}</h2>
          <p>
            {products.length === 0
              ? 'Please check again shortly.'
              : 'Try a different search or category.'}
          </p>
        </section>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
    </main>
  )
}

export default Catalog
