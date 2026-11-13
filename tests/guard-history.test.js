import { test } from 'node:test'
import assert from 'node:assert/strict'
import { guardActivityApi } from '../src/services/guardActivityApi.js'
import { httpClient } from '../src/api/httpClient.js'
import { belongsToUser, filterActivity, formatActivityDate } from '../src/utils/activityHistory.js'
import { renderGuardHistoryView } from '../src/views/protected/GuardHistoryView.js'
import { mountGuardHistory } from '../src/hooks/guardHistoryController.js'
import { installBrowser, createApp, submitForm, settle } from './helpers/browser.js'

const user = { id: 4, rol: 'guardia', username: 'Guardia Uno' }

test('activity API builds optional history filters and loads private notifications', async (context) => {
  const paths = []
  context.mock.method(httpClient, 'get', async (path) => {
    paths.push(path)
    if (path.startsWith('/mis-registros')) return { registros: [{ id: 1 }] }
    return { notificaciones: [{ id: 2 }] }
  })
  context.mock.method(httpClient, 'post', async (...args) => args)

  assert.deepEqual(await guardActivityApi.listRecords(), [{ id: 1 }])
  assert.deepEqual(await guardActivityApi.listRecords({ desde: '2026-01-01', hasta: '2026-01-31', estado: 'cerrado' }), [{ id: 1 }])
  assert.deepEqual(await guardActivityApi.listNotifications(), [{ id: 2 }])
  assert.deepEqual(await guardActivityApi.markNotificationsRead(), ['/notificaciones/leidas', {}])
  assert.equal(paths[0], '/mis-registros')
  assert.equal(paths[1], '/mis-registros?desde=2026-01-01&hasta=2026-01-31&estado=cerrado')
})

test('activity helpers scope records and filter dates and status', () => {
  const records = [
    { id: 1, usuario_id: 4, hora_ingreso: '2026-05-01T08:00:00Z' },
    { id: 2, usuario_id: 4, hora_ingreso: '2026-05-02T08:00:00Z', hora_egreso: '2026-05-02T16:00:00Z' },
    { id: 3, usuario_id: 5, hora_ingreso: '2026-05-02T08:00:00Z' },
  ]
  const own = records.filter((record) => belongsToUser(record, user.id))
  assert.deepEqual(filterActivity(own, { desde: '2026-05-02', hasta: '2026-05-02', estado: 'cerrado' }), [records[1]])
  assert.equal(belongsToUser({ id: 4 }, user.id), true)
  assert.equal(formatActivityDate('not a date'), 'No disponible')
})

test('history view renders filters, record states, empty and error states, and unread count', () => {
  const html = renderGuardHistoryView({
    user,
    filters: { desde: '2026-05-01', estado: 'abierto' },
    records: [{ servicio: '<Central>', hora_ingreso: '2026-05-01T08:00:00Z' }],
    notifications: [{ mensaje: '<Aviso>', leido: false }],
  })
  assert.match(html, /activity-filters/)
  assert.match(html, /&lt;Central&gt;/)
  assert.match(html, /En curso/)
  assert.match(html, /&lt;Aviso&gt;/)
  assert.match(html, /aria-label="1 avisos sin leer"/)
  assert.match(renderGuardHistoryView({ user, error: 'Offline' }), /Offline/)
  assert.match(renderGuardHistoryView({ user, loading: true }), /Cargando historial/)
  assert.match(renderGuardHistoryView({ user }), /No hay registros/)
})

test('history controller loads owned rows, filters them, and marks notifications read', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  const requestedFilters = []
  context.mock.method(guardActivityApi, 'listRecords', async (filters) => {
    requestedFilters.push(filters)
    return [
    { id: 1, usuario_id: 4, servicio: 'Central', hora_ingreso: '2026-05-01T08:00:00Z' },
    { id: 2, usuario_id: 9, servicio: 'Privado', hora_ingreso: '2026-05-01T08:00:00Z' },
    ]
  })
  context.mock.method(guardActivityApi, 'listNotifications', async () => [
    { id: 1, usuario_id: 4, mensaje: 'Turno confirmado', leido: false },
    { id: 2, usuario_id: 9, mensaje: 'Aviso ajeno', leido: false },
  ])
  context.mock.method(guardActivityApi, 'markNotificationsRead', async () => {})

  await mountGuardHistory(app, user)
  assert.match(app.textContent, /Central/)
  assert.doesNotMatch(app.textContent, /Privado|Aviso ajeno/)
  assert.equal(app.querySelector('#mark-notifications-read').disabled, false)
  const form = app.querySelector('#activity-filters')
  form.elements.desde.value = '2026-05-02'
  submitForm(browser, form)
  await settle(browser)
  assert.match(app.textContent, /No hay registros para los filtros/)
  assert.deepEqual(requestedFilters[1], { desde: '2026-05-02', hasta: '', estado: '' })
  app.querySelector('#mark-notifications-read').click()
  await settle(browser)
  assert.match(app.textContent, /Leído/)
  assert.equal(app.querySelector('#mark-notifications-read').disabled, true)
})

test('history controller shows API failures and retries without making false success claims', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let shouldFail = true
  context.mock.method(guardActivityApi, 'listRecords', async () => {
    if (shouldFail) throw new Error('HTTP 500')
    return []
  })
  context.mock.method(guardActivityApi, 'listNotifications', async () => [])
  await mountGuardHistory(app, user)
  assert.match(app.textContent, /HTTP 500/)
  shouldFail = false
  app.querySelector('#retry-activity').click()
  await settle(browser)
  assert.match(app.textContent, /No hay registros/)
})

test('history controller reports mark-read failures', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  context.mock.method(guardActivityApi, 'listRecords', async () => [])
  context.mock.method(guardActivityApi, 'listNotifications', async () => [{ id: 3, mensaje: 'Aviso', leido: false }])
  context.mock.method(guardActivityApi, 'markNotificationsRead', async () => { throw new Error('HTTP 403') })
  await mountGuardHistory(app, user)
  app.querySelector('#mark-notifications-read').click()
  await settle(browser)
  assert.match(app.textContent, /HTTP 403/)
  assert.match(app.textContent, /No leído/)
})
