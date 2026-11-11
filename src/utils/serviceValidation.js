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

function hasDuplicateService(name, services, editingId) {
  const normalizedName = name.toLocaleLowerCase()
  return services.some((service) => (
    service.nombre.toLocaleLowerCase() === normalizedName
    && String(service.id) !== String(editingId)
  ))
}

function validateLatitude(value) {
  const latitude = Number(value)
  return value.trim() !== '' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
}

function validateLongitude(value) {
  const longitude = Number(value)
  return value.trim() !== '' && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
}

function serviceValidationRules(values, services, editingId) {
  const name = String(values.nombre || '').trim()
  return [
    () => name ? '' : 'Ingresa el nombre del servicio.',
    () => !hasDuplicateService(name, services, editingId) ? '' : 'Ya existe un servicio con ese nombre.',
    () => validateLatitude(String(values.latitud ?? '')) ? '' : 'La latitud debe estar entre -90 y 90.',
    () => validateLongitude(String(values.longitud ?? '')) ? '' : 'La longitud debe estar entre -180 y 180.',
  ]
}

function firstValidationError(rules) {
  return rules.map((validate) => validate()).find(Boolean) || ''
}

export function validateService(values, services, editingId = '') {
  return firstValidationError(serviceValidationRules(values, services, editingId))
}

export function normalizedDays(days) {
  const scheduleDays = Array.isArray(days) ? days : JSON.parse(days || '[]')
  return [...new Set(scheduleDays.map(Number))].sort((a, b) => a - b).join(',')
}

export function isSameSchedule(schedule, values) {
  const scheduleDays = normalizedDays(schedule.dias)
  const requestedDays = normalizedDays(values.dias || [])
  return scheduleDays === requestedDays
    && schedule.hora_inicio === values.hora_inicio
    && schedule.hora_fin === values.hora_fin
}

function hasDuplicateSchedule(values, schedules, editingId) {
  return schedules.some((schedule) => (
    String(schedule.id) !== String(editingId) && isSameSchedule(schedule, values)
  ))
}

function scheduleValidationRules(values, schedules, editingId) {
  const days = Array.isArray(values.dias) ? values.dias : []
  return [
    () => values.servicio_id ? '' : 'Selecciona un servicio.',
    () => days.length ? '' : 'Selecciona al menos un día.',
    () => values.hora_inicio && values.hora_fin && values.hora_fin > values.hora_inicio
      ? '' : 'La hora final debe ser posterior a la inicial.',
    () => Number.isInteger(Number(values.capacidad)) && Number(values.capacidad) > 0
      ? '' : 'La capacidad debe ser un entero mayor que cero.',
    () => !hasDuplicateSchedule({ ...values, dias: days }, schedules, editingId)
      ? '' : 'Ya existe un horario con esos días y horas para este servicio.',
  ]
}

export function validateSchedule(values, schedules, editingId = '') {
  return firstValidationError(scheduleValidationRules(values, schedules, editingId))
}

export function uniqueSchedules(schedules) {
  const seen = new Set()
  return schedules.filter((schedule) => {
    const key = [normalizedDays(schedule.dias), schedule.hora_inicio, schedule.hora_fin].join('|')
    const isUnique = !seen.has(key)
    seen.add(key)
    return isUnique
  })
}
