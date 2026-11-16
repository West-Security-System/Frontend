import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, httpClient } from '../src/api/httpClient.js'
import { adminOperationalRecordsApi } from '../src/services/adminOperationalRecordsApi.js'
import { adminServiceApi } from '../src/services/adminServiceApi.js'
import { adminUserApi } from '../src/services/adminUserApi.js'
import { mountAdminOperationalRecords } from '../src/hooks/adminOperationalRecordsController.js'
import { createAdminRecordsState, beginRecordAction, refreshAdminRecords } from '../src/hooks/useAdminRecords.js'
import { renderOperationalRecordsView } from '../src/views/admin/OperationalRecordsView.js'
import { renderOperationalRecordsTable } from '../src/components/admin/OperationalRecordsTable.js'
import { renderRecordDetail, renderRecordConfirmation } from '../src/components/admin/RecordDialogs.js'
import { activeSection } from '../src/utils/routes.js'
import { installBrowser, createApp, settle, submitForm } from './helpers/browser.js'

const admin = { id: 1, rol: 'admin', username: 'admin' }
const record = { id: 5, usuario_id: 8, username: 'guardia', local_id: 2, local_nombre: 'Central', estado: 'abierto', hora_ingreso: '2026-11-15T08:00:00Z' }

const recordApiError = (status) => new ApiError(`HTTP ${status}`, { status, code: `HTTP_${status}` })

function emptyRecordResponse() {
  return { registros: [] }
}

test('admin records API builds filters and maps detail, close and delete endpoints', async (context) => {
  const calls = []
  context.mock.method(httpClient, 'get', async (path) => {
    calls.push(['GET', path])
    return path.includes('/5%2F6') ? { registro: record } : emptyRecordResponse()
  })
  context.mock.method(httpClient, 'post', async (path, body) => calls.push(['POST', path, body]))
  context.mock.method(httpClient, 'delete', async (path, options) => calls.push(['DELETE', path, options]))

  await adminOperationalRecordsApi.listActive({ usuario_id: '8', local_id: '', desde: '2026-01-01' })
  await adminOperationalRecordsApi.listHistory({ estado: 'cerrado', hasta: '2026-02-01' })
  assert.equal((await adminOperationalRecordsApi.getDetail('5/6')).registro, record)
  await adminOperationalRecordsApi.close([5, 6], '2026-11-15T12:00:00.000Z')
  await adminOperationalRecordsApi.remove([5, 6])
  assert.deepEqual(calls, [
    ['GET', '/admin/activos?usuario_id=8&desde=2026-01-01'],
    ['GET', '/admin/registros?estado=cerrado&hasta=2026-02-01'],
    ['GET', '/admin/registros/5%2F6'],
    ['POST', '/admin/registros/cerrar', { ids: [5, 6], hora_egreso: '2026-11-15T12:00:00.000Z' }],
    ['DELETE', '/admin/registros', { body: JSON.stringify({ ids: [5, 6] }) }],
  ])
});

test('admin records API exposes a dedicated 404 and preserves other API errors', async (context) => {
  context.mock.method(httpClient, 'get', async () => { throw recordApiError(404) })
  await assert.rejects(adminOperationalRecordsApi.getDetail(99), (error) => {
    assert.equal(error.status, 404)
    assert.equal(error.code, 'RECORD_NOT_FOUND')
    return true
  })
  context.mock.restoreAll()
  context.mock.method(httpClient, 'get', async () => { throw recordApiError(403) })
  await assert.rejects(adminOperationalRecordsApi.getDetail(99), (error) => error.status === 403)
});

test('records table sorts newest-first, escapes values, tracks selection, and renders empty state', () => {
  const older = { ...record, id: 4, username: '<guard>', hora_ingreso: '2026-11-14T08:00:00Z' }
  const html = renderOperationalRecordsTable([older, record], new Set(['5', '4']), 'active')
  assert.ok(html.indexOf('Central') < html.indexOf('&lt;guard&gt;'))
  assert.match(html, /aria-label="Seleccionar todos los registros" checked/)
  assert.match(html, /&lt;guard&gt;/)
  assert.match(renderOperationalRecordsTable([], new Set(), 'history'), /No hay registros/)
});

test('record view renders accessible filters, tabs, actions, empty and dialog states', () => {
  const state = createAdminRecordsState(admin)
  state.lists.active = { status: 'empty', records: [], error: '' }
  const html = renderOperationalRecordsView(state)
  assert.match(html, /aria-label="Filtros de registros"/)
  assert.match(html, /role="tab"/)
  assert.match(html, /aria-selected="true"/)
  assert.match(html, /href="#\/admin\/registros"[^>]*aria-current="page"/)
  assert.match(html, /No hay registros para mostrar/)
  assert.match(html, /Completar seleccionados/)
  assert.match(html, /disabled/)
  assert.match(renderRecordDetail({ status: 'idle' }), /^$/)
  assert.match(renderRecordDetail({ status: 'loading' }), /Cargando detalle/)
  assert.match(renderRecordDetail({ status: 'error', notFound: true, error: 'Missing' }), /no encontrado \(404\)/i)
  assert.match(renderRecordDetail({ status: 'success', record: { ...record, username: '<guard>' } }), /&lt;guard&gt;/)
  assert.match(renderRecordConfirmation('close', 2, 'invalid time'), /invalid time/)
  assert.match(renderRecordConfirmation('delete', 1), /no se puede deshacer/i)
});

test('admin records controller keeps filters separated, tabs distinct, and hides stale rows while loading', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  const activeCalls = []
  const historyCalls = []
  let releaseFirst
  context.mock.method(adminUserApi, 'list', async () => ({ usuarios: [{ id: 8, username: 'Guardia' }] }))
  context.mock.method(adminServiceApi, 'listServices', async () => ({ locales: [{ id: 2, nombre: 'Central' }] }))
  context.mock.method(adminOperationalRecordsApi, 'listActive', async (filters) => {
    activeCalls.push(filters)
    if (activeCalls.length === 1) return new Promise((resolve) => { releaseFirst = resolve })
    return { registros: [record] }
  })
  context.mock.method(adminOperationalRecordsApi, 'listHistory', async (filters) => {
    historyCalls.push(filters)
    return { registros: [{ ...record, id: 6, estado: 'cerrado', hora_egreso: '2026-11-15T16:00:00Z' }] }
  })

  const mounting = mountAdminOperationalRecords(app, admin)
  await settle(browser)
  assert.match(app.textContent, /Cargando registros/)
  app.querySelector('[data-record-tab="history"]').click()
  await settle(browser)
  assert.match(app.textContent, /Historial de registros/)
  assert.equal(app.querySelector('[data-record-detail="5"]'), null)
  assert.ok(app.querySelector('[data-record-detail="6"]'))
  assert.deepEqual(historyCalls[0], { usuario_id: '', local_id: '', estado: '', desde: '', hasta: '' })

  const form = app.querySelector('#records-filters')
  form.elements.usuario_id.value = '8'
  form.elements.local_id.value = '2'
  form.elements.estado.value = 'cerrado'
  form.elements.desde.value = '2026-11-01'
  submitForm(browser, form)
  await settle(browser)
  assert.deepEqual(historyCalls[1], { usuario_id: '8', local_id: '2', estado: 'cerrado', desde: '2026-11-01', hasta: '' })
  releaseFirst({ registros: [record] })
  await mounting
  await settle(browser)
  assert.doesNotMatch(app.textContent, /Registros activos/)
  assert.equal(activeCalls.length, 1)
});

test('active and history filters remain independent across tab switches', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  const activeFilters = []
  const historyFilters = []
  context.mock.method(adminUserApi, 'list', async () => ({ usuarios: [] }))
  context.mock.method(adminServiceApi, 'listServices', async () => ({ locales: [] }))
  context.mock.method(adminOperationalRecordsApi, 'listActive', async (filters) => {
    activeFilters.push(filters)
    return { registros: [record] }
  })
  context.mock.method(adminOperationalRecordsApi, 'listHistory', async (filters) => {
    historyFilters.push(filters)
    return { registros: [{ ...record, estado: 'cerrado' }] }
  })
  await mountAdminOperationalRecords(app, admin)
  app.querySelector('[data-record-tab="history"]').click()
  await settle(browser)
  const historyForm = app.querySelector('#records-filters')
  historyForm.elements.estado.value = 'cerrado'
  historyForm.elements.usuario_id.value = '8'
  submitForm(browser, historyForm)
  await settle(browser)

  app.querySelector('[data-record-tab="active"]').click()
  await settle(browser)
  const activeForm = app.querySelector('#records-filters')
  activeForm.elements.usuario_id.value = '9'
  submitForm(browser, activeForm)
  await settle(browser)

  app.querySelector('[data-record-tab="history"]').click()
  await settle(browser)
  assert.equal(app.querySelector('#records-state-filter').value, 'cerrado')
  assert.equal(app.querySelector('#records-guard-filter').value, '8')
  assert.equal(activeFilters.at(-1).usuario_id, '9')
  assert.equal(historyFilters.at(-1).usuario_id, '8')
});

test('records controller prevents empty mutations, confirms selection, refreshes successful close and reports partial result', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let activeCalls = 0
  let closePayload
  context.mock.method(adminUserApi, 'list', async () => ({ usuarios: [] }))
  context.mock.method(adminServiceApi, 'listServices', async () => ({ locales: [] }))
  context.mock.method(adminOperationalRecordsApi, 'listActive', async () => {
    activeCalls += 1
    return activeCalls === 1 ? { registros: [record] } : emptyRecordResponse()
  })
  context.mock.method(adminOperationalRecordsApi, 'listHistory', async () => emptyRecordResponse())
  context.mock.method(adminOperationalRecordsApi, 'close', async (...args) => {
    closePayload = args
    return { cantidad_cerrada: 1, ids_no_encontrados: [], ids_no_abiertos: [] }
  })
  const state = await mountAdminOperationalRecords(app, admin)
  assert.equal(beginRecordAction(app, state, 'delete'), false)
  const checkbox = app.querySelector('[data-record-select="5"]')
  checkbox.checked = true
  checkbox.dispatchEvent(new browser.Event('change', { bubbles: true }))
  assert.equal(app.querySelector('[data-record-action="close"]').disabled, false)
  app.querySelector('[data-record-action="close"]').click()
  assert.ok(app.querySelector('[role="dialog"]'))
  assert.equal(app.querySelector('#record-exit-time').required, true)
  app.querySelector('#record-exit-time').value = '2026-11-15T18:00'
  app.querySelector('[data-confirm-record-action]').click()
  await settle(browser)
  assert.deepEqual(closePayload[0], [5])
  assert.equal(closePayload[1], new Date('2026-11-15T18:00').toISOString())
  assert.equal(activeCalls, 2)
  assert.match(app.textContent, /1 registro\(s\) completado\(s\)/)
  assert.match(app.textContent, /No hay registros para mostrar/)
});

test('records controller blocks empty delete, validates close time and refreshes after rejected actions', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let calls = 0
  let refreshes = 0
  context.mock.method(adminUserApi, 'list', async () => ({ usuarios: [] }))
  context.mock.method(adminServiceApi, 'listServices', async () => ({ locales: [] }))
  context.mock.method(adminOperationalRecordsApi, 'listActive', async () => {
    refreshes += 1
    return { registros: calls ? [] : [record] }
  })
  context.mock.method(adminOperationalRecordsApi, 'listHistory', async () => emptyRecordResponse())
  context.mock.method(adminOperationalRecordsApi, 'remove', async () => {
    calls += 1
    throw new Error('Rejected by API')
  })
  await mountAdminOperationalRecords(app, admin)
  const checkbox = app.querySelector('[data-record-select="5"]')
  checkbox.checked = true
  checkbox.dispatchEvent(new browser.Event('change', { bubbles: true }))
  app.querySelector('[data-record-action="close"]').click()
  app.querySelector('#record-exit-time').value = 'invalid'
  app.querySelector('[data-confirm-record-action]').click()
  await settle(browser)
  assert.match(app.textContent, /hora de egreso válida/)
  assert.equal(calls, 0)

  app.querySelector('[data-cancel-record-action]').click()
  app.querySelector('[data-record-select="5"]').checked = true
  app.querySelector('[data-record-select="5"]').dispatchEvent(new browser.Event('change', { bubbles: true }))
  app.querySelector('[data-record-action="delete"]').click()
  app.querySelector('[data-confirm-record-action]').click()
  await settle(browser)
  assert.equal(calls, 1)
  assert.equal(refreshes, 2)
  assert.match(app.textContent, /Rejected by API/)
});

test('records controller confirms bulk delete, reports partial outcomes, and refreshes server data', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let listCalls = 0
  let deletedIds
  context.mock.method(adminUserApi, 'list', async () => ({ usuarios: [] }))
  context.mock.method(adminServiceApi, 'listServices', async () => ({ locales: [] }))
  context.mock.method(adminOperationalRecordsApi, 'listActive', async () => {
    listCalls += 1
    return listCalls === 1 ? { registros: [record, { ...record, id: 6 }] } : emptyRecordResponse()
  })
  context.mock.method(adminOperationalRecordsApi, 'listHistory', async () => emptyRecordResponse())
  context.mock.method(adminOperationalRecordsApi, 'remove', async (ids) => {
    deletedIds = ids
    return { cantidad_eliminada: 1, ids_no_encontrados: [6] }
  })
  await mountAdminOperationalRecords(app, admin)
  app.querySelector('#select-all-records').click()
  app.querySelector('[data-record-action="delete"]').click()
  app.querySelector('[data-confirm-record-action]').click()
  await settle(browser)
  assert.deepEqual(deletedIds, [6, 5])
  assert.equal(listCalls, 2)
  assert.match(app.textContent, /1 registro\(s\) eliminado\(s\)/)
  assert.match(app.textContent, /1 inexistente\(s\)/)
  assert.match(app.textContent, /No hay registros para mostrar/)
});

test('detail controller shows 404 explicitly and refresh button reloads current list', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let loads = 0
  context.mock.method(adminUserApi, 'list', async () => ({ usuarios: [] }))
  context.mock.method(adminServiceApi, 'listServices', async () => ({ locales: [] }))
  context.mock.method(adminOperationalRecordsApi, 'listActive', async () => {
    loads += 1
    return { registros: [record] }
  })
  context.mock.method(adminOperationalRecordsApi, 'listHistory', async () => emptyRecordResponse())
  context.mock.method(adminOperationalRecordsApi, 'getDetail', async () => { throw recordApiError(404) })
  await mountAdminOperationalRecords(app, admin)
  app.querySelector('[data-record-detail="5"]').click()
  await settle(browser)
  assert.match(app.textContent, /Registro no encontrado \(404\)/)
  app.querySelector('[data-close-record-detail]').click()
  app.querySelector('[data-refresh-records]').click()
  await settle(browser)
  assert.equal(loads, 2)
});

test('admin records state ignores stale responses and exposes the active navigation section', async (context) => {
  const state = createAdminRecordsState(admin)
  state.tab = 'history'
  state.render = () => '<p>loading</p>'
  const browser = installBrowser(context)
  const app = createApp(browser)
  app.innerHTML = '<p>before</p>'
  let resolveFirst
  let calls = 0
  const first = new Promise((resolve) => { resolveFirst = resolve })
  context.mock.method(adminOperationalRecordsApi, 'listHistory', async () => (
    ++calls === 1 ? first : { registros: [{ ...record, id: 7 }] }
  ))
  const stale = refreshAdminRecords(app, state)
  await refreshAdminRecords(app, state)
  resolveFirst({ registros: [{ ...record, id: 99 }] })
  await stale
  assert.equal(state.lists.history.records[0].id, 7)
  assert.equal(activeSection('admin/registros', admin), 'registros')
});
