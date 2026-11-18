import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adminCalendarApi } from '../src/services/adminCalendarApi.js'
import { mountAdminCalendar } from '../src/hooks/adminCalendarController.js'
import { shiftMonth } from '../src/utils/monthNavigation.js'
import { installBrowser, createApp, settle, submitForm } from './helpers/browser.js'

test('admin calendar loads the selected service, navigates months, and saves validated values', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  const now = new Date()
  const next = shiftMonth(now.getUTCMonth() + 1, now.getUTCFullYear(), 1)
  const calendarCalls = []
  let savedPayload
  context.mock.method(adminCalendarApi, 'listServices', async () => [{ id: 8, nombre: 'Central' }])
  context.mock.method(adminCalendarApi, 'getCalendar', async (_id, month, year) => {
    calendarCalls.push({ month, year })
    return { dias: [] }
  })
  context.mock.method(adminCalendarApi, 'getMonthlyValue', async () => ({ valor: null }))
  context.mock.method(adminCalendarApi, 'setMonthlyValue', async (_id, payload) => {
    savedPayload = payload
    return { valor_mensual: { valor: payload.valor } }
  })

  await mountAdminCalendar(app, { id: 1, rol: 'admin', username: 'Admin' })
  assert.equal(app.querySelector('#calendar-service').value, '8')
  app.querySelector('#calendar-next').click()
  await settle(browser)
  assert.deepEqual(calendarCalls.at(-1), next)

  const form = app.querySelector('#monthly-value-form')
  form.elements.valor.value = '120.75'
  submitForm(browser, form)
  await settle(browser)
  assert.deepEqual(savedPayload, { mes: next.month, anio: next.year, valor: 120.75 })
  assert.match(app.textContent, /Valor mensual guardado/)

  const invalidForm = app.querySelector('#monthly-value-form')
  invalidForm.elements.valor.value = '-2'
  submitForm(browser, invalidForm)
  await settle(browser)
  assert.match(app.querySelector('#monthly-value-error').textContent, /mayor o igual a cero/)
  assert.equal(savedPayload.valor, 120.75)
})

test('admin calendar exposes a retryable alert when service loading fails', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  context.mock.method(adminCalendarApi, 'listServices', async () => { throw new Error('Sin conexión') })
  await mountAdminCalendar(app, { id: 1, rol: 'admin', username: 'Admin' })
  assert.match(app.querySelector('[role="alert"]').textContent, /Sin conexión/)
  assert.ok(app.querySelector('#retry-calendar'))
})
