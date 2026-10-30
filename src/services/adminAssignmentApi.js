import { httpClient } from '../api/httpClient.js'
import { adminUserApi } from './adminUserApi.js'

export const adminAssignmentApi = {
  listGuards: async () => {
    const result = await adminUserApi.list()
    return (result?.usuarios || []).filter((user) => user.rol === 'guardia')
  },
  listForSchedule: async (scheduleId) => {
    const result = await httpClient.get(`/admin/horarios/${encodeURIComponent(scheduleId)}/guardias`)
    return result?.asignaciones || []
  },
  assign: (scheduleId, guardId) => httpClient.post(`/admin/horarios/${encodeURIComponent(scheduleId)}/guardias`, { usuario_id: Number(guardId) }),
  unassign: (scheduleId, guardId) => httpClient.delete(`/admin/horarios/${encodeURIComponent(scheduleId)}/guardias`, { body: JSON.stringify({ usuario_id: Number(guardId) }) }),
}
