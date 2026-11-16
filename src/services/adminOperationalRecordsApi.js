import { ApiError, httpClient } from '../api/httpClient.js'

function queryString(filters = {}) {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) query.set(key, value)
  })
  return query.toString() ? `?${query}` : ''
}

function explicitNotFound(error) {
  if (error.status !== 404) throw error
  throw new ApiError('El registro solicitado ya no existe.', {
    status: 404, code: 'RECORD_NOT_FOUND', details: error.details,
  })
}

async function getDetail(id) {
  try {
    return await httpClient.get(`/admin/registros/${encodeURIComponent(id)}`)
  } catch (error) {
    explicitNotFound(error)
  }
}

export const adminOperationalRecordsApi = {
  listActive: (filters = {}) => httpClient.get(`/admin/activos${queryString(filters)}`),
  listHistory: (filters = {}) => httpClient.get(`/admin/registros${queryString(filters)}`),
  getDetail,
  close: (ids, horaEgreso) => httpClient.post('/admin/registros/cerrar', { ids, hora_egreso: horaEgreso }),
  remove: (ids) => httpClient.delete('/admin/registros', { body: JSON.stringify({ ids }) }),
}
