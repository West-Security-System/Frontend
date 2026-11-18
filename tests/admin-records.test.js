import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adminRecordsApi } from '../src/services/adminRecordsApi.js'
import { httpClient } from '../src/api/httpClient.js'
import { mountAdminRecords } from '../src/hooks/adminRecordsController.js'
import { installBrowser, createApp, settle } from './helpers/browser.js'

test('admin record API matches active, historical, close and bulk-delete backend contracts', async (context) => {
  const calls = []
  context.mock.method(httpClient, 'get', async (path) => { calls.push(['GET', path]); return { registros: [] } })
  context.mock.method(httpClient, 'patch', async (path, body) => { calls.push(['PATCH', path, body]); return {} })
  context.mock.method(httpClient, 'delete', async (path, options) => { calls.push(['DELETE', path, options]); return {} })
  await adminRecordsApi.listActive({ desde: '2026-01-01', hasta: '2026-01-31' })
  await adminRecordsApi.listHistory({ estado: 'cerrado', limit: 25 })
  await adminRecordsApi.close('7/8', '2026-01-31T20:00:00.000Z')
  await adminRecordsApi.remove([7, 8])
  assert.deepEqual(calls, [
    ['GET', '/admin/activos?desde=2026-01-01&hasta=2026-01-31'],
    ['GET', '/admin/registros?estado=cerrado&limit=25'],
    ['PATCH', '/admin/registros/7%2F8/cerrar', { hora_egreso: '2026-01-31T20:00:00.000Z' }],
    ['DELETE', '/admin/registros', { body: '{"ids":[7,8]}' }],
  ])
})

test('admin record supervision filters, closes active records, and removes selected history', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let history = false
  let closedId
  let deleted
  context.mock.method(adminRecordsApi, 'listActive', async () => [{ id: 4, username: 'Rosa', local_nombre: 'Central', hora_ingreso: '2026-02-01T08:00:00Z' }])
  context.mock.method(adminRecordsApi, 'listHistory', async () => { history = true; return [{ id: 4, username: 'Rosa', local_nombre: 'Central', estado: 'cerrado' }] })
  context.mock.method(adminRecordsApi, 'close', async (id) => { closedId = id })
  context.mock.method(adminRecordsApi, 'remove', async (ids) => { deleted = ids })
  await mountAdminRecords(app, { id: 1, rol: 'admin', username: 'Admin' })
  assert.match(app.textContent, /Rosa/)
  assert.match(app.textContent, /Central/)
  app.querySelector('[data-close-record="4"]').click()
  await settle(browser)
  assert.equal(closedId, '4')
  app.querySelector('#records-state').value = 'history'
  app.querySelector('#records-state').dispatchEvent(new browser.Event('change', { bubbles: true }))
  await settle(browser)
  assert.equal(history, true)
  app.querySelector('input[name="ids"]').click()
  await settle(browser)
  app.querySelector('#delete-selected-records').click()
  await settle(browser)
  assert.deepEqual(deleted, [4])
})

test('admin records announce load errors and escape untrusted record text', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  context.mock.method(adminRecordsApi, 'listActive', async () => { throw new Error('Servicio no disponible') })
  await mountAdminRecords(app, { id: 1, rol: 'admin', username: 'Admin' })
  assert.match(app.querySelector('[role="alert"]').textContent, /Servicio no disponible/)
})
