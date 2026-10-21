export const WEEKDAYS = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' }, { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}

export function validateService(values, services, editingId = '') {
  const name = values.nombre.trim()
  if (!name) return 'Ingresa el nombre del servicio.'
  if (services.some((service) => service.nombre.toLocaleLowerCase() === name.toLocaleLowerCase() && String(service.id) !== String(editingId))) return 'Ya existe un servicio con ese nombre.'
  const latitude = Number(values.latitud)
  const longitude = Number(values.longitud)
  if (values.latitud.trim() === '' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'La latitud debe estar entre -90 y 90.'
  if (values.longitud.trim() === '' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'La longitud debe estar entre -180 y 180.'
  return ''
}

export function validateSchedule(values, schedules, editingId = '') {
  if (!values.servicio_id) return 'Selecciona un servicio.'
  if (!values.dias.length) return 'Selecciona al menos un día.'
  if (!values.hora_inicio || !values.hora_fin || values.hora_fin <= values.hora_inicio) return 'La hora final debe ser posterior a la inicial.'
  if (!Number.isInteger(Number(values.capacidad)) || Number(values.capacidad) <= 0) return 'La capacidad debe ser un entero mayor que cero.'
  if (schedules.some((schedule) => String(schedule.id) !== String(editingId) && isSameSchedule(schedule, values))) return 'Ya existe un horario con esos días y horas para este servicio.'
  return ''
}

function normalizedDays(days) {
  return [...new Set((Array.isArray(days) ? days : JSON.parse(days || '[]')).map(Number))].sort((a, b) => a - b).join(',')
}

function isSameSchedule(schedule, values) {
  return normalizedDays(schedule.dias).split(',').length === Number(values.dias.length)
    && normalizedDays(schedule.dias) === normalizedDays(values.dias)
    && schedule.hora_inicio === values.hora_inicio
    && schedule.hora_fin === values.hora_fin
}

export function uniqueSchedules(schedules) {
  const seen = new Set()
  return schedules.filter((schedule) => {
    const key = [normalizedDays(schedule.dias), schedule.hora_inicio, schedule.hora_fin].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
