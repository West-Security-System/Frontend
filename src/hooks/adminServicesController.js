import { adminServiceApi } from '../services/adminServiceApi.js'
import { renderScheduleForm } from '../components/admin/ScheduleForm.js'
import { renderServiceForm } from '../components/admin/ServiceForm.js'
import { renderServicesView } from '../views/admin/ServicesView.js'
import { createAdminServicesState, refreshAdminServices, requestMessage, saveSchedule, saveService, selectedService } from './useAdminServices.js'
import { uniqueSchedules } from '../utils/serviceValidation.js'

let activeListeners

function showServiceModal(app, service = null) {
  const oldModal = app.querySelector('#service-modal')
  oldModal.outerHTML = renderServiceForm(service)
  const modal = app.querySelector('#service-modal')
  modal.hidden = false
  modal.querySelector('input:not([type="hidden"])').focus()
}

function showScheduleModal(app, service, schedule = null) {
  const oldModal = app.querySelector('#schedule-modal')
  oldModal.outerHTML = renderScheduleForm(service, schedule)
  const modal = app.querySelector('#schedule-modal')
  modal.hidden = false
  modal.querySelector('input:not([type="hidden"])').focus()
}

function draw(app, state) {
  app.innerHTML = renderServicesView({ ...state, schedules: uniqueSchedules(state.schedules), selectedService: selectedService(state), error: state.feedback })
  const alert = app.querySelector('#services-alert')
  alert?.classList.toggle('success', state.feedbackTone === 'success')
}

async function refreshAndDraw(app, state) {
  try {
    await refreshAdminServices(state)
    draw(app, state)
  } catch (error) {
    state.feedback = requestMessage(error)
    state.feedbackTone = 'error'
    draw(app, state)
  }
}

function serviceFor(state, id) {
  return state.services.find((service) => String(service.id) === String(id))
}

async function executeMutation(app, state, action) {
  try {
    await action()
    await refreshAdminServices(state)
  } catch (error) {
    state.feedback = requestMessage(error)
    state.feedbackTone = 'error'
  }
  draw(app, state)
}

async function handleServiceClick(event, app, state) {
  const target = event.target.closest('[data-select-service], [data-edit-service], [data-delete-service]')
  if (!target) return false
  const service = serviceFor(state, target.dataset.selectService || target.dataset.editService || target.dataset.deleteService)
  if (target.dataset.selectService) {
    state.selectedId = String(service.id)
    state.feedback = ''
    await refreshAndDraw(app, state)
    return true
  }
  if (target.dataset.editService) showServiceModal(app, service)
  if (target.dataset.deleteService) await deleteService(app, state, service)
  return true
}

async function deleteService(app, state, service) {
  if (!window.confirm(`¿Eliminar el servicio ${service.nombre}?`)) return
  await executeMutation(app, state, async () => {
    await adminServiceApi.deleteService(service.id)
    state.feedback = 'Servicio eliminado correctamente.'
    state.feedbackTone = 'success'
    if (String(state.selectedId) === String(service.id)) state.selectedId = ''
  })
}

async function handleScheduleClick(event, app, state) {
  const target = event.target.closest('[data-edit-schedule], [data-delete-schedule]')
  if (!target) return false
  const schedule = state.schedules.find((item) => String(item.id) === String(target.dataset.editSchedule || target.dataset.deleteSchedule))
  if (target.dataset.editSchedule) showScheduleModal(app, selectedService(state), schedule)
  if (target.dataset.deleteSchedule) await deleteSchedule(app, state, schedule)
  return true
}

async function deleteSchedule(app, state, schedule) {
  const label = `${schedule.hora_inicio}–${schedule.hora_fin}`
  if (!window.confirm(`¿Eliminar el horario ${label}?`)) return
  await executeMutation(app, state, async () => {
    await adminServiceApi.deleteSchedule(schedule.id)
    state.feedback = 'Horario eliminado correctamente.'
    state.feedbackTone = 'success'
  })
}

async function onClick(event, app, state) {
  if (event.target.closest('[data-close-service]')) return app.querySelector('#service-modal').hidden = true
  if (event.target.closest('[data-close-schedule]')) return app.querySelector('#schedule-modal').hidden = true
  if (event.target.closest('#new-service-button')) return showServiceModal(app)
  if (event.target.closest('#new-schedule-button')) return showScheduleModal(app, selectedService(state))
  if (await handleServiceClick(event, app, state)) return
  await handleScheduleClick(event, app, state)
}

async function onSubmit(event, app, state) {
  const form = event.target
  if (!form.matches('#service-form, #schedule-form')) return
  event.preventDefault()
  const savingService = form.matches('#service-form')
  try {
    if (savingService) await saveService(state, form)
    else await saveSchedule(state, form)
    await refreshAdminServices(state)
    draw(app, state)
  } catch (error) {
    const errorElement = app.querySelector(savingService ? '#service-form-error' : '#schedule-form-error')
    errorElement.textContent = requestMessage(error)
  }
}

export async function mountAdminServices(app, user) {
  const state = createAdminServicesState(user)
  activeListeners?.abort()
  activeListeners = new AbortController()
  app.innerHTML = '<main class="page"><section class="auth-panel session-loading" role="status"><span class="loader" aria-hidden="true"></span><p>Cargando servicios...</p></section></main>'
  app.addEventListener('click', (event) => onClick(event, app, state), { signal: activeListeners.signal })
  app.addEventListener('submit', (event) => onSubmit(event, app, state), { signal: activeListeners.signal })
  await refreshAndDraw(app, state)
}
