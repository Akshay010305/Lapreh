import { Check, CreditCard, MapPin, Plus, ShieldCheck, Truck, Minus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { appConfig } from '../config/env'
import { formatPrice, getProductImages, resolveMediaSrc } from '../data/catalog'
import { apiRequest } from '../utils/api'

const emptyAddress = {
  name: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
}

const getDefaultAddress = (addresses = []) =>
  addresses.find((address) => address.isDefault) || addresses[0]

let razorpayScriptPromise

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve()
  if (razorpayScriptPromise) return razorpayScriptPromise

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = appConfig.links.razorpayCheckout
    script.async = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Unable to load Razorpay Checkout'))
    document.body.appendChild(script)
  })
  return razorpayScriptPromise
}

function Checkout({ user, cart, onOrderComplete, onUpdateCartItem, onRemoveCartItem }) {
  const navigate = useNavigate()
  const initialAddresses = user?.addresses || []
  const savedAddress = getDefaultAddress(initialAddresses) || {}
  const [savedAddresses, setSavedAddresses] = useState(initialAddresses)
  const [selectedAddressId, setSelectedAddressId] = useState(savedAddress._id || 'new')
  const [address, setAddress] = useState({
    ...emptyAddress,
    name: user?.name || '',
    ...savedAddress,
  })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pendingPayment, setPendingPayment] = useState(null)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal >= 2000 ? 0 : 149
  const userId = user?._id
  const isAdmin = user?.isAdmin

  useEffect(() => {
    if (!userId || isAdmin) return

    apiRequest('/users/profile')
      .then((profile) => {
        const addresses = profile.addresses || []
        const defaultAddress = getDefaultAddress(addresses)
        setSavedAddresses(addresses)

        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id)
          setAddress({ ...emptyAddress, ...defaultAddress })
        }
      })
      .catch(() => {
        // Checkout remains usable with manually entered delivery details.
      })
  }, [userId, isAdmin])

  if (!user) return <Navigate to="/login" state={{ from: '/checkout' }} replace />
  if (user.isAdmin) return <Navigate to="/account" replace />
  if (cart.length === 0) return <Navigate to="/cart" replace />

  const handleChangeQuantity = (item, quantity) => {
    if (!onUpdateCartItem) return
    onUpdateCartItem(item, quantity)
  }

  const handleRemoveItem = (item) => {
    if (!onRemoveCartItem) return
    onRemoveCartItem(item)
  }

  const updateAddress = (event) => {
    setPendingPayment(null)
    setSelectedAddressId('new')
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const selectSavedAddress = (saved) => {
    setPendingPayment(null)
    setSelectedAddressId(saved._id)
    setAddress({ ...emptyAddress, ...saved })
  }

  const useNewAddress = () => {
    setPendingPayment(null)
    setSelectedAddressId('new')
    setAddress({ ...emptyAddress, name: user.name || '' })
  }

  const openRazorpay = (payment, order) => new Promise((resolve, reject) => {
    const brandColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--brand')
      .trim() || '#8f1f39'
    const checkout = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency,
      name: payment.name,
      description: payment.description,
      order_id: payment.razorpayOrderId,
      prefill: payment.prefill,
      theme: { color: brandColor },
      modal: {
        ondismiss: () => reject(new Error('Payment was cancelled. You can try again.')),
      },
      handler: async (response) => {
        try {
          const verifiedOrder = await apiRequest('/payments/verify', {
            method: 'POST',
            body: JSON.stringify({ orderId: order._id, ...response }),
          })
          resolve(verifiedOrder)
        } catch (verificationError) {
          reject(verificationError)
        }
      },
    })

    checkout.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Razorpay payment failed'))
    })
    checkout.open()
  })

  const placeOrder = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      if (paymentMethod === 'online') {
        await loadRazorpayCheckout()
        let paymentSession = pendingPayment
        if (!paymentSession) {
          const order = await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify({ address, paymentMethod }),
          })
          const payment = await apiRequest('/payments/create-order', {
            method: 'POST',
            body: JSON.stringify({ orderId: order._id }),
          })
          paymentSession = { order, payment }
          setPendingPayment(paymentSession)
        }

        const verifiedOrder = await openRazorpay(paymentSession.payment, paymentSession.order)
        setPendingPayment(null)
        onOrderComplete()
        navigate(`/orders/${verifiedOrder._id}`, { replace: true })
        return
      }

      const order = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({ address, paymentMethod }),
      })
      onOrderComplete()
      navigate(`/orders/${order._id}`, { replace: true })
    } catch (checkoutError) {
      setError(checkoutError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="checkout-page">
      <section className="page-hero">
        <p className="eyebrow">Secure checkout</p>
        <h1>Delivery and payment.</h1>
      </section>

      <form className="checkout-layout" onSubmit={placeOrder}>
        <div className="checkout-main">
          <section className="checkout-card">
            <div className="checkout-heading">
              <Check size={21} />
              <div><p className="eyebrow">Order items</p><h2>Review and edit</h2></div>
            </div>
            <div className="checkout-items">
              {cart.map((item) => (
                <div key={item._id} className="checkout-item-row">
                  <img src={resolveMediaSrc(getProductImages(item)[0] || item.image, 'image')} alt={item.name} />
                  <div className="checkout-item-info">
                    <Link className="order-product-name" to={`/products/${item._id}`}>{item.name}</Link>
                    {item.selectedVariantName && <small>{item.selectedVariantName}</small>}
                    <div className="checkout-item-controls">
                      <button type="button" onClick={() => handleChangeQuantity(item, Math.max(1, item.quantity - 1))} disabled={item.quantity <= 1}><Minus size={14} /></button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => handleChangeQuantity(item, item.quantity + 1)} disabled={item.quantity >= item.stock}><Plus size={14} /></button>
                      <button type="button" className="remove-item" onClick={() => handleRemoveItem(item)} aria-label={`Remove ${item.name}`}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
          </section>
          <section className="checkout-card">
            <div className="checkout-heading">
              <MapPin size={21} />
              <div><p className="eyebrow">Step 1</p><h2>Delivery address</h2></div>
            </div>
            {savedAddresses.length > 0 && (
              <div className="checkout-saved-addresses">
                {savedAddresses.map((saved) => (
                  <button
                    className={selectedAddressId === saved._id ? 'is-selected' : ''}
                    type="button"
                    key={saved._id}
                    onClick={() => selectSavedAddress(saved)}
                  >
                    <span>
                      <strong>{saved.label || 'Address'}</strong>
                      {saved.isDefault && <small>Default</small>}
                    </span>
                    <p>{saved.street}, {saved.city} - {saved.pincode}</p>
                    {selectedAddressId === saved._id && <Check size={17} />}
                  </button>
                ))}
                <button
                  className={`new-address-option ${selectedAddressId === 'new' ? 'is-selected' : ''}`}
                  type="button"
                  onClick={useNewAddress}
                >
                  <Plus size={18} />
                  <strong>Use a new address</strong>
                </button>
              </div>
            )}
            <div className="address-grid">
              {Object.keys(emptyAddress).map((field) => (
                <label className={field === 'street' ? 'field-wide' : ''} key={field}>
                  <span>{field === 'pincode' ? 'PIN code' : field}</span>
                  <input
                    name={field}
                    value={address[field]}
                    onChange={updateAddress}
                    autoComplete={field === 'pincode' ? 'postal-code' : field}
                    required
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-heading">
              <CreditCard size={21} />
              <div><p className="eyebrow">Step 2</p><h2>Payment method</h2></div>
            </div>
            <div className="payment-options">
              <label className={paymentMethod === 'cod' ? 'is-selected' : ''}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(event) => {
                    setPaymentMethod(event.target.value)
                    setPendingPayment(null)
                  }}
                />
                <span><strong>Cash on delivery</strong><small>Pay when your order arrives</small></span>
              </label>
              <label className={paymentMethod === 'online' ? 'is-selected' : ''}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(event) => {
                    setPaymentMethod(event.target.value)
                    setPendingPayment(null)
                  }}
                />
                <span><strong>Pay securely with Razorpay</strong><small>UPI, cards, netbanking, and wallets</small></span>
              </label>
            </div>
          </section>
        </div>

        <aside className="order-summary">
          <h2>Order summary</h2>
          <div className="summary-items">
            {cart.map((item) => (
              <div key={item._id}>
                <span>{item.name}{item.selectedVariantName ? ` - ${item.selectedVariantName}` : ''} x {item.quantity}</span>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>
          <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
          <div className="summary-row"><span>Shipping</span><strong>{shipping ? formatPrice(shipping) : 'Free'}</strong></div>
          <div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal + shipping)}</strong></div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="checkout-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Processing...'
              : pendingPayment
                ? `Retry payment - ${formatPrice(subtotal + shipping)}`
                : `Place order - ${formatPrice(subtotal + shipping)}`}
          </button>
          <div className="checkout-assurances">
            <span><ShieldCheck size={16} /> Secure checkout</span>
            <span><Truck size={16} /> Tracked delivery</span>
          </div>
          <Link to="/cart">Back to cart</Link>
        </aside>
      </form>
    </main>
  )
}

export default Checkout
