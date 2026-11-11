import { adminServiceApi } from '../services/adminServiceApi.js'
import { renderScheduleForm } from '../components/admin/ScheduleForm.js'
import { renderServiceForm } from '../components/admin/ServiceForm.js'
import { renderServicesView } from '../views/admin/ServicesView.js'
import { createAdminServicesState, refreshAdminServices, requestMessage, saveSchedule, saveService, selectedService } from './useAdminServices.js'
import { uniqueSchedules } from '../utils/serviceValidation.js'
import { openAssignmentsModal } from './adminAssignmentsController.js'
import { findDataAction } from '../utils/domActions.js'

let activeListeners

const serviceActionKeys = {
  selectService: 'selectService',
  editService: 'editService',
  deleteService: 'deleteService',
}

const scheduleActionKeys = {
  assignSchedule: 'assignSchedule',
  editSchedule: 'editSchedule',
  deleteSchedule: 'deleteSchedule',
}

const formActions = {
  service: { save: saveService, errorSelector: '#service-form-error' },
  schedule: { save: saveSchedule, errorSelector: '#schedule-form-error' },
}

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
  const actionKey = findDataAction(target, serviceActionKeys)
  const serviceId = target.dataset[actionKey]
  const service = serviceFor(state, serviceId)
  const actions = {
    selectService: () => selectService(app, state, service),
    editService: () => showServiceModal(app, service),
    deleteService: () => deleteService(app, state, service),
  }
  await actions[actionKey]?.()
  return Boolean(actionKey)
}

async function selectService(app, state, service) {
  if (!service) return
  state.selectedId = String(service.id)
  state.feedback = ''
  await refreshAndDraw(app, state)
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
  const target = event.target.closest('[data-assign-schedule], [data-edit-schedule], [data-delete-schedule]')
  if (!target) return false
  const actionKey = findDataAction(target, scheduleActionKeys)
  const scheduleId = target.dataset[actionKey]
  const schedule = state.schedules.find((item) => String(item.id) === String(scheduleId))
  if (!schedule) return true
  const actions = {
    assignSchedule: () => openAssignmentsModal(app, schedule, selectedService(state)),
    editSchedule: () => showScheduleModal(app, selectedService(state), schedule),
    deleteSchedule: () => deleteSchedule(app, state, schedule),
  }
  await actions[actionKey]?.()
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
  const actions = [
    { selector: '[data-close-service]', run: () => hideModal(app, '#service-modal') },
    { selector: '[data-close-schedule]', run: () => hideModal(app, '#schedule-modal') },
    { selector: '#new-service-button', run: () => showServiceModal(app) },
    { selector: '#new-schedule-button', run: () => showScheduleModal(app, selectedService(state)) },
  ]
  const action = actions.find(({ selector }) => event.target.closest(selector))
  if (action) return action.run()
  if (await handleServiceClick(event, app, state)) return
  await handleScheduleClick(event, app, state)
}

function hideModal(app, selector) {
  app.querySelector(selector).hidden = true
}

async function onSubmit(event, app, state) {
  const form = event.target
  const formType = getFormType(form)
  if (!formType) return
  event.preventDefault()
  try {
    await formActions[formType].save(state, form)
    await refreshAdminServices(state)
    draw(app, state)
  } catch (error) {
    const errorElement = app.querySelector(formActions[formType].errorSelector)
    errorElement.textContent = requestMessage(error)
  }
}

function getFormType(form) {
  if (form.matches('#service-form')) return 'service'
  if (form.matches('#schedule-form')) return 'schedule'
  return ''
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
