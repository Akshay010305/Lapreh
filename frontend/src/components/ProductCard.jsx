import { Eye, Heart, Pause, Play, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRef, useState } from 'react'
import { formatPrice, getCategoryName, getProductImages, getProductVideos, palettes, resolveMediaSrc } from '../data/catalog'

function ProductCard({
  product,
  index,
  onAdd,
  onPreview,
  onWishlist,
  isWishlisted = false,
  canPurchase = true,
}) {
  const [isPinned, setIsPinned] = useState(false)
  const videoRef = useRef(null)
  const [primary, secondary] = palettes[index % palettes.length]
  const isActive = isPinned
  const defaultVariantId = product.variants?.find((variant) => variant.stock > 0)?._id
  const productImages = getProductImages(product)
  const productVideos = getProductVideos(product)
  const primaryImage = resolveMediaSrc(productImages[0], 'image')
  const primaryVideo = resolveMediaSrc(productVideos[0], 'video')

  const playVideo = () => {
    videoRef.current?.play().catch(() => {})
  }

  const pauseVideo = () => {
    if (!videoRef.current) return
    videoRef.current.pause()
    videoRef.current.currentTime = 0
  }

  const handlePreviewClick = () => {
    const nextPinned = !isPinned
    setIsPinned(nextPinned)
    window.setTimeout(() => {
      if (nextPinned) playVideo()
      else pauseVideo()
    }, 0)
  }

  return (
    <article
      className="product-card"
      style={{ '--swatch-a': primary, '--swatch-b': secondary }}
    >
      <button className="media-button" type="button" onClick={() => onPreview?.(product)}>
        <div className="fabric-poster">
          {primaryImage && <img src={primaryImage} alt={product.name} loading="lazy" />}
          <div className="woven-layer" />
        </div>
        <video
          ref={videoRef}
          className={isActive ? 'product-video is-active' : 'product-video'}
          src={primaryVideo}
          muted
          loop
          playsInline
          preload="metadata"
        />
        <span className="quick-view"><Eye size={14} /> Quickshop</span>
      </button>
      <button
        className={isActive ? 'play-preview is-playing' : 'play-preview'}
        type="button"
        onClick={handlePreviewClick}
        aria-label={isPinned ? `Pause ${product.name} preview` : `Play ${product.name} preview`}
      >
        {isPinned ? <Pause size={16} /> : <Play size={16} />}
        <span>{isPinned ? 'Pause preview' : 'Play preview'}</span>
      </button>
      {canPurchase && (
        <button
          className={isWishlisted ? 'product-wishlist is-saved' : 'product-wishlist'}
          type="button"
          onClick={() => onWishlist?.(product)}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      )}

      <div className="product-body">
        <div>
          <p className="category">{getCategoryName(product)}</p>
          <h3>
            <Link to={`/products/${product._id}`}>{product.name}</Link>
          </h3>
        </div>
        <p className="description">{product.description}</p>
        <div className="product-meta">
          <div className="catalog-price">
            <strong>{formatPrice(product.price)}</strong>
            {product.originalPrice > product.price && (
              <>
                <del>{formatPrice(product.originalPrice)}</del>
                <small>{product.discount}% off</small>
              </>
            )}
          </div>
          <span>{product.stock || 0} in stock</span>
        </div>
        {canPurchase ? (
          <button className="flex add-button" type="button" onClick={() => onAdd(product, defaultVariantId)}>
            <span className='flex items-center gap-2'><ShoppingBag size={16} className='' /> Add to Cart</span>
          </button>
        ) : (
          <span className="admin-product-note">Store team view</span>
        )}
        <button className="preview-button" type="button" onClick={() => onPreview?.(product)}>
          Quickshop
        </button>
      </div>
    </article>
  )
}

export default ProductCard
