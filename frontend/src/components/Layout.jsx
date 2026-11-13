import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, Heart, Mail, MapPin, Menu, Palette, Phone, Search, ShoppingBag, User } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { appConfig } from '../config/env'
import { formatPrice, getCategoryName } from '../data/catalog'

function Layout({ cartCount, wishlistCount, user, serverStatus, products = [] }) {
  const themeOptions = [
    { value: 'rose', label: 'Rose', swatch: '#8f1f39' },
    { value: 'emerald', label: 'Emerald', swatch: '#0f6a52' },
    { value: 'indigo', label: 'Indigo', swatch: '#4355a4' },
    { value: 'amber', label: 'Amber', swatch: '#87520f' },
    { value: 'coral', label: 'Coral', swatch: '#a33d32' },
    { value: 'ocean', label: 'Ocean', swatch: '#11637e' },
    { value: 'plum', label: 'Plum', swatch: '#6f3f8f' },
    { value: 'cocoa', label: 'Cocoa', swatch: '#68422d' },
  ]
  const currentYear = new Date().getFullYear()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('lapreh-theme-color') || 'rose')
  const location = useLocation()
  const navigate = useNavigate()
  const navRef = useRef(null)
  const closeMenu = () => setIsMenuOpen(false)
  const isServerReady = serverStatus === 'Ready to shop'
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()

  const productSuggestions = useMemo(() => {
    if (!normalizedSearchQuery) return []

    return products
      .filter((product) => {
        const text = `${product.name} ${product.description} ${getCategoryName(product)}`.toLowerCase()
        return text.includes(normalizedSearchQuery)
      })
      .slice(0, 5)
  }, [normalizedSearchQuery, products])

  const categorySuggestions = useMemo(() => {
    if (!normalizedSearchQuery) return []

    return [...new Set(products.map(getCategoryName))]
      .filter((category) => category.toLowerCase().includes(normalizedSearchQuery))
      .slice(0, 3)
  }, [normalizedSearchQuery, products])

  const hasSearchSuggestions = productSuggestions.length > 0 || categorySuggestions.length > 0
  const shouldShowSearchDropdown = isSearchOpen && normalizedSearchQuery.length > 0
  const activeTheme = themeOptions.find((theme) => theme.value === colorTheme) || themeOptions[0]

  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.dataset.theme = colorTheme
    localStorage.removeItem('lapreh-theme-mode')
    localStorage.setItem('lapreh-theme-color', colorTheme)
  }, [colorTheme])

  useEffect(() => {
    if (location.pathname !== '/catalog') {
      setSearchQuery('')
      return
    }

    const params = new URLSearchParams(location.search)
    setSearchQuery(params.get('search') || '')
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!isMenuOpen) return undefined

    const handleOutsideNav = (event) => {
      if (navRef.current?.contains(event.target)) return
      closeMenu()
    }

    document.addEventListener('pointerdown', handleOutsideNav)
    document.addEventListener('focusin', handleOutsideNav)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideNav)
      document.removeEventListener('focusin', handleOutsideNav)
    }
  }, [isMenuOpen])

  useEffect(() => {
    if (!isThemeMenuOpen) return undefined

    const handleOutsideTheme = (event) => {
      if (event.target.closest?.('.theme-controls')) return
      setIsThemeMenuOpen(false)
    }

    document.addEventListener('pointerdown', handleOutsideTheme)
    document.addEventListener('focusin', handleOutsideTheme)

    return () => {
      document.removeEventListener('pointerdown', handleOutsideTheme)
      document.removeEventListener('focusin', handleOutsideTheme)
    }
  }, [isThemeMenuOpen])

  const submitSearch = (query = searchQuery) => {
    const trimmedQuery = query.trim()
    navigate(trimmedQuery ? `/catalog?search=${encodeURIComponent(trimmedQuery)}` : '/catalog')
    setIsSearchOpen(false)
    closeMenu()
  }

  const renderSearchForm = (className, suggestionId) => (
    <form
      className={className}
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        submitSearch()
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return
        setIsSearchOpen(false)
      }}
    >
      <Search size={18} />
      <input
        value={searchQuery}
        onChange={(event) => {
          setSearchQuery(event.target.value)
          setIsSearchOpen(true)
        }}
        onFocus={() => setIsSearchOpen(true)}
        placeholder="Search suits, coords, silk"
        aria-label="Search products"
        aria-expanded={shouldShowSearchDropdown}
        aria-controls={suggestionId}
        autoComplete="off"
      />
      <button type="submit" aria-label="Search products">
        <Search size={16} />
      </button>
      {shouldShowSearchDropdown && (
        <div
          className="search-suggestions"
          id={suggestionId}
          onWheel={(event) => event.stopPropagation()}
          onTouchMove={(event) => event.stopPropagation()}
        >
          {hasSearchSuggestions ? (
            <>
              {categorySuggestions.length > 0 && (
                <div className="suggestion-group">
                  <span>Categories</span>
                  {categorySuggestions.map((category) => (
                    <button
                      className="suggestion-category"
                      type="button"
                      key={category}
                      onClick={() => submitSearch(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
              {productSuggestions.length > 0 && (
                <div className="suggestion-group">
                  <span>Products</span>
                  {productSuggestions.map((product) => (
                    <NavLink
                      className="suggestion-product"
                      to={`/products/${product._id}`}
                      key={product._id}
                      onClick={() => {
                        setIsSearchOpen(false)
                        closeMenu()
                      }}
                    >
                      <img src={product.image} alt="" loading="lazy" />
                      <span>
                        <strong>{product.name}</strong>
                        <small>{getCategoryName(product)} - {formatPrice(product.price)}</small>
                      </span>
                    </NavLink>
                  ))}
                </div>
              )}
              <button
                className="suggestion-view-all"
                type="button"
                onClick={() => submitSearch()}
              >
                View all results for "{searchQuery.trim()}"
              </button>
            </>
          ) : (
            <div className="suggestion-empty">
              <strong>No instant matches</strong>
              <span>Press Enter to search the full catalog.</span>
            </div>
          )}
        </div>
      )}
    </form>
  )

  const renderThemeControls = () => (
    <div className="theme-controls">
      <button
        className="theme-trigger"
        type="button"
        onClick={() => setIsThemeMenuOpen((open) => !open)}
        aria-label="Choose theme color"
        aria-haspopup="menu"
        aria-expanded={isThemeMenuOpen}
      >
        <span className="theme-swatch" style={{ '--theme-swatch': activeTheme.swatch }} />
        <Palette size={16} />
        <span className="theme-label">{activeTheme.label}</span>
        <ChevronDown size={15} />
      </button>
      {isThemeMenuOpen && (
        <div className="theme-menu" role="menu">
          {themeOptions.map((theme) => (
            <button
              className={theme.value === colorTheme ? 'theme-option is-selected' : 'theme-option'}
              type="button"
              role="menuitemradio"
              aria-checked={theme.value === colorTheme}
              key={theme.value}
              onClick={() => {
                setColorTheme(theme.value)
                setIsThemeMenuOpen(false)
              }}
            >
              <span className="theme-swatch" style={{ '--theme-swatch': theme.swatch }} />
              <span>{theme.label}</span>
              {theme.value === colorTheme && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="shipping-bar">
          <span>Free Express Shipping</span>
          <span>No Return No Exchange</span>
          <span>WhatsApp support {appConfig.supportHours}</span>
        </div>
        <nav ref={navRef}>
          <button
            className="icon-button menu-button"
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <Menu size={22} />
          </button>

          <NavLink className="brand" to="/" onClick={closeMenu}>
            <img className="brand-logo" src="/logo/lapreh-logo.png" alt={`${appConfig.name} logo`} />
            <span>
              <strong>{appConfig.name}</strong>
              <small>{appConfig.tagline}</small>
            </span>
          </NavLink>

          <div className={isMenuOpen ? 'nav-links is-open' : 'nav-links'}>
            <NavLink className="mobile-nav-brand" to="/" onClick={closeMenu}>
              <img src="/logo/lapreh-logo.png" alt={`${appConfig.name} logo`} />
              <strong>{appConfig.name}</strong>
            </NavLink>
            {renderSearchForm('nav-search mobile-nav-search', 'mobile-nav-search-suggestions')}
            <NavLink to="/" onClick={closeMenu}>Home</NavLink>
            <NavLink to="/catalog" onClick={closeMenu}>Catalog</NavLink>
            <NavLink to="/new-arrivals" onClick={closeMenu}>New Arrivals</NavLink>
            <NavLink to="/studio" onClick={closeMenu}>Stores</NavLink>
            {user && !user.isAdmin && <NavLink to="/orders" onClick={closeMenu}>My Orders</NavLink>}
            {!user?.isAdmin && <NavLink to="/cart" onClick={closeMenu}>Cart</NavLink>}
            <div className="mobile-theme-controls">
              {renderThemeControls()}
            </div>
          </div>

          {renderSearchForm('nav-search desktop-nav-search', 'nav-search-suggestions')}

          <div className="nav-actions">
            <div className="desktop-theme-controls">
              {renderThemeControls()}
            </div>
            {!user?.isAdmin && (
              <NavLink className="icon-button wishlist-link" to="/wishlist" aria-label="Wishlist">
                <Heart size={22} />
                {wishlistCount > 0 && <span>{wishlistCount}</span>}
              </NavLink>
            )}
            {user ? (
              <NavLink
                className="account-button"
                to={user.isAdmin ? '/admin' : '/account'}
                aria-label={`${user.isAdmin ? 'Admin' : 'User'} account for ${user.name}`}
              >
                <User size={18} />
                <span>{user.name}</span>
              </NavLink>
            ) : (
              <NavLink className="icon-button account-link" to="/login" aria-label="Account sign in">
                <User size={22} />
              </NavLink>
            )}
            {!user?.isAdmin && (
              <NavLink className="bag-link" to="/cart" aria-label={`Cart with ${cartCount} items`}>
                <ShoppingBag size={22} />
                {cartCount > 0 && <span>{cartCount}</span>}
              </NavLink>
            )}
          </div>
        </nav>
      </header>
      {!isServerReady && (
        <div className="server-warning" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>Our collection is loading. Please check again shortly.</span>
        </div>
      )}
      <div className="site-content">
        <Outlet />
      </div>
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <NavLink className="footer-logo" to="/">
              <img className="footer-logo-image" src="/logo/lapreh-logo.png" alt={`${appConfig.name} logo`} />
              {appConfig.name}
            </NavLink>
            <p>{appConfig.description}</p>
            <div className="footer-socials" aria-label="Social media">
              <a href={appConfig.links.instagram} aria-label="Instagram">
                IG
              </a>
              <a href={appConfig.links.facebook} aria-label="Facebook">
                FB
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h2>Explore</h2>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/catalog">Shop all</NavLink>
            <NavLink to="/new-arrivals">New arrivals</NavLink>
            <NavLink to="/studio">Our stores</NavLink>
          </div>

          <div className="footer-column">
            <h2>Customer care</h2>
            {!user?.isAdmin && <NavLink to="/cart">Your cart</NavLink>}
            <a href={`mailto:${appConfig.contact.email}`}>Shipping &amp; delivery</a>
            <a href={`mailto:${appConfig.contact.email}`}>Size assistance</a>
            <a href={`mailto:${appConfig.contact.email}`}>Contact us</a>
          </div>

          <div className="footer-column footer-contact">
            <h2>Visit or call</h2>
            <a href={`tel:${appConfig.contact.phoneTel}`}>
              <Phone size={17} />
              {appConfig.contact.phoneDisplay}
            </a>
            <a href={`mailto:${appConfig.contact.email}`}>
              <Mail size={17} />
              {appConfig.contact.email}
            </a>
            <NavLink to="/studio">
              <MapPin size={17} />
              Find your nearest store
            </NavLink>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {currentYear} {appConfig.name}. All rights reserved.</span>
          <span>Made with care in India</span>
        </div>
      </footer>
    </div>
  )
}

export default Layout
