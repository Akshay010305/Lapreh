import { API_URL } from '../data/catalog'
import { clearStoredAuth } from './auth'

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('lapreh-token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && token) {
      clearStoredAuth()
      window.dispatchEvent(new Event('lapreh-auth-expired'))
    }
    throw new Error(data.message || 'Something went wrong')
  }
  return data
}

export function normalizeCart(cart) {
  return (cart?.items || [])
    .filter((item) => item.product)
    .map((item) => ({
      ...item.product,
      price: item.variantId
        ? item.product.variants?.find((variant) => variant._id === item.variantId)?.price || item.product.price
        : item.product.price,
      selectedVariantId: item.variantId,
      selectedVariantName: item.variantName,
      quantity: item.quantity,
      cartItemId: item._id,
    }))
}
