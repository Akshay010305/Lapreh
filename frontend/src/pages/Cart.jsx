import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { formatPrice, getProductImages, resolveMediaSrc } from '../data/catalog'

function Cart({ cart, user, onUpdate, onRemove }) {
  if (user?.isAdmin) return <Navigate to="/account" replace />
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = cartTotal >= 2000 || cartTotal === 0 ? 0 : 149

  return (
    <main>
      <section className="page-hero">
        <p className="eyebrow">Cart</p>
        <h1>Review your fabric and clothing selections.</h1>
      </section>

      <section className="cart-page-layout">
      <div className="cart-panel">
        <div>
          <p className="eyebrow">Cart</p>
          <h2>{cart.length} items</h2>
        </div>
        <div className="cart-lines">
          {cart.length === 0 ? (
            <p>Your selected fabrics and garments will appear here.</p>
          ) : (
            cart.map((item) => {
              const cartImage = resolveMediaSrc(getProductImages(item)[0] || item.image, 'image')

              return (
                <div className="cart-line cart-product" key={item._id}>
                  <img src={cartImage} alt={item.name || 'Cart item'} />
                  <div>
                  <strong>{item.name}</strong>
                  {item.selectedVariantName && <small>{item.selectedVariantName}</small>}
                  <span>{formatPrice(item.price)}</span>
                </div>
                <div className="quantity-control">
                  <button type="button" onClick={() => onUpdate(item, item.quantity - 1)} disabled={item.quantity <= 1}><Minus size={15} /></button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => onUpdate(item, item.quantity + 1)} disabled={item.quantity >= item.stock}><Plus size={15} /></button>
                </div>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                  <button className="remove-item" type="button" onClick={() => onRemove(item)} aria-label={`Remove ${item.name}`}><Trash2 size={17} /></button>
                </div>
              )
            })
          )}
        </div>
        <Link className="primary-link" to="/catalog">Continue shopping</Link>
      </div>
      {cart.length > 0 && (
        <aside className="cart-summary">
          <h2>Summary</h2>
          <div><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong></div>
          <div><span>Shipping</span><strong>{shipping ? formatPrice(shipping) : 'Free'}</strong></div>
          <div className="cart-total"><span>Total</span><strong>{formatPrice(cartTotal + shipping)}</strong></div>
          <Link className="checkout-link" to={user ? '/checkout' : '/login'} state={user ? undefined : { from: '/checkout' }}>
            {user ? 'Proceed to checkout' : 'Sign in to checkout'}
          </Link>
        </aside>
      )}
      </section>
    </main>
  )
}

export default Cart
