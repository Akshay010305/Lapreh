import { ChevronLeft, ChevronRight } from 'lucide-react'

function getVisiblePageItems(page, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, 2, 3, page, Math.min(page + 1, totalPages)])
  const sortedPages = Array.from(pages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((first, second) => first - second)

  return sortedPages.flatMap((pageNumber, index) => {
    const previous = sortedPages[index - 1]
    if (previous && pageNumber - previous > 1) {
      return [`ellipsis-${previous}-${pageNumber}`, pageNumber]
    }
    return [pageNumber]
  })
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const visiblePageItems = getVisiblePageItems(page, totalPages)

  return (
    <nav className="pagination" aria-label="Catalog pages">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </button>
      {visiblePageItems.map((item) => (
        typeof item === 'string' ? (
          <span className="pagination-ellipsis" key={item} aria-hidden="true">...</span>
        ) : (
          <button
            className={item === page ? 'is-selected' : ''}
            type="button"
            key={item}
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        )
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  )
}

export default Pagination
