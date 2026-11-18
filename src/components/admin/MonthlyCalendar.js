import { escapeHtml } from '../../utils/serviceValidation.js'
import { orderedCalendarDays } from '../../utils/monthNavigation.js'

function formatTime(value) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return '—'
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(timestamp)
}

function renderRecord(record) {
  const status = record.estado === 'abierto' ? 'En curso' : 'Cerrado'
  const service = record.local_nombre || record.servicio_nombre || 'Servicio'
  const guard = record.guardia_username || record.username || 'Guardia'
  return `<li class="calendar-entry"><time datetime="${escapeHtml(record.hora_ingreso || '')}">${formatTime(record.hora_ingreso)}</time><div class="calendar-entry-details"><strong>${escapeHtml(service)}</strong><span>${escapeHtml(guard)}</span></div><span class="tag ${record.estado === 'abierto' ? 'warning' : 'success'}">${status}</span></li>`
}

export function renderCalendarAgenda({ calendar, loading = false, error = '' }) {
  if (loading) return '<div class="calendar-state" role="status" aria-live="polite"><span class="loader" aria-hidden="true"></span><p>Cargando calendario…</p></div>'
  if (error) return `<div class="calendar-state error" role="alert"><p>${escapeHtml(error)}</p><button class="button" id="retry-calendar" type="button">Reintentar</button></div>`
  const days = orderedCalendarDays(calendar?.dias || [])
  if (!days.length) return '<p class="calendar-empty" role="status">No hay actividad registrada para este servicio en el mes seleccionado.</p>'
  return `<div class="calendar-agenda">${days.map((day) => `<section class="calendar-day" aria-labelledby="calendar-day-${escapeHtml(day.fecha)}"><h3 id="calendar-day-${escapeHtml(day.fecha)}"><time datetime="${escapeHtml(day.fecha)}">${escapeHtml(day.fecha)}</time></h3><ol>${day.registros.map(renderRecord).join('')}</ol></section>`).join('')}</div>`
}
