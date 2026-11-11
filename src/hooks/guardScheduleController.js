import { guardScheduleApi } from '../services/guardScheduleApi.js'
import { renderGuardSchedulesView } from '../views/protected/GuardSchedulesView.js'
import { useGeolocation } from './useGeolocation.js'

let activeListeners

export function createGuardScheduleState(user, geolocation) {
  return {
    user,
    services: [],
    selectedServiceId: '',
    schedules: [],
    selectedScheduleId: '',
    loading: true,
    feedback: '',
    location: useGeolocation(geolocation),
    scheduleRequestId: 0,
  }
}

function selectedService(state) {
  return state.services.find((service) => String(service.id) === String(state.selectedServiceId))
}

function draw(app, state) {
  app.innerHTML = renderGuardSchedulesView({
    ...state,
    locationState: state.location.state,
  })
}

async function loadSchedules(state) {
  const service = selectedService(state)
  const requestId = ++state.scheduleRequestId
  state.selectedScheduleId = ''
  state.schedules = []
  if (!service) return

  const schedules = await guardScheduleApi.listSchedules(service.nombre)
  if (requestId !== state.scheduleRequestId) return
  state.schedules = schedules
  state.selectedScheduleId = String(schedules[0]?.id || '')
}

export async function refreshGuardSchedules(state) {
  state.loading = true
  state.feedback = ''
  try {
    state.services = await guardScheduleApi.listAssignedServices()
    state.selectedServiceId = String(state.services[0]?.id || '')
    await loadSchedules(state)
  } catch (error) {
    state.feedback = error.message || 'No se pudieron cargar tus servicios asignados.'
    state.services = []
    state.schedules = []
    state.selectedServiceId = ''
    state.selectedScheduleId = ''
  } finally {
    state.loading = false
  }
}

async function handleServiceChange(event, app, state) {
  if (!event.target.matches('[data-service-select]')) return
  state.selectedServiceId = event.target.value
  state.feedback = ''
  state.loading = true
  draw(app, state)
  try {
    await loadSchedules(state)
  } catch (error) {
    state.feedback = error.message || 'No se pudieron cargar los horarios del servicio.'
    state.schedules = []
    state.selectedScheduleId = ''
  } finally {
    state.loading = false
    draw(app, state)
  }
}

async function captureLocation(app, state) {
  const locationRequest = state.location.getCurrentPosition()
  draw(app, state)
  await locationRequest
  draw(app, state)
}

export function createEntryPayload(state) {
  const service = selectedService(state)
  const position = state.location.state.position
  if (!service || !state.selectedScheduleId || !position) {
    throw new Error('Selecciona un horario y captura tu ubicación antes de continuar.')
  }
  return {
    servicio_id: Number(service.id),
    horario_id: Number(state.selectedScheduleId),
    latitud: position.latitud,
    longitud: position.longitud,
  }
}

async function registerEntry(event, app, state) {
  event.preventDefault()
  let payload
  try {
    payload = createEntryPayload(state)
  } catch (error) {
    state.feedback = error.message
    return draw(app, state)
  }

  state.loading = true
  state.feedback = ''
  draw(app, state)
  try {
    await guardScheduleApi.registerEntry(payload)
    state.feedback = 'Ingreso registrado correctamente.'
    state.location.state.position = null
    state.location.state.status = 'idle'
  } catch (error) {
    state.feedback = error.message || 'No se pudo registrar el ingreso.'
  } finally {
    state.loading = false
    draw(app, state)
  }
}

function bindEvents(app, state) {
  activeListeners?.abort()
  activeListeners = new AbortController()
  const options = { signal: activeListeners.signal }
  app.addEventListener('change', (event) => handleServiceChange(event, app, state), options)
  app.addEventListener('click', (event) => {
    if (!event.target.closest('[data-capture-location]')) return
    captureLocation(app, state)
  }, options)
  app.addEventListener('submit', (event) => {
    if (!event.target.matches('#guard-checkin-form')) return
    registerEntry(event, app, state)
  }, options)
}

export async function mountGuardSchedules(app, user) {
  const state = createGuardScheduleState(user)
  bindEvents(app, state)
  draw(app, state)
  await refreshGuardSchedules(state)
  draw(app, state)
}
