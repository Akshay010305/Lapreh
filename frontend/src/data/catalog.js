export { API_URL } from '../config/env'

export const videos = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/bunny/trailer.mp4',
]

export const palettes = [
  ['#8b3f3f', '#f2d8c2'],
  ['#234a41', '#d9c8a9'],
  ['#263e66', '#d9e1ea'],
  ['#715c2f', '#f1dfb5'],
  ['#5c3f6f', '#e5d7ef'],
  ['#2f4f6f', '#c8d7df'],
]

export function formatPrice(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function getCategoryName(product) {
  return product.category?.name || product.category || 'Unsorted'
}

const asArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value) return []
  return [value]
}

export function getProductImages(product = {}) {
  return asArray(product.images || product.image)
}

export function getProductVideos(product = {}) {
  return asArray(product.videos || product.video)
}

export function resolveMediaSrc(src, kind = 'image') {
  if (!src) return ''
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) return src
  if (src.startsWith('/')) return src
  if (src.startsWith('uploads/')) return `/${src}`
  return kind === 'video' ? `/media/videos/${src}` : `/media/images/${src}`
}
