import { httpClient } from '../api/httpClient.js'

function monthQuery(month, year) {
  const query = new URLSearchParams({ mes: String(month), anio: String(year) })
  return query.toString()
}

export const adminCalendarApi = {
  async listServices() {
    const result = await httpClient.get('/admin/locales')
    return result?.locales || []
  },
  getCalendar(serviceId, month, year) {
    return httpClient.get(`/admin/calendario/${encodeURIComponent(serviceId)}?${monthQuery(month, year)}`)
  },
  getMonthlyValue(serviceId, month, year) {
    return httpClient.get(`/admin/valores-mensuales/${encodeURIComponent(serviceId)}?${monthQuery(month, year)}`)
  },
  setMonthlyValue(serviceId, payload) {
    return httpClient.put(`/admin/valores-mensuales/${encodeURIComponent(serviceId)}`, payload)
  },
}
