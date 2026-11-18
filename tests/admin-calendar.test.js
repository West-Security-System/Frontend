import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shiftMonth } from '../src/utils/monthNavigation.js'
import { parseMonthlyAmount } from '../src/utils/monthlyValueValidation.js'
import { renderCalendarAgenda } from '../src/components/admin/MonthlyCalendar.js'
import { renderMonthlyValueForm } from '../src/components/admin/MonthlyValueForm.js'
import { renderCalendarView } from '../src/views/admin/CalendarView.js'
import { adminCalendarApi } from '../src/services/adminCalendarApi.js'
import { httpClient } from '../src/api/httpClient.js'

test('month navigation handles both directions across a year boundary', () => {
  assert.deepEqual(shiftMonth(12, 2025, 1), { month: 1, year: 2026 })
  assert.deepEqual(shiftMonth(1, 2026, -1), { month: 12, year: 2025 })
})

test('monthly values accept zero and decimals and reject empty, invalid, or negative amounts', () => {
  assert.equal(parseMonthlyAmount('0').value, 0)
  assert.equal(parseMonthlyAmount('1250.75').value, 1250.75)
  for (const value of ['', 'abc', '-0.01']) assert.ok(parseMonthlyAmount(value).error)
})

test('calendar agenda exposes loading, empty, error, and chronologically ordered day groups', () => {
  assert.match(renderCalendarAgenda({ loading: true }), /role="status"/)
  assert.match(renderCalendarAgenda({ calendar: { dias: [] } }), /No hay actividad/)
  assert.match(renderCalendarAgenda({ error: 'Sin conexión' }), /role="alert"/)
  const calendar = { dias: [{ fecha: '2026-03-02', registros: [
    { hora_ingreso: '2026-03-02T11:00:00Z', estado: 'cerrado' },
    { hora_ingreso: '2026-03-02T08:00:00Z', estado: 'abierto' },
  ] }] }
  const html = renderCalendarAgenda({ calendar })
  assert.ok(html.indexOf('08:00') < html.indexOf('11:00'))
})

test('calendar page contains service selection, month navigation, and monthly value form', () => {
  const html = renderCalendarView({
    user: { rol: 'admin', username: 'admin' },
    services: [{ id: 2, nombre: 'Central' }],
    selectedServiceId: '2', month: 12, year: 2025,
    calendar: { dias: [] }, monthlyValue: { valor: null },
  })
  assert.match(html, /calendar-service/)
  assert.match(html, /calendar-previous/)
  assert.match(html, /calendar-next/)
  assert.match(html, /monthly-value-form/)
  assert.match(renderMonthlyValueForm({ error: 'Monto inválido' }), /role="alert"/)
})

test('admin calendar API uses centralized HTTP methods and encoded service IDs', async (context) => {
  const calls = []
  context.mock.method(httpClient, 'get', async (path) => { calls.push(['GET', path]); return { locales: [] } })
  context.mock.method(httpClient, 'put', async (path, body) => { calls.push(['PUT', path, body]); return {} })
  await adminCalendarApi.listServices()
  await adminCalendarApi.getCalendar('7/8', 12, 2025)
  await adminCalendarApi.getMonthlyValue(4, 1, 2026)
  await adminCalendarApi.setMonthlyValue(4, { mes: 1, anio: 2026, valor: 0 })
  assert.deepEqual(calls, [
    ['GET', '/admin/locales'],
    ['GET', '/admin/calendario/7%2F8?mes=12&anio=2025'],
    ['GET', '/admin/valores-mensuales/4?mes=1&anio=2026'],
    ['PUT', '/admin/valores-mensuales/4', { mes: 1, anio: 2026, valor: 0 }],
  ])
})
