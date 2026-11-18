const apiEnvironment = import.meta.env || {}
const API_BASE_URL = (apiEnvironment.VITE_API_URL || apiEnvironment.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = Number(apiEnvironment.VITE_API_TIMEOUT_MS || 10000)
let unauthorizedHandler = () => {}

const statusMessages = {
  400: 'La solicitud tiene un formato inválido.',
  401: 'Tu sesión no es válida o ha expirado.',
  403: 'No tienes permisos suficientes o la operación está fuera del radio de 100 metros.',
  404: 'No se encontró el recurso solicitado.',
  409: 'La operación entra en conflicto con el estado actual.',
  422: 'Revisa los datos enviados e inténtalo de nuevo.',
  429: 'Demasiados intentos, esperá unos minutos.',
  500: 'El servidor encontró un problema. Inténtalo más tarde.',
}

export class ApiError extends Error {
  constructor(message, { status = 0, details = null, code = 'API_ERROR' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.code = code
  }
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : () => {}
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return response.json()
  const text = await response.text()
  return text ? { message: text } : null
}

export async function request(path, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
    const data = await parseResponse(response)
    if (!response.ok) {
      if (response.status === 401 && path !== '/login') unauthorizedHandler()
      const responseError = data && data.error ? data.error : data
      throw new ApiError(responseError?.message || statusMessages[response.status] || 'La solicitud no pudo completarse.', {
        status: response.status,
        details: responseError,
        code: responseError?.code || `HTTP_${response.status}`,
      })
    }
    return data && Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error.name === 'AbortError') {
      throw new ApiError('La solicitud tardó demasiado. Inténtalo de nuevo.', { code: 'TIMEOUT' })
    }
    throw new ApiError('No se pudo conectar con el servidor. Comprueba tu conexión.', { code: 'NETWORK_ERROR' })
  } finally {
    clearTimeout(timeoutId)
  }
}

export const httpClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}