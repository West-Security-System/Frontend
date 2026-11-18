import { httpClient } from '../api/httpClient.js'

export const guardActivityApi = {
  async listRecords() {
    const result = await httpClient.get('/mis-registros')
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
