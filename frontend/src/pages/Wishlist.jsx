import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { formatPrice, getCategoryName, getProductImages, resolveMediaSrc } from '../data/catalog'

function Wishlist({ user, wishlist, onRemove, onMoveToCart }) {
  if (!user) return <Navigate to="/login" state={{ from: '/wishlist' }} replace />
  if (user.isAdmin) return <Navigate to="/admin" replace />

  return (
    <main>
      <section className="page-hero">
        <p className="eyebrow">Saved for later</p>
        <h1>Your wishlist.</h1>
      </section>

      <section className="wishlist-page">
        {wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <Heart size={36} />
            <h2>Your wishlist is empty.</h2>
            <p>Save pieces you love and return to them whenever you are ready.</p>
            <Link className="primary-link" to="/catalog">Explore the catalog</Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map((product) => {
              const wishlistImage = resolveMediaSrc(getProductImages(product)[0] || product.image, 'image')

              return (
                <article className="wishlist-item" key={product._id}>
                  <Link to={`/products/${product._id}`}>
                    <img src={wishlistImage} alt={product.name} />
                  </Link>
                <div>
                  <p className="category">{getCategoryName(product)}</p>
                  <h2><Link to={`/products/${product._id}`}>{product.name}</Link></h2>
                  <strong>{formatPrice(product.price)}</strong>
                  <span>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
                </div>
                  <div className="wishlist-actions">
                    <button
                      className="wishlist-cart-button"
                      type="button"
                      disabled={product.stock < 1}
                      onClick={() => onMoveToCart(product)}
                    >
                      <ShoppingBag size={16} /> Move to cart
                    </button>
                    <button
                      className="wishlist-remove-button"
                      type="button"
                      onClick={() => onRemove(product)}
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default Wishlist
