import { httpClient } from '../api/httpClient.js'

function queryString(filters = {}) {
  const query = new URLSearchParams()
  for (const key of ['guardia_id', 'servicio_id', 'estado', 'desde', 'hasta', 'limit']) {
    if (filters[key] !== undefined && filters[key] !== '') query.set(key, String(filters[key]))
  }
  return query.toString()
}

function recordsPath(path, filters) {
  const query = queryString(filters)
  return `${path}${query ? `?${query}` : ''}`
}

export const adminRecordsApi = {
  async listActive(filters) {
    const result = await httpClient.get(recordsPath('/admin/activos', filters))
    return result?.registros || []
  },
  async listHistory(filters) {
    const result = await httpClient.get(recordsPath('/admin/registros', filters))
    return result?.registros || []
  },
  async close(recordId, exitTime = new Date().toISOString()) {
    return httpClient.patch(`/admin/registros/${encodeURIComponent(recordId)}/cerrar`, { hora_egreso: exitTime })
  },
  async remove(recordIds) {
    return httpClient.delete('/admin/registros', { body: JSON.stringify({ ids: recordIds }) })
  },
}
