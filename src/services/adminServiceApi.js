import { httpClient } from '../api/httpClient.js'

export const adminServiceApi = {
  listServices: () => httpClient.get('/admin/locales'),
  createService: (service) => httpClient.post('/admin/locales', service),
  updateService: (service) => httpClient.put('/admin/locales', service),
  deleteService: (id) => httpClient.delete(`/admin/locales?id=${encodeURIComponent(id)}`),
  listSchedules: (serviceId) => httpClient.get(`/admin/horarios?servicio_id=${encodeURIComponent(serviceId)}`),
  createSchedule: (schedule) => httpClient.post('/admin/horarios', schedule),
  updateSchedule: (schedule) => httpClient.put('/admin/horarios', schedule),
  deleteSchedule: (id) => httpClient.delete(`/admin/horarios?id=${encodeURIComponent(id)}`),
}
