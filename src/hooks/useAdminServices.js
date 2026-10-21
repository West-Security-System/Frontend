import { adminServiceApi } from '../services/adminServiceApi.js'
import { validateSchedule, validateService } from '../utils/serviceValidation.js'

export function createAdminServicesState(user) {
  return { user, services: [], schedules: [], selectedId: '', feedback: '', feedbackTone: 'error' }
}

export async function refreshAdminServices(state) {
  const result = await adminServiceApi.listServices()
  state.services = result?.locales || []
  if (!state.services.some((service) => String(service.id) === String(state.selectedId))) state.selectedId = String(state.services[0]?.id || '')
  state.schedules = state.selectedId ? (await adminServiceApi.listSchedules(state.selectedId))?.horarios || [] : []
}

export function selectedService(state) {
  return state.services.find((service) => String(service.id) === String(state.selectedId)) || null
}

export async function saveService(state, form) {
  const values = Object.fromEntries(new FormData(form).entries())
  const error = validateService(values, state.services, values.id)
  if (error) throw new Error(error)
  const payload = { nombre: values.nombre.trim(), latitud: Number(values.latitud), longitud: Number(values.longitud) }
  if (values.id) await adminServiceApi.updateService({ ...payload, id: Number(values.id) })
  else await adminServiceApi.createService(payload)
  state.feedback = values.id ? 'Servicio actualizado correctamente.' : 'Servicio creado correctamente.'
  state.feedbackTone = 'success'
}

export async function saveSchedule(state, form) {
  const values = Object.fromEntries(new FormData(form).entries())
  values.dias = [...new Set(new FormData(form).getAll('dias').map(Number))].sort((a, b) => a - b)
  const error = validateSchedule(values, state.schedules, values.id)
  if (error) throw new Error(error)
  const payload = { servicio_id: Number(values.servicio_id), dias: values.dias, hora_inicio: values.hora_inicio, hora_fin: values.hora_fin, capacidad: Number(values.capacidad) }
  if (values.id) await adminServiceApi.updateSchedule({ ...payload, id: Number(values.id) })
  else await adminServiceApi.createSchedule(payload)
  state.feedback = values.id ? 'Horario actualizado correctamente.' : 'Horario creado correctamente.'
  state.feedbackTone = 'success'
}

export function requestMessage(error) {
  if (error.status === 409) return `Duplicado o conflicto: ${error.message}`
  if (error.status === 422) return `Dato inválido: ${error.message}`
  return error.message || 'No se pudo completar la operación.'
}
