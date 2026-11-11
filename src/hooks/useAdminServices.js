import { adminServiceApi } from '../services/adminServiceApi.js'
import { validateSchedule, validateService } from '../utils/serviceValidation.js'
import { mutationAction, readFormValues, readSelectedDays } from '../utils/formData.js'
import { resolveSelectedServiceId, setMutationFeedback } from '../utils/adminServiceState.js'

const requestMessages = {
  409: (error) => `Duplicado o conflicto: ${error.message}`,
  422: (error) => `Dato inválido: ${error.message}`,
  default: (error) => error.message || 'No se pudo completar la operación.',
}

export function createAdminServicesState(user) {
  return { user, services: [], schedules: [], selectedId: '', feedback: '', feedbackTone: 'error' }
}

export async function refreshAdminServices(state) {
  const result = await adminServiceApi.listServices()
  state.services = result?.locales || []
  state.selectedId = resolveSelectedServiceId(state.services, state.selectedId)
  state.schedules = state.selectedId ? (await adminServiceApi.listSchedules(state.selectedId))?.horarios || [] : []
}

export function selectedService(state) {
  return state.services.find((service) => String(service.id) === String(state.selectedId)) || null
}

export async function saveService(state, form) {
  const values = readFormValues(form)
  const error = validateService(values, state.services, values.id)
  if (error) throw new Error(error)
  const payload = { nombre: values.nombre.trim(), latitud: Number(values.latitud), longitud: Number(values.longitud) }
  const actions = {
    update: () => adminServiceApi.updateService({ ...payload, id: Number(values.id) }),
    create: () => adminServiceApi.createService(payload),
  }
  await mutationAction(values.id, actions)()
  setMutationFeedback(state, Boolean(values.id), 'Servicio')
}

export async function saveSchedule(state, form) {
  const values = readFormValues(form)
  values.dias = readSelectedDays(form)
  const error = validateSchedule(values, state.schedules, values.id)
  if (error) throw new Error(error)
  const payload = { servicio_id: Number(values.servicio_id), dias: values.dias, hora_inicio: values.hora_inicio, hora_fin: values.hora_fin, capacidad: Number(values.capacidad) }
  const actions = {
    update: () => adminServiceApi.updateSchedule({ ...payload, id: Number(values.id) }),
    create: () => adminServiceApi.createSchedule(payload),
  }
  await mutationAction(values.id, actions)()
  setMutationFeedback(state, Boolean(values.id), 'Horario')
}

export function requestMessage(error) {
  const resolveMessage = requestMessages[error.status] || requestMessages.default
  return resolveMessage(error)
}
