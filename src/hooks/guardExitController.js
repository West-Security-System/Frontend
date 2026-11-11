import { guardScheduleApi } from '../services/guardScheduleApi.js'
import { renderGuardExitView } from '../views/protected/GuardExitView.js'
import { useGeolocation } from './useGeolocation.js'

let activeListeners

const exitErrorMessages = {
  OUTSIDE_SERVICE_RADIUS: 'Estás fuera del radio permitido de 100 metros. Acércate al servicio e inténtalo nuevamente.',
  ACTIVE_ENTRY_NOT_FOUND: 'No tienes un turno activo para registrar el egreso.',
  ACTIVE_ENTRY_CHANGED: 'El turno ya fue cerrado. Actualiza la página para consultar su estado.',
  UNAUTHENTICATED: 'Tu sesión venció. Inicia sesión nuevamente.',
}

export function createGuardExitState(user, geolocation) {
  return {
    user,
    location: useGeolocation(geolocation),
    feedback: '',
    observations: '',
    submitting: false,
    completed: false,
  }
}

export function createExitPayload(position, observations = '') {
  if (!position) throw new Error('No se pudo obtener la ubicación para registrar el egreso.')
  return {
    latitud: position.latitud,
    longitud: position.longitud,
    observaciones: observations.trim(),
  }
}

function draw(app, state) {
  app.innerHTML = renderGuardExitView({
    ...state,
    locationState: state.location.state,
  })
}

function errorMessage(error) {
  return exitErrorMessages[error.code] || error.message || 'No se pudo registrar el egreso. Inténtalo nuevamente.'
}

async function submitExit(event, app, state) {
  event.preventDefault()
  if (state.submitting || state.completed) return

  state.submitting = true
  state.feedback = ''
  draw(app, state)
  const locationRequest = state.location.getCurrentPosition()
  draw(app, state)
  const position = await locationRequest
  if (!position) {
    state.feedback = state.location.state.error
    state.submitting = false
    return draw(app, state)
  }

  try {
    await guardScheduleApi.registerExit(createExitPayload(position, state.observations))
    state.completed = true
    state.feedback = 'Egreso registrado correctamente. Tu turno quedó cerrado.'
  } catch (error) {
    state.feedback = errorMessage(error)
  } finally {
    state.submitting = false
    draw(app, state)
  }
}

function bindEvents(app, state) {
  activeListeners?.abort()
  activeListeners = new AbortController()
  const options = { signal: activeListeners.signal }
  app.addEventListener('input', (event) => {
    if (event.target.matches('[data-exit-observations]')) state.observations = event.target.value
  }, options)
  app.addEventListener('submit', (event) => {
    if (!event.target.matches('#guard-checkout-form')) return
    return submitExit(event, app, state)
  }, options)
}

export function mountGuardExit(app, user, geolocation) {
  const state = createGuardExitState(user, geolocation)
  bindEvents(app, state)
  draw(app, state)
  return state
}
