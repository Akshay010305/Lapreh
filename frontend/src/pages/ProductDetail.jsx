import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Heart, PackageCheck, ShieldCheck, ShoppingBag, Truck, Zap } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { formatPrice, getCategoryName, getProductImages, getProductVideos, resolveMediaSrc } from '../data/catalog'

function ProductDetail({
  products,
  onAdd,
  onBuyNow,
  onPreview,
  onWishlist,
  wishlistIds,
  canPurchase = true,
}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = products.find((item) => item._id === id)
  const categoryName = product ? getCategoryName(product) : ''
  const mediaItems = useMemo(() => {
    if (!product) return []

    const productImages = getProductImages(product)
    const productVideos = getProductVideos(product)

    return [
      ...productImages.map((src, index) => ({
        type: 'image',
        label: ['Look', 'Close', 'Style'][index] || `View ${index + 1}`,
        src,
      })),
      { type: 'video', label: 'Video', src: productVideos[0] || '', poster: productImages[0] },
    ].filter((item) => item.src)
  }, [product])

  const productDetails = useMemo(() => {
    if (!product) return []

    return [
      ['Fabric', categoryName.includes('Velvet') ? 'Premium velvet' : categoryName.includes('Silk') ? 'Silk blend' : 'Premium breathable fabric'],
      ['Set type', categoryName.includes('Coords') ? 'Two-piece co-ord set' : 'Suit set / ethnic article'],
      ['Work', product.name.toLowerCase().includes('embroider') ? 'Thread embroidery' : 'Printed and hand-finished details'],
      ['Occasion', categoryName.includes('New') || categoryName.includes('Silk') || categoryName.includes('Velvet') ? 'Festive and occasion wear' : 'Daily luxury and small gatherings'],
    ]
  }, [categoryName, product])

  const stylingNotes = [
    'Pair with nude heels or classic juttis for a polished ethnic look.',
    'Add oxidised earrings for daytime styling or kundan jewellery for festive evenings.',
    'Contact our WhatsApp team for shade, drape, and embroidery details.',
  ]

  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const activeMedia = mediaItems[activeIndex] || mediaItems[0]
  const sameCollection = useMemo(() => {
    if (!product) return []
    return products
      .filter((item) => item._id !== product._id && getCategoryName(item) === categoryName)
      .slice(0, 4)
  }, [categoryName, product, products])
  const collectionProducts = useMemo(() => {
    if (sameCollection.length) return sameCollection
    return products
      .filter(
        (item) =>
          item._id !== product?._id &&
          getCategoryName(item).toLowerCase().includes('silk'),
      )
      .slice(0, 4)
  }, [product, products, sameCollection])
  const recommendedProducts = useMemo(() => {
    const collectionIds = new Set(collectionProducts.map((item) => item._id))
    return products
      .filter((item) => item._id !== product?._id && !collectionIds.has(item._id))
      .slice(0, 4)
  }, [collectionProducts, product, products])
  const collectionTitle = sameCollection.length
    ? `More from ${categoryName}`
    : 'Explore the Silk Collection'
  const handleBuyNow = async () => {
    if (!onBuyNow) return
    // Trigger add-to-cart but navigate immediately so mobile user gesture allows navigation.
    const addPromise = onBuyNow(product, selectedVariantId || undefined)
    navigate('/checkout')
    try {
      await addPromise
    } catch (e) {
      // errors are already handled in onBuyNow (toasts), no further action needed here
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setSelectedVariantId('')
  }, [id])

  if (!product) {
    return (
      <main>
        <section className="page-hero">
          <p className="eyebrow">Missing product</p>
          <h1>This textile selection is not available.</h1>
          <Link className="primary-link" to="/catalog">Back to catalog</Link>
        </section>
      </main>
    )
  }
  const variants = product.variants || []
  const selectedVariant = variants.find((variant) => variant._id === selectedVariantId)
  const activePrice = selectedVariant?.price || product.price
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock

  return (
    <main>
      <nav className="detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <Link to="/catalog">Catalog</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <strong>{product.name}</strong>
      </nav>

      <section className="product-detail">
        <div className="detail-gallery">
          <div className="media-thumbs" aria-label="Product media">
            {mediaItems.map((item, index) => (
              <button
                className={index === activeIndex ? 'is-selected' : ''}
                type="button"
                key={`${item.type}-${item.label}-${index}`}
                onClick={() => setActiveIndex(index)}
              >
                {item.type === 'video' ? (
                  <video src={resolveMediaSrc(item.src, 'video')} muted playsInline preload="metadata" />
                ) : (
                  <img src={resolveMediaSrc(item.src, 'image')} alt={`${product.name} ${item.label}`} />
                )}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="detail-media">
            <span className="detail-media-badge">{activeMedia.label}</span>
            {activeMedia.type === 'video' ? (
              <video
                src={resolveMediaSrc(activeMedia.src, 'video')}
                poster={resolveMediaSrc(activeMedia.poster, 'image')}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={resolveMediaSrc(activeMedia.src, 'image')}
                alt={`${product.name} ${activeMedia.label}`}
              />
            )}
          </div>
        </div>

        <div className="detail-copy">
          <div className="detail-title-row">
            <p className="eyebrow">{categoryName}</p>
            {canPurchase && (
              <button
                type="button"
                className={wishlistIds.has(product._id) ? 'wishlist-detail is-saved' : 'wishlist-detail'}
                aria-label={wishlistIds.has(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={() => onWishlist(product)}
              >
                <Heart size={19} fill={wishlistIds.has(product._id) ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
          <h1>{product.name}</h1>
          {product.productCode && (
            <p className="detail-product-code">
              Product code: <strong>{product.productCode}</strong>
              {product.productId && <> | Product ID: <strong>{product.productId}</strong></>}
            </p>
          )}
          <p className="detail-description">{product.description}</p>

          <div className="detail-price-row">
            <div>
              <div className="detail-price">{formatPrice(activePrice)}</div>
              {product.originalPrice > product.price && (
                <div className="detail-discount">
                  <del>{formatPrice(product.originalPrice)}</del>
                  <span>{product.discount}% off</span>
                </div>
              )}
              <p className="tax-note">MRP inclusive of all taxes</p>
            </div>
            <span className="stock-note">{activeStock || 0} in stock</span>
          </div>

          <div className="detail-options" aria-label="Product options">
            {variants.length > 0 ? (
              <label className="detail-variant-select">
                <span>Choose option</span>
                <select
                  value={selectedVariantId}
                  onChange={(event) => setSelectedVariantId(event.target.value)}
                  required
                >
                  <option value="">Select a size or color</option>
                  {variants.map((variant) => (
                    <option value={variant._id} key={variant._id} disabled={variant.stock < 1}>
                      {variant.name} {variant.color ? `- ${variant.color}` : ''} ({variant.stock} left)
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div>
                <span>Size</span>
                <strong>Free Size / Custom Fit</strong>
              </div>
            )}
            <div>
              <span>Availability</span>
              <strong>Online + Store</strong>
            </div>
          </div>

          {canPurchase ? (
            <div className="detail-actions">
              <button
                className="flex add-button"
                type="button"
                disabled={variants.length > 0 && !selectedVariantId}
                onClick={() => onAdd(product, selectedVariantId || undefined)}
              >
                <span className='flex items-center gap-2'><ShoppingBag size={16} className='' /> Add to Cart</span>
              </button>
              <button className="buy-now-button" type="button" onClick={handleBuyNow}>
                <Zap size={17} /> Buy Now
              </button>
            </div>
          ) : (
            <p className="admin-product-note">Store team view: shopping is available only to customer accounts.</p>
          )}

          <div className="detail-service-grid">
            <div><Truck size={18} /><span>Free express shipping</span></div>
            <div><ShieldCheck size={18} /><span>No return or exchange</span></div>
            <div><PackageCheck size={18} /><span>Quality checked before dispatch</span></div>
          </div>

        </div>

        <div className="detail-expanded">
          <div className="detail-panel product-information">
            <h2>Product Details</h2>
            <dl>
              {productDetails.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
              {product.imageCount > 0 && (
                <div>
                  <dt>Catalog images</dt>
                  <dd>{product.imageCount}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="detail-panel">
            <h2>Style Notes</h2>
            <ul>
              {stylingNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <Link className="secondary-link detail-back-link" to="/catalog">Back to catalog</Link>
        </div>
      </section>

      {recommendedProducts.length > 0 && (
        <section className="recommendation-section">
          <div className="section-heading recommendation-heading">
            <p className="eyebrow">Picked for you</p>
            <h2>You May Also Like</h2>
          </div>
          <div className="product-grid">
            {recommendedProducts.map((item, index) => (
              <ProductCard
                product={item}
                index={index}
                key={item._id}
                onAdd={onAdd}
                onPreview={onPreview}
                canPurchase={canPurchase}
                onWishlist={onWishlist}
                isWishlisted={wishlistIds.has(item._id)}
              />
            ))}
          </div>
        </section>
      )}

      {collectionProducts.length > 0 && (
        <section className="recommendation-section">
          <div className="section-heading recommendation-heading">
            <p className="eyebrow">Continue exploring</p>
            <h2>{collectionTitle}</h2>
          </div>
          <div className="product-grid">
            {collectionProducts.map((item, index) => (
              <ProductCard
                product={item}
                index={index + recommendedProducts.length}
                key={item._id}
                onAdd={onAdd}
                onPreview={onPreview}
                canPurchase={canPurchase}
                onWishlist={onWishlist}
                isWishlisted={wishlistIds.has(item._id)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default ProductDetail
