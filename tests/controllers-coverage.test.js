import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adminServiceApi } from '../src/services/adminServiceApi.js'
import { adminUserApi } from '../src/services/adminUserApi.js'
import { guardScheduleApi } from '../src/services/guardScheduleApi.js'
import { adminAssignmentApi } from '../src/services/adminAssignmentApi.js'
import { httpClient } from '../src/api/httpClient.js'
import { openAssignmentsModal } from '../src/hooks/adminAssignmentsController.js'
import { mountAdminDashboard } from '../src/hooks/adminDashboardController.js'
import { mountAdminServices } from '../src/hooks/adminServicesController.js'
import { mountAdminUsers } from '../src/hooks/adminUsersController.js'
import { mountGuardSchedules } from '../src/hooks/guardScheduleController.js'
import { installBrowser, createApp, settle, submitForm } from './helpers/browser.js'

const admin = { id: 1, rol: 'admin', username: 'Admin' }
const guard = { id: 2, rol: 'guardia', username: 'Ana' }
const service = { id: 7, nombre: 'Central', latitud: 0, longitud: 0 }
const schedule = { id: 9, servicio_id: 7, dias: [1], hora_inicio: '08:00', hora_fin: '16:00', capacidad: 2 }

test('admin dashboard renders success, refreshes, and retries failed requests', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let fail = true
  context.mock.method(adminUserApi, 'list', async () => ({ usuarios: [{ rol: 'guardia', bloqueado: false, username: 'Ana' }] }))
  context.mock.method(adminServiceApi, 'listServices', async () => ({ locales: [service] }))
  context.mock.method(httpClient, 'get', async () => {
    if (fail) throw new Error('Sin conexión')
    return { horarios: [schedule], asignaciones: [] }
  })
  context.mock.method(adminAssignmentApi, 'listForSchedule', async () => [])
  await mountAdminDashboard(app, admin)
  assert.match(app.textContent, /Sin conexión/)
  fail = false
  app.querySelector('#refresh-dashboard-error').click()
  await settle(browser)
  assert.match(app.textContent, /Ana/)
  app.querySelector('#refresh-dashboard').click()
  await settle(browser)
  assert.match(app.textContent, /Dashboard/)
})

test('assignments modal covers load, assign, unassign, validation and API failure', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let fail = false
  const assignments = []
  context.mock.method(adminAssignmentApi, 'listGuards', async () => {
    if (fail) throw new Error('No se pudieron cargar')
    return [{ id: 2, username: 'Ana', rol: 'guardia' }]
  })
  context.mock.method(adminAssignmentApi, 'listForSchedule', async () => assignments)
  context.mock.method(adminAssignmentApi, 'assign', async (_scheduleId, guardId) => assignments.push({ usuario_id: Number(guardId), username: 'Ana' }))
  context.mock.method(adminAssignmentApi, 'unassign', async () => assignments.pop())

  await openAssignmentsModal(app, schedule, service)
  assert.match(app.textContent, /Seleccionar guardia/)
  const form = app.querySelector('#assignment-form')
  submitForm(browser, form)
  await settle(browser)
  assert.match(app.textContent, /Selecciona una guardia/)
  form.querySelector('select').value = '2'
  submitForm(browser, form)
  await settle(browser)
  assert.match(app.textContent, /Ana/)
  app.querySelector('[data-unassign-guard]').click()
  await settle(browser)
  assert.match(app.textContent, /Todavía no hay guardias/)
  fail = true
  await openAssignmentsModal(app, schedule, service)
  assert.match(app.textContent, /No se pudieron cargar/)
})

test('admin services controller handles forms, selections, deletes, assignment modal and errors', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let serviceRows = [service]
  let scheduleRows = [schedule]
  context.mock.method(adminServiceApi, 'listServices', async () => ({ locales: serviceRows }))
  context.mock.method(adminServiceApi, 'listSchedules', async () => ({ horarios: scheduleRows }))
  context.mock.method(adminServiceApi, 'createService', async () => {})
  context.mock.method(adminServiceApi, 'updateService', async () => {})
  context.mock.method(adminServiceApi, 'deleteService', async () => { serviceRows = [] })
  context.mock.method(adminServiceApi, 'createSchedule', async () => {})
  context.mock.method(adminServiceApi, 'updateSchedule', async () => {})
  context.mock.method(adminServiceApi, 'deleteSchedule', async () => { scheduleRows = [] })
  context.mock.method(adminAssignmentApi, 'listGuards', async () => [{ id: 2, username: 'Ana' }])
  context.mock.method(adminAssignmentApi, 'listForSchedule', async () => [])
  browser.confirm = () => true
  await mountAdminServices(app, admin)
  app.querySelector('#new-service-button').click()
  const serviceForm = app.querySelector('#service-form')
  serviceForm.elements.nombre.value = 'Norte'
  serviceForm.elements.latitud.value = '-32.9'
  serviceForm.elements.longitud.value = '-68.8'
  submitForm(browser, serviceForm)
  await settle(browser)
  assert.match(app.textContent, /Servicio creado correctamente/)

  app.querySelector('#new-schedule-button').click()
  const scheduleForm = app.querySelector('#schedule-form')
  scheduleForm.elements.dias[0].checked = true
  scheduleForm.elements.hora_inicio.value = '18:00'
  scheduleForm.elements.hora_fin.value = '22:00'
  scheduleForm.elements.capacidad.value = '2'
  submitForm(browser, scheduleForm)
  await settle(browser)
  assert.match(app.textContent, /Horario creado correctamente/)

  app.querySelector('[data-assign-schedule]').click()
  await settle(browser)
  assert.match(app.textContent, /Asignar guardias/)
  app.querySelector('[data-close-assignments]').click()
  await settle(browser)

  app.querySelector('[data-edit-service]').click()
  assert.equal(app.querySelector('#service-modal').hidden, false)
  app.querySelector('[data-close-service]').click()
  assert.equal(app.querySelector('#service-modal').hidden, true)
  app.querySelector('[data-edit-schedule]').click()
  await settle(browser)
  assert.equal(app.querySelector('#schedule-modal').hidden, false)
  app.querySelector('[data-close-schedule]').click()
  assert.equal(app.querySelector('#schedule-modal').hidden, true)
  app.querySelector('[data-delete-schedule]').click()
  await settle(browser)
  assert.match(app.textContent, /Horario eliminado correctamente/)
  app.querySelector('[data-delete-service]').click()
  await settle(browser)
  assert.match(app.textContent, /No hay servicios registrados/)
})

test('admin services controller renders load failures and API mutation errors', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  context.mock.method(adminServiceApi, 'listServices', async () => ({ locales: [service] }))
  context.mock.method(adminServiceApi, 'listSchedules', async () => ({ horarios: [schedule] }))
  context.mock.method(adminServiceApi, 'deleteService', async () => { throw new Error('Bloqueado') })
  browser.confirm = () => true
  await mountAdminServices(app, admin)
  app.querySelector('[data-delete-service]').click()
  await settle(browser)
  assert.match(app.textContent, /Bloqueado/)

  context.mock.method(adminServiceApi, 'listServices', async () => { throw new Error('API caída') })
  await mountAdminServices(app, admin)
  assert.match(app.textContent, /API caída/)
})

test('guard schedules controller captures location, submits entry and surfaces service errors', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  Object.defineProperty(browser.navigator, 'geolocation', { configurable: true, value: {
    getCurrentPosition(success) { success({ coords: { latitude: 0, longitude: 0, accuracy: 3 } }) },
  } })
  context.mock.method(guardScheduleApi, 'listAssignedServices', async () => [{ id: 7, nombre: 'Central' }])
  context.mock.method(guardScheduleApi, 'listSchedules', async () => [schedule])
  context.mock.method(guardScheduleApi, 'registerEntry', async () => {})
  await mountGuardSchedules(app, guard)
  app.querySelector('[data-capture-location]').click()
  await settle(browser)
  const form = app.querySelector('#guard-checkin-form')
  submitForm(browser, form)
  await settle(browser)
  assert.match(app.textContent, /Ingreso registrado correctamente/)

  context.mock.method(guardScheduleApi, 'registerEntry', async () => { throw new Error('Conflicto') })
  app.querySelector('[data-capture-location]').click()
  await settle(browser)
  submitForm(browser, app.querySelector('#guard-checkin-form'))
  await settle(browser)
  assert.match(app.textContent, /Conflicto/)
})

test('guard schedule controller handles schedule reload failures and unrelated events', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  context.mock.method(guardScheduleApi, 'listAssignedServices', async () => [{ id: 7, nombre: 'Central' }])
  let shouldFail = false
  context.mock.method(guardScheduleApi, 'listSchedules', async () => {
    if (shouldFail) throw new Error('Sin horarios')
    return [schedule]
  })
  await mountGuardSchedules(app, guard)
  shouldFail = true
  const select = app.querySelector('[data-service-select]')
  select.value = '7'
  select.dispatchEvent(new browser.Event('change', { bubbles: true }))
  await settle(browser)
  assert.match(app.textContent, /Sin horarios/)
})
