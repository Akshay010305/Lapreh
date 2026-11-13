import { ArrowRight, MapPin, PhoneCall, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { appConfig } from '../config/env'
import { getCategoryName, getProductImages, resolveMediaSrc } from '../data/catalog'

function Home({
  products = [],
  onAdd,
  onPreview,
  onWishlist,
  wishlistIds = new Set(),
  status,
  canPurchase = true,
}) {
  const safeProducts = Array.isArray(products) ? products : []
  const categories = [...new Set(safeProducts.map(getCategoryName))]
    .slice(0, 5)
    .map((name) => {
      const categoryProducts = safeProducts.filter((product) => getCategoryName(product) === name)
      return [name, `${categoryProducts.length} products`, categoryProducts[0]?.image]
    })
  const featuredProducts = safeProducts.slice(0, 3)
  const hasProducts = safeProducts.length > 0

  const getProductImageSrc = (product) =>
    resolveMediaSrc(getProductImages(product)[0] || product?.image || '', 'image')

  return (
    <main>
      <section className="intro">
        <div className="intro-copy">
          <p className="eyebrow">Welcome</p>
          <h1>
            <span>{appConfig.name}</span>
            <img className="hero-title-logo" src="/logo/lapreh-logo-cropped.png" alt={`${appConfig.name} logo`} />
          </h1>
          <p>
            Explore the latest unstitched suit catalog featuring cotton, Lucknowi,
            chanderi, muslin, Maheshwari, handloom, linen, and Bengali textile artistry.
          </p>
          <div className="intro-actions">
            <Link className="primary-link" to="/catalog">
              Explore Latest Collections <ArrowRight size={18} />
            </Link>
            <a className="home-whatsapp-link" href={appConfig.contact.whatsappOrderUrl}>
              WhatsApp Order
            </a>
          </div>
          <div className="hero-stats">
            <div><strong>{appConfig.foundedYear}</strong><span>Founded</span></div>
            <div><strong>{appConfig.stores.length}</strong><span>Store locations</span></div>
            <div><strong>{status}</strong><span>Collection status</span></div>
          </div>
        </div>
        <div className="hero-gallery" aria-label={`Featured ${appConfig.name} looks`}>
          {featuredProducts.map((product, index) => (
            <img
              src={getProductImageSrc(product)}
              alt={product?.name || 'Featured product'}
              key={product?._id || `${product?.name || 'featured'}-${index}`}
            />
          ))}
          <div className="hero-card">
            <span>{hasProducts ? 'New Arrivals' : 'Please wait'}</span>
            <strong>
              {hasProducts
                ? `${safeProducts.length} styles available now`
                : 'Our collection is loading'}
            </strong>
          </div>
        </div>
      </section>

      <section className="whatsapp-band">
        <div>
          <p>For order WhatsApp us on</p>
          <strong>{appConfig.contact.whatsappPrimaryDisplay}</strong>
        </div>
        <a className="home-whatsapp-link" href={appConfig.contact.whatsappChatUrl}>
          Chat on WhatsApp
        </a>
      </section>

      <section className="toolbar">
        <div>
          <p className="eyebrow">Be the first to try</p>
          <h2>New Arrivals</h2>
        </div>
        <Link className="secondary-link" to="/new-arrivals">View All</Link>
      </section>

      {hasProducts ? (
        <section className="product-grid">
          {safeProducts.slice(0, 8).map((product, index) => (
            <ProductCard
              product={product}
              index={index}
              key={product?._id || `${product?.name || 'product'}-${index}`}
              onAdd={onAdd}
              onPreview={onPreview}
              canPurchase={canPurchase}
              onWishlist={onWishlist}
              isWishlisted={wishlistIds.has(product?._id)}
            />
          ))}
        </section>
      ) : (
        <section className="catalog-empty-state">
          <h2>Our collection is loading.</h2>
          <p>Please check again shortly.</p>
        </section>
      )}

      {/* <section className="category-showcase">
        <div className="section-heading">
          <p className="eyebrow">Browse by style and need</p>
          <h2>Shop By Categories</h2>
        </div>
        {hasProducts && (
          <div className="category-cards">
            {categories.map(([name, count, image]) => (
              <Link className="category-card" to="/catalog" key={name}>
                <img src={image} alt={name} loading="lazy" />
                <span>{name}</span>
                <small>{count}</small>
              </Link>
            ))}
          </div>
        )}
      </section>

      {hasProducts && <section className="collection-feature">
        <img
          src={products[8]?.image || products[0]?.image}
          alt={products[8]?.name || products[0]?.name || 'Latest unstitched suit'}
        />
        <div>
          <p className="eyebrow">Shop Latest Collection</p>
          <h2>Designed to drape, made to impress.</h2>
          <p>
            Discover pure cotton, tissue, mul chanderi, muslin, Maheshwari,
            handloom, and linen cotton suits with detailed embroidery and finishing.
          </p>
          <Link className="primary-link" to="/catalog">Book Yours Now</Link>
        </div>
      </section>} */}

      <section className="service-strip">
        <div><ShieldCheck size={22} /><span>No Return & Exchange</span></div>
        <div><Truck size={22} /><span>Free Shipping</span></div>
        <div><PhoneCall size={22} /><span>24/7 Customer Support</span></div>
      </section>

      <section className="stores-section">
        <div className="section-heading">
          <p className="eyebrow">Visit Our Stores</p>
          <h2>Step into our world of style and craftsmanship.</h2>
        </div>
        <div className="store-grid">
          {appConfig.stores.map(({ name, address }) => (
            <article className="store-card" key={name}>
              <MapPin size={22} />
              <h3>{name}</h3>
              <p>{address}</p>
              <a href={appConfig.links.maps}>Visit Us</a>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default Home
