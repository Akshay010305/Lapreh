import {
  Check,
  Circle,
  Clock3,
  MapPin,
  Package,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { formatPrice, getProductImages, resolveMediaSrc } from '../data/catalog'
import { apiRequest } from '../utils/api'

const trackingSteps = [
  ['confirmed', 'Order confirmed', PackageCheck],
  ['processing', 'Preparing your order', Package],
  ['shipped', 'Shipped', Truck],
  ['delivered', 'Delivered', MapPin],
]

const cancellationReasons = [
  'Changed my mind',
  'Ordered by mistake',
  'Need to change delivery details',
  'Found another product',
  'Delivery will take too long',
  'Other',
]

const formatDate = (value) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

const getProductId = (item) => item.product?._id || item.product

function OrderTracking({ order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="order-cancelled-panel">
        <XCircle size={22} />
        <div>
          <strong>Order cancelled</strong>
          <span>{order.cancellationReason}</span>
          {order.cancelledAt && <small>{formatDate(order.cancelledAt)}</small>}
          {order.refundStatus === 'pending' && <small>Your refund has been initiated and is being processed.</small>}
          {order.refundStatus === 'processed' && <small>Your payment has been refunded to the original method.</small>}
        </div>
      </div>
    )
  }

  if (order.status === 'pending') {
    return (
      <div className="order-payment-pending">
        <Clock3 size={21} />
        <div><strong>Payment pending</strong><span>Complete payment to confirm this order.</span></div>
      </div>
    )
  }

  const currentIndex = trackingSteps.findIndex(([status]) => status === order.status)
  const historyByStatus = new Map((order.statusHistory || []).map((event) => [event.status, event]))

  return (
    <div className="order-tracking">
      {trackingSteps.map(([status, label, Icon], index) => {
        const isComplete = index < currentIndex || order.status === 'delivered'
        const isCurrent = index === currentIndex && order.status !== 'delivered'
        const event = historyByStatus.get(status)
        let statusClassName = 'tracking-step'
        let statusIcon = <Circle size={12} />
        let statusInfo = 'Waiting'

        if (isComplete) {
          statusClassName = 'tracking-step is-complete'
          statusIcon = <Check size={15} />
        } else if (isCurrent) {
          statusClassName = 'tracking-step is-current'
          statusIcon = <Icon size={16} />
          statusInfo = 'Current status'
        }
        if (event?.timestamp) statusInfo = formatDate(event.timestamp)

        return (
          <div className={statusClassName} key={status}>
            <span className="tracking-icon">{statusIcon}</span>
            <div>
              <strong>{label}</strong>
              <small>{statusInfo}</small>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Orders({ user }) {
  const { id } = useParams()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState(null)
  const [reason, setReason] = useState(cancellationReasons[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [returningId, setReturningId] = useState(null)
  const [returnReason, setReturnReason] = useState('')
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)
  const [invoiceLoadingId, setInvoiceLoadingId] = useState(null)

  useEffect(() => {
    if (!user) return

    let isActive = true
    setIsLoading(true)
    setError('')
    setMessage('')

    apiRequest(id ? `/orders/${id}` : '/orders/my-orders')
      .then((data) => {
        if (!isActive) return
        let nextOrders = []
        if (Array.isArray(data)) nextOrders = data
        else if (data) nextOrders = [data]
        setOrders(nextOrders)
      })
      .catch((requestError) => {
        if (!isActive) return
        setOrders([])
        setError(requestError.message)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [id, user])

  if (!user) return <Navigate to="/login" state={{ from: id ? `/orders/${id}` : '/orders' }} replace />
  if (user.isAdmin) return <Navigate to="/admin" replace />

  const cancelOrder = async (orderId) => {
    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      const updated = await apiRequest(`/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
      setOrders((items) => items.map((order) => order._id === updated._id ? updated : order))
      setCancellingId(null)
      setMessage(updated.refundStatus === 'pending'
        ? 'Order cancelled. Your Razorpay refund has been initiated.'
        : 'Order cancelled successfully.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const requestReturn = async (orderId) => {
    setError('')
    setMessage('')
    setIsSubmittingReturn(true)
    try {
      const updated = await apiRequest(`/orders/${orderId}/return-request`, {
        method: 'POST',
        body: JSON.stringify({ reason: returnReason }),
      })
      setOrders((items) => items.map((order) => order._id === updated._id ? updated : order))
      setReturningId(null)
      setReturnReason('')
      setMessage('Return request submitted. We will review it and notify you soon.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  const downloadInvoice = async (orderId) => {
    setInvoiceLoadingId(orderId)
    setError('')
    try {
      const invoice = await apiRequest(`/orders/${orderId}/invoice`)
      const order = invoice.order
      const rows = order.items.map((item) => `
        <tr>
          <td>${item.name}${item.variantName ? ` - ${item.variantName}` : ''}</td>
          <td>${item.quantity}</td>
          <td>${formatPrice(item.price)}</td>
          <td>${formatPrice(item.price * item.quantity)}</td>
        </tr>
      `).join('')
      const html = `
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              body{font-family:Arial,sans-serif;margin:40px;color:#1d1a18}
              h1{margin:0 0 8px} table{width:100%;border-collapse:collapse;margin-top:24px}
              th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}
              .total{font-size:20px;font-weight:700;text-align:right;margin-top:24px}
            </style>
          </head>
          <body>
            <h1>${invoice.brand}</h1>
            <p>Invoice: ${invoice.invoiceNumber}</p>
            <p>Order: #${order._id.slice(-8).toUpperCase()}</p>
            <p>Customer: ${order.address.name}</p>
            <p>Delivery: ${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.pincode}</p>
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <p class="total">Total: ${formatPrice(order.total)}</p>
          </body>
        </html>
      `
      const htmlBlob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(htmlBlob)
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus()
          printWindow.print()
          URL.revokeObjectURL(url)
        }
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setInvoiceLoadingId(null)
    }
  }

  return (
    <main>
      <section className="page-hero">
        <p className="eyebrow">{id ? 'Order details' : 'Your account'}</p>
        <h1>{id ? 'Track your purchase.' : 'Your orders.'}</h1>
      </section>
      <section className="orders-list">
        {!id && (
          <div className="return-policy-note">
            Return requests can be submitted within 14 days after delivery. If you request a return, our team will review it and notify you with the next steps.
          </div>
        )}
        {message && <p className="account-success">{message}</p>}
        {error && <p className="auth-error">{error}</p>}
        {isLoading && <p>Loading your orders...</p>}
        {!isLoading && !error && orders.length === 0 && (
          <div className="catalog-empty-state">
            <h2>No orders yet.</h2>
            <p>Your purchases will appear here once you place an order.</p>
          </div>
        )}
        {orders.map((order) => {
          const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status)
          return (
            <article className="order-card" key={order._id}>
              <header>
                <div>
                  <PackageCheck size={24} />
                  <span>
                    <small>Order placed {formatDate(order.createdAt)}</small>
                    <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                  </span>
                </div>
                <span className={`order-status status-${order.status}`}>{order.status}</span>
              </header>

              <OrderTracking order={order} />

              <div className="order-products">
                {order.items.map((item) => {
                  const rawImage = [
                    item.originalImage,
                    ...getProductImages(item),
                    item.image,
                    ...getProductImages(item.product),
                    item.product?.image,
                  ].find(Boolean) || ''
                  const itemImage = resolveMediaSrc(rawImage, 'image')
                  const placeholder = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="150"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" font-size="12" text-anchor="middle" fill="%23999" dy=".3em">No image</text></svg>'
                  return (
                    <div key={`${order._id}-${getProductId(item)}`}>
                      <img src={itemImage || placeholder} alt={item.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder }} />
                      <span>
                        <Link className="order-product-name" to={`/products/${getProductId(item)}`}>
                          {item.name}
                        </Link>
                        {item.variantName && <small>{item.variantName}</small>}
                        <small>{item.quantity} x {formatPrice(item.price)}</small>
                      </span>
                      <b>{formatPrice(item.price * item.quantity)}</b>
                    </div>
                  )
                })}
              </div>

              <div className="order-delivery-address">
                <MapPin size={17} />
                <span>
                  <strong>Delivery address</strong>
                  <small>{order.address.street}, {order.address.city}, {order.address.state} {order.address.pincode}</small>
                </span>
              </div>

              {order.returnStatus && order.returnStatus !== 'not_requested' && (
                <div className="order-return-panel">
                  <strong>Return {order.returnStatus.replace('_', ' ')}</strong>
                  {order.returnReason && <p>{order.returnReason}</p>}
                  {order.returnRequestedAt && <small>Requested {formatDate(order.returnRequestedAt)}</small>}
                  {order.returnStatus !== 'requested' && order.returnResolvedAt && (
                    <small>Resolved {formatDate(order.returnResolvedAt)}</small>
                  )}
                  {order.returnResolutionNote && <small>{order.returnResolutionNote}</small>}
                </div>
              )}

              {order.status === 'delivered' && order.returnStatus === 'not_requested' && returningId !== order._id && (
                <div className="order-return-panel">
                  <strong>Need to return this order?</strong>
                  <p>Returns are accepted within 14 days of delivery.</p>
                  <button
                    type="button"
                    className="cancel-order-button"
                    onClick={() => {
                      setReturningId(order._id)
                      setReturnReason('')
                    }}
                  >
                    Request return
                  </button>
                </div>
              )}

              {returningId === order._id && (
                <div className="order-return-form">
                  <label>
                    <span>Return reason</span>
                    <textarea
                      value={returnReason}
                      onChange={(event) => setReturnReason(event.target.value)}
                      placeholder="Tell us why you'd like to return this order"
                    />
                  </label>
                  <div>
                    <button
                      type="button"
                      className="confirm-cancel-button"
                      disabled={isSubmittingReturn || !returnReason.trim()}
                      onClick={() => requestReturn(order._id)}
                    >
                      {isSubmittingReturn ? 'Submitting...' : 'Submit return request'}
                    </button>
                    <button type="button" className="keep-order-button" onClick={() => setReturningId(null)}>
                      Keep order
                    </button>
                  </div>
                </div>
              )}

              {order.tracking?.trackingNumber && (
                <div className="order-delivery-address">
                  <Truck size={17} />
                  <span>
                    <strong>{order.tracking.courier || 'Courier'} tracking</strong>
                    <small>
                      {order.tracking.trackingUrl
                        ? <a href={order.tracking.trackingUrl} target="_blank" rel="noreferrer">{order.tracking.trackingNumber}</a>
                        : order.tracking.trackingNumber}
                    </small>
                  </span>
                </div>
              )}

              {cancellingId === order._id && (
                <div className="order-cancel-form">
                  <label>
                    <span>Why are you cancelling?</span>
                    <select value={reason} onChange={(event) => setReason(event.target.value)}>
                      {cancellationReasons.map((item) => <option value={item} key={item}>{item}</option>)}
                    </select>
                  </label>
                  <p>
                    {order.isPaid
                      ? 'A Razorpay refund will be sent to your original payment method after cancellation.'
                      : 'The items will be made available again when this order is cancelled.'}
                  </p>
                  <div>
                    <button type="button" className="confirm-cancel-button" disabled={isSubmitting} onClick={() => cancelOrder(order._id)}>
                      {isSubmitting ? 'Cancelling...' : 'Confirm cancellation'}
                    </button>
                    <button type="button" className="keep-order-button" onClick={() => setCancellingId(null)}>Keep order</button>
                  </div>
                </div>
              )}

              <footer>
                <span>
                  {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Online payment'}
                  {' - '}
                  {order.paymentMethod === 'cod' ? 'pay on delivery' : order.paymentStatus.replace('_', ' ')}
                </span>
                <div className="order-footer-actions">
                  {canCancel && cancellingId !== order._id && (
                    <button type="button" className="cancel-order-button" onClick={() => setCancellingId(order._id)}>
                      Cancel order
                    </button>
                  )}
                  <button type="button" className="keep-order-button" onClick={() => downloadInvoice(order._id)} disabled={invoiceLoadingId === order._id}>
                    {invoiceLoadingId === order._id ? 'Preparing invoice...' : 'Invoice'}
                  </button>
                  <strong>Total {formatPrice(order.total)}</strong>
                </div>
              </footer>
            </article>
          )
        })}
        <Link className="primary-link orders-shop-link" to="/catalog">Continue shopping</Link>
      </section>
    </main>
  )
}

export default Orders
