import { Link } from 'react-router-dom'
import { Heart, X } from 'lucide-react'
import { formatPrice, getCategoryName, getProductImages, getProductVideos, resolveMediaSrc } from '../data/catalog'

function ProductModal({
  product,
  onAdd,
  onClose,
  onWishlist,
  isWishlisted = false,
  canPurchase = true,
}) {
  if (!product) return null

  const productImages = getProductImages(product)
  const productVideos = getProductVideos(product)
  const modalPoster = resolveMediaSrc(productImages[0], 'image')
  const modalVideo = resolveMediaSrc(productVideos[0], 'video')

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close popup">
          <X size={20} />
        </button>
        <div className="modal-media">
          <video
            src={modalVideo}
            poster={modalPoster}
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
        <div className="modal-copy">
          <p className="eyebrow">{getCategoryName(product)}</p>
          <h2 id="product-modal-title">{product.name}</h2>
          <p>{product.description}</p>
          <div className="modal-price">
            <strong>{formatPrice(product.price)}</strong>
            {product.originalPrice > product.price && (
              <>
                <del>{formatPrice(product.originalPrice)}</del>
                <span>{product.discount}% off</span>
              </>
            )}
          </div>
          <div className="modal-actions">
            {canPurchase && (
              <>
                <button className="add-button" type="button" onClick={() => onAdd(product)}>
                  Add to cart
                </button>
                <button className="secondary-link modal-wishlist" type="button" onClick={() => onWishlist(product)}>
                  <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                  {isWishlisted ? 'Saved' : 'Save to wishlist'}
                </button>
              </>
            )}
            <Link className="secondary-link" to={`/products/${product._id}`} onClick={onClose}>
              Full details
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProductModal
