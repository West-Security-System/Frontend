import { listHorariosServicio, listMisServicios } from '../services/misServicios.js'
import { useGeolocation } from './useGeolocation.js'
import { renderAssignedServicesView } from '../views/guard/AssignedServicesView.js'

function initialState() {
  return {
    services: [], schedules: [], selectedServiceId: '', selectedScheduleId: '',
    servicesLoading: true, servicesError: '', loadingSchedules: false, schedulesError: '',
    location: null, locationStatus: 'idle', locationError: '', geolocation: useGeolocation(),
    submitting: false, prepared: false,
  }
}

function selectedService(state) {
  return state.services.find((service) => String(service.id) === String(state.selectedServiceId))
}

function draw(app, user, state) {
  app.innerHTML = renderAssignedServicesView(user, state)
  bindEvents(app, user, state)
}

async function loadServices(app, user, state) {
  state.servicesLoading = true
  state.servicesError = ''
  draw(app, user, state)
  try { state.services = await listMisServicios() } catch (error) { state.servicesError = error.message }
  state.servicesLoading = false
  draw(app, user, state)
}

async function loadSchedules(app, user, state, requestId) {
  const service = selectedService(state)
  if (!service) {
    state.loadingSchedules = false
    return draw(app, user, state)
  }
  state.loadingSchedules = true
  state.schedulesError = ''
  draw(app, user, state)
  try {
    const schedules = await listHorariosServicio(service.nombre)
    if (requestId !== state.scheduleRequestId) return
    state.schedules = schedules
  } catch (error) {
    if (requestId !== state.scheduleRequestId) return
    state.schedulesError = error.message
  }
  state.loadingSchedules = false
  draw(app, user, state)
}

function resetLocation(state) {
  const locationState = state.geolocation.reset()
  state.location = locationState.location
  state.locationStatus = locationState.status
  state.locationError = locationState.error
}

function resetPreparation(state) {
  state.selectedScheduleId = ''
  resetLocation(state)
  state.prepared = false
}

function bindServiceChange(app, user, state) {
  app.querySelector('#assigned-service')?.addEventListener('change', (event) => {
    state.selectedServiceId = event.currentTarget.value
    state.schedules = []
    state.schedulesError = ''
    resetPreparation(state)
    state.scheduleRequestId = (state.scheduleRequestId || 0) + 1
    loadSchedules(app, user, state, state.scheduleRequestId)
  })
}

function bindScheduleChange(app, user, state) {
  app.querySelector('#assigned-schedule')?.addEventListener('change', (event) => {
    state.selectedScheduleId = event.currentTarget.value
    resetLocation(state)
    state.prepared = false
    draw(app, user, state)
  })
}

async function requestLocation(app, user, state) {
  if (!state.selectedScheduleId || state.locationStatus === 'loading') return
  state.locationStatus = 'loading'
  state.locationError = ''
  draw(app, user, state)
  const locationState = await state.geolocation.capture()
  state.location = locationState.location
  state.locationStatus = locationState.status
  state.locationError = locationState.error
  draw(app, user, state)
}

function continuePreparation(app, user, state) {
  if (!state.selectedScheduleId || !state.location || state.submitting || state.prepared) return
  state.submitting = true
  draw(app, user, state)
  state.prepared = true
  state.submitting = false
  draw(app, user, state)
}

function bindEvents(app, user, state) {
  bindServiceChange(app, user, state)
  bindScheduleChange(app, user, state)
  app.querySelector('#request-location')?.addEventListener('click', () => requestLocation(app, user, state))
  app.querySelector('#continue-checkin')?.addEventListener('click', () => continuePreparation(app, user, state))
  app.querySelector('#retry-services')?.addEventListener('click', () => loadServices(app, user, state))
}

export async function mountGuardServices(app, user) {
  const state = initialState()
  draw(app, user, state)
  await loadServices(app, user, state)
}
