import { httpClient } from '../api/httpClient.js'

export async function listMisServicios() {
  const result = await httpClient.get('/mis-servicios')
  return Array.isArray(result?.servicios) ? result.servicios : []
}

export async function listHorariosServicio(serviceName) {
  const encodedName = encodeURIComponent(serviceName)
  const result = await httpClient.get(`/servicio/${encodedName}/horarios`)
  return Array.isArray(result?.horarios) ? result.horarios : []
}