import { httpClient } from '../api/httpClient.js'

export const guardScheduleApi = {
  async listAssignedServices() {
    const result = await httpClient.get('/mis-servicios')
    return result?.servicios || []
  },

  async listSchedules(serviceName) {
    const path = `/servicio/${encodeURIComponent(serviceName)}/horarios`
    const result = await httpClient.get(path)
    return result?.horarios || []
  },

  registerEntry(entry) {
    return httpClient.post('/guardias', entry)
  },

  registerExit(exit) {
    return httpClient.post('/guardias/egreso', exit)
  },
}
