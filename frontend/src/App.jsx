import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import ProductModal from './components/ProductModal'
import ToastStack from './components/ToastStack'
import { appConfig } from './config/env'
import { API_URL } from './data/catalog'
import Cart from './pages/Cart'
import Account from './pages/Account'
import Catalog from './pages/Catalog'
import Checkout from './pages/Checkout'
import Home from './pages/Home'
import Login from './pages/Login'
import Orders from './pages/Orders'
import ProductDetail from './pages/ProductDetail'
import Studio from './pages/Studio'
import Wishlist from './pages/Wishlist'
import { clearStoredAuth, getTokenExpiryMs, isTokenExpired } from './utils/auth'
import { apiRequest, normalizeCart } from './utils/api'

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

const getStoredUser = () => {
  const token = localStorage.getItem('lapreh-token')
  if (isTokenExpired(token)) {
    clearStoredAuth()
    return null
  }

  try {
    return JSON.parse(localStorage.getItem('lapreh-user'))
  } catch {
    clearStoredAuth()
    return null
  }
}

function ScrollToMainContent() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    window.requestAnimationFrame(() => {
      const mainContent = document.querySelector('main')
      if (!mainContent) return

      if (!mainContent.hasAttribute('tabindex')) {
        mainContent.setAttribute('tabindex', '-1')
      }
      mainContent.focus({ preventScroll: true })
    })
  }, [pathname])

  return null
}

function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [status, setStatus] = useState('Connecting')
  const [toasts, setToasts] = useState([])
  const [popupProduct, setPopupProduct] = useState(null)
  const [authPrompt, setAuthPrompt] = useState(null)
  const [wishlist, setWishlist] = useState([])
  const [user, setUser] = useState(getStoredUser)

  const showToast = useCallback((message) => {
    const id = crypto.randomUUID()
    setToasts((items) => [...items, { id, message }])
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id))
    }, 2600)
  }, [])

  const handleLogout = useCallback((notify = true) => {
    clearStoredAuth()
    setUser(null)
    setCart([])
    setWishlist([])
    if (notify) showToast('You have been signed out')
  }, [showToast])

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable')
        return response.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data)
          setStatus('Ready to shop')
        }
      })
      .catch(() => {
        setProducts([])
        setStatus('Updating soon')
      })
  }, [])

  useEffect(() => {
    if (!user) localStorage.removeItem('lapreh-cart')
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    const token = localStorage.getItem('lapreh-token')
    const expiryMs = getTokenExpiryMs(token)

    const timeoutId = window.setTimeout(() => {
      handleLogout(false)
      showToast('Your session expired. Please sign in again.')
    }, Math.max((expiryMs || 0) - Date.now(), 0))

    return () => window.clearTimeout(timeoutId)
  }, [user, handleLogout, showToast])

  useEffect(() => {
    const handleAuthExpired = () => {
      if (!user) return
      handleLogout(false)
      showToast('Your session expired. Please sign in again.')
    }

    window.addEventListener('lapreh-auth-expired', handleAuthExpired)
    return () => window.removeEventListener('lapreh-auth-expired', handleAuthExpired)
  }, [user, handleLogout, showToast])

  useEffect(() => {
    if (!user) return
    if (user.isAdmin) {
      localStorage.removeItem('lapreh-cart')
      return
    }
    apiRequest('/cart')
      .then((data) => setCart(normalizeCart(data)))
      .catch(() => {
        clearStoredAuth()
        setUser(null)
        setCart([])
      })
  }, [user])

  useEffect(() => {
    if (!user || user.isAdmin) return
    apiRequest('/wishlist')
      .then(setWishlist)
      .catch(() => {})
  }, [user])

  const requireLogin = (intent) => {
    setAuthPrompt(intent)
    return false
  }

  const closeToast = (id) => {
    setToasts((items) => items.filter((item) => item.id !== id))
  }

  const addToCart = async (product, variantId) => {
    if (user?.isAdmin) {
      showToast('Administrator accounts cannot make purchases')
      return false
    }
    const selectedVariant = variantId
      ? product.variants?.find((variant) => variant._id === variantId)
      : null
    const availableStock = selectedVariant ? selectedVariant.stock : product.stock
    if (availableStock < 1) {
      showToast('This item is out of stock')
      return false
    }
    if (!user) {
      return requireLogin({
        title: 'Log in to add this item',
        message: 'Please sign in or create an account to add products to your cart and continue shopping.',
        from: window.location.pathname,
      })
    }

    try {
      const data = await apiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId: product._id, variantId, quantity: 1 }),
      })
      setCart(normalizeCart(data))
      showToast(`${product.name}${selectedVariant ? ` - ${selectedVariant.name}` : ''} added to cart`)
      // Ensure navigation to checkout works across viewports (mobile may block React navigate)
      try {
        window.location.href = '/checkout'
      } catch (e) {
        // fallback: return true so caller can navigate
      }
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  const buyNow = async (product, variantId) => {
    if (user?.isAdmin) {
      showToast('Administrator accounts cannot make purchases')
      return false
    }
    const selectedVariant = variantId
      ? product.variants?.find((variant) => variant._id === variantId)
      : null
    const availableStock = selectedVariant ? selectedVariant.stock : product.stock
    if (availableStock < 1) {
      showToast('This item is out of stock')
      return false
    }
    if (!user) {
      return requireLogin({
        title: 'Log in to buy this item',
        message: 'Please sign in or create an account to proceed to checkout.',
        from: '/checkout',
      })
    }

    try {
      const data = await apiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId: product._id, variantId, quantity: 1 }),
      })
      setCart(normalizeCart(data))
      showToast(`${product.name}${selectedVariant ? ` - ${selectedVariant.name}` : ''} added to cart`)
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  const updateCartItem = async (item, quantity) => {
    if (quantity < 1) return
    if (user) {
      try {
        const data = await apiRequest(`/cart/update/${item.cartItemId}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity }),
        })
        setCart(normalizeCart(data))
      } catch (error) {
        showToast(error.message)
      }
      return
    }
    setCart((items) => items.map((current) =>
      current._id === item._id ? { ...current, quantity } : current,
    ))
  }

  const removeCartItem = async (item) => {
    if (user) {
      try {
        const data = await apiRequest(`/cart/remove/${item.cartItemId}`, { method: 'DELETE' })
        setCart(normalizeCart(data))
      } catch (error) {
        showToast(error.message)
      }
      return
    }
    setCart((items) => items.filter((current) => current._id !== item._id))
  }

  const toggleWishlist = async (product) => {
    if (!user) {
      return requireLogin({
        title: 'Log in to save this item',
        message: 'Please sign in or create an account to save products to your wishlist.',
        from: window.location.pathname,
      })
    }
    if (user.isAdmin) {
      showToast('Wishlist is available only to customer accounts')
      return false
    }

    const isSaved = wishlist.some((item) => item._id === product._id)
    try {
      const updated = await apiRequest(`/wishlist/${product._id}`, {
        method: isSaved ? 'DELETE' : 'POST',
      })
      setWishlist(updated)
      showToast(isSaved ? 'Removed from wishlist' : `${product.name} saved to wishlist`)
      return true
    } catch (error) {
      showToast(error.message)
      return false
    }
  }

  const moveWishlistItemToCart = async (product) => {
    await addToCart(product)
    try {
      const updated = await apiRequest(`/wishlist/${product._id}`, { method: 'DELETE' })
      setWishlist(updated)
    } catch (error) {
      showToast(error.message)
    }
  }

  const handleLogin = async ({ token, user: loggedInUser }) => {
    localStorage.setItem('lapreh-token', token)
    localStorage.setItem('lapreh-user', JSON.stringify(loggedInUser))
    setUser(loggedInUser)
    if (loggedInUser.isAdmin) {
      setCart([])
      localStorage.removeItem('lapreh-cart')
      showToast(`Welcome back, ${loggedInUser.name}`)
      return
    }
    const serverCart = await apiRequest('/cart')
    setCart(normalizeCart(serverCart))
    localStorage.removeItem('lapreh-cart')
    showToast(`Welcome back, ${loggedInUser.name}`)
  }

  const handleOrderComplete = () => setCart([])
  const wishlistIds = new Set(wishlist.map((product) => product._id))
  const handleUserUpdate = (updatedUser) => {
    const publicUser = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      addresses: updatedUser.addresses || [],
    }
    localStorage.setItem('lapreh-user', JSON.stringify(publicUser))
    setUser(publicUser)
  }

  return (
    <BrowserRouter>
      <ScrollToMainContent />
      <Routes>
        <Route
          element={
            <Layout
              cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
              wishlistCount={wishlist.length}
              user={user}
              serverStatus={status}
              products={products}
            />
          }
        >
          <Route
            path="/"
            element={
              <Home
                products={products}
                onAdd={addToCart}
                onPreview={setPopupProduct}
                status={status}
                canPurchase={!user?.isAdmin}
                onWishlist={toggleWishlist}
                wishlistIds={wishlistIds}
              />
            }
          />
          <Route
            path="/catalog"
            element={
              <Catalog
                products={products}
                onAdd={addToCart}
                onPreview={setPopupProduct}
                canPurchase={!user?.isAdmin}
                onWishlist={toggleWishlist}
                wishlistIds={wishlistIds}
              />
            }
          />
          <Route
            path="/new-arrivals"
            element={
              <Catalog
                products={products.slice(0, 8)}
                onAdd={addToCart}
                onPreview={setPopupProduct}
                canPurchase={!user?.isAdmin}
                title="New Arrivals"
                heading={`Discover the latest additions to ${appConfig.name}.`}
                onWishlist={toggleWishlist}
                wishlistIds={wishlistIds}
              />
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProductDetail
                products={products}
                onAdd={addToCart}
                onPreview={setPopupProduct}
                onBuyNow={buyNow}
                canPurchase={!user?.isAdmin}
                onWishlist={toggleWishlist}
                wishlistIds={wishlistIds}
              />
            }
          />
          <Route
            path="/cart"
            element={<Cart cart={cart} user={user} onUpdate={updateCartItem} onRemove={removeCartItem} />}
          />
          <Route
            path="/checkout"
            element={<Checkout user={user} cart={cart} onOrderComplete={handleOrderComplete} onUpdateCartItem={updateCartItem} onRemoveCartItem={removeCartItem} />}
          />
          <Route path="/orders" element={<Orders user={user} />} />
          <Route path="/orders/:id" element={<Orders user={user} />} />
          <Route
            path="/wishlist"
            element={
              <Wishlist
                user={user}
                wishlist={wishlist}
                onRemove={toggleWishlist}
                onMoveToCart={moveWishlistItemToCart}
              />
            }
          />
          <Route
            path="/account"
            element={
              <Account
                user={user}
                onLogout={handleLogout}
                onUserUpdate={handleUserUpdate}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <Suspense fallback={<main className="admin-dashboard-loading">Preparing store overview...</main>}>
                <AdminDashboard user={user} onLogout={handleLogout} />
              </Suspense>
            }
          />
          <Route path="/studio" element={<Studio />} />
          <Route path="/login" element={<Login user={user} onLogin={handleLogin} />} />
        </Route>
      </Routes>
      <ProductModal
        product={popupProduct}
        onAdd={addToCart}
        onClose={() => setPopupProduct(null)}
        canPurchase={!user?.isAdmin}
        onWishlist={toggleWishlist}
        isWishlisted={popupProduct ? wishlistIds.has(popupProduct._id) : false}
      />
      {authPrompt && (
        <div className="modal-backdrop auth-required-backdrop" role="presentation" onMouseDown={() => setAuthPrompt(null)}>
          <section
            className="auth-required-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-required-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">Account required</p>
            <h2 id="auth-required-title">{authPrompt.title}</h2>
            <p>{authPrompt.message}</p>
            <div className="auth-required-actions">
              <Link
                className="auth-required-login"
                to="/login"
                state={{ from: authPrompt.from || window.location.pathname }}
                onClick={() => {
                  setAuthPrompt(null)
                  setPopupProduct(null)
                }}
              >
                Log in to continue
              </Link>
              <button type="button" onClick={() => setAuthPrompt(null)}>
                Not now
              </button>
            </div>
          </section>
        </div>
      )}
      <ToastStack toasts={toasts} onClose={closeToast} />
    </BrowserRouter>
  )
}

export default App
