import { escapeHtml } from './serviceValidation.js'

export function belongsToUser(item, userId) {
  const ownerId = item.usuario_id ?? item.user_id
  return ownerId === undefined || String(ownerId) === String(userId)
}

export function filterActivity(records, filters = {}) {
  return records.filter((record) => {
    const date = String(record.hora_ingreso || record.fecha || '').slice(0, 10)
    const status = record.estado === 'cerrado' || record.hora_egreso ? 'cerrado' : 'abierto'
    if (filters.desde && date < filters.desde) return false
    if (filters.hasta && date > filters.hasta) return false
    return !filters.estado || filters.estado === status
  })
}

export function formatActivityDate(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return 'No disponible'
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function activityStatus(record) {
  return record.estado === 'cerrado' || record.hora_egreso ? 'Cerrado' : 'En curso'
}

export function renderActivityRow(record) {
  const service = record.servicio || record.local || record.nombre_servicio || 'Servicio'
  const entry = record.hora_ingreso || record.fecha
  const exit = record.hora_egreso
  const status = activityStatus(record)
  return `<tr><th scope="row">${escapeHtml(service)}</th><td>${escapeHtml(formatActivityDate(entry))}</td><td>${escapeHtml(exit ? formatActivityDate(exit) : '—')}</td><td><span class="tag ${exit ? 'success' : 'warning'}">${status}</span></td></tr>`
}
