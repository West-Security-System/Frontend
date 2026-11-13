import { httpClient } from '../api/httpClient.js'

function historyPath(filters = {}) {
  const query = new URLSearchParams()
  if (filters.desde) query.set('desde', filters.desde)
  if (filters.hasta) query.set('hasta', filters.hasta)
  if (filters.estado) query.set('estado', filters.estado)
  const suffix = query.toString()
  return `/mis-registros${suffix ? `?${suffix}` : ''}`
}

export const guardActivityApi = {
  async listRecords(filters) {
    const result = await httpClient.get(historyPath(filters))
    return result?.registros || result?.marcas || []
  },
  async listNotifications() {
    const result = await httpClient.get('/notificaciones')
    return result?.notificaciones || []
  },
  markNotificationsRead() {
    return httpClient.post('/notificaciones/leidas', {})
  },
}
