export function getTokenExpiryMs(token) {
  if (!token) return null

  try {
    const [, payload] = token.split('.')
    if (!payload) return null

    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const decodedPayload = JSON.parse(window.atob(normalizedPayload))

    return typeof decodedPayload.exp === 'number' ? decodedPayload.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpired(token, now = Date.now()) {
  const expiryMs = getTokenExpiryMs(token)
  return !expiryMs || expiryMs <= now
}

export function clearStoredAuth() {
  localStorage.removeItem('lapreh-token')
  localStorage.removeItem('lapreh-user')
}
