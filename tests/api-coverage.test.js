import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, httpClient, request } from '../src/api/httpClient.js'
import { login, loadSession, logout, getCurrentUser, isUnauthorized } from '../src/auth/session.js'
import { adminAssignmentApi } from '../src/services/adminAssignmentApi.js'
import { adminServiceApi } from '../src/services/adminServiceApi.js'
import { adminUserApi } from '../src/services/adminUserApi.js'
import { guardScheduleApi } from '../src/services/guardScheduleApi.js'

function response(body, { status = 200, contentType = 'application/json' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => contentType },
    json: async () => body,
    text: async () => body,
  }
}

test('HTTP client sends JSON requests with credentials and unwraps data', async (context) => {
  const calls = []
  context.mock.method(globalThis, 'fetch', async (...args) => {
    calls.push(args)
    return response({ data: { ok: true } })
  })
  assert.deepEqual(await httpClient.get('/records'), { ok: true })
  await httpClient.post('/records', { id: 1 }, { headers: { Authorization: 'Session placeholder' } })
  await httpClient.put('/records/1', { active: true })
  await httpClient.delete('/records/1')
  assert.equal(calls[0][1].credentials, 'include')
  assert.equal(calls[0][1].headers['Content-Type'], 'application/json')
  assert.equal(calls[1][1].headers.Authorization, 'Session placeholder')
  assert.equal(calls[1][1].body, '{"id":1}')
  assert.equal(calls[2][1].method, 'PUT')
  assert.equal(calls[3][1].method, 'DELETE')
})

test('HTTP client maps JSON and plain-text failures to ApiError', async (context) => {
  for (const status of [400, 401, 403, 404, 500]) {
    context.mock.method(globalThis, 'fetch', async () => response({
      error: { code: `E${status}`, message: `Failure ${status}` },
    }, { status }))
    await assert.rejects(request('/failure'), (error) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, status)
      assert.equal(error.code, `E${status}`)
      return true
    })
    context.mock.restoreAll()
  }
  context.mock.method(globalThis, 'fetch', async () => response('plain failure', { status: 500, contentType: 'text/plain' }))
  await assert.rejects(request('/plain'), /plain failure/)
})

test('HTTP client exposes timeout and network errors without swallowing API errors', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => {
    const error = new Error('aborted')
    error.name = 'AbortError'
    throw error
  })
  await assert.rejects(request('/timeout'), (error) => error.code === 'TIMEOUT')
  context.mock.restoreAll()
  context.mock.method(globalThis, 'fetch', async () => { throw new Error('offline') })
  await assert.rejects(request('/offline'), (error) => error.code === 'NETWORK_ERROR')
})

test('session helpers retain authenticated users and clear on logout', async (context) => {
  let current = { data: { user: { id: 2, rol: 'guardia' } } }
  let status = 200
  const calls = []
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options })
    return response(current, { status })
  })
  assert.deepEqual(await loadSession(), { id: 2, rol: 'guardia' })
  assert.deepEqual(await login('guardia', 'pass'), { id: 2, rol: 'guardia' })
  assert.equal(getCurrentUser().id, 2)
  await logout()
  assert.equal(getCurrentUser(), null)
  assert.ok(calls.some(({ url }) => url.endsWith('/logout')))
  current = { data: {} }
  assert.equal(await loadSession(), null)
  current = { error: { message: 'denied' } }
  status = 401
  await assert.rejects(loadSession())
  assert.equal(getCurrentUser(), null)
  assert.equal(isUnauthorized(new ApiError('expired', { status: 401 })), true)
  assert.equal(isUnauthorized(new Error('expired')), false)
})

test('administrative APIs map all endpoint methods and encode identifiers', async (context) => {
  const calls = []
  context.mock.method(httpClient, 'get', async (path) => { calls.push(['GET', path]); return { usuarios: [{ id: 3, rol: 'guardia' }] } })
  context.mock.method(httpClient, 'post', async (path, body) => calls.push(['POST', path, body]))
  context.mock.method(httpClient, 'put', async (path, body) => calls.push(['PUT', path, body]))
  context.mock.method(httpClient, 'delete', async (path, options) => calls.push(['DELETE', path, options]))
  assert.deepEqual(await adminAssignmentApi.listGuards(), [{ id: 3, rol: 'guardia' }])
  await adminAssignmentApi.listForSchedule('3/4')
  await adminAssignmentApi.assign(3, '4')
  await adminAssignmentApi.unassign(3, '4')
  await adminServiceApi.listServices()
  await adminServiceApi.createService({ nombre: 'Central' })
  await adminServiceApi.updateService({ id: 1 })
  await adminServiceApi.deleteService(1)
  await adminServiceApi.listSchedules(3)
  await adminServiceApi.createSchedule({ servicio_id: 3 })
  await adminServiceApi.updateSchedule({ id: 2 })
  await adminServiceApi.deleteSchedule(2)
  await adminUserApi.list()
  await adminUserApi.create({ username: 'guardia' })
  await adminUserApi.update({ id: 3 })
  await adminUserApi.remove('3/4')
  await adminUserApi.updateBlocks(3, [])
  assert.ok(calls.some(([method, path]) => method === 'GET' && path.includes('3%2F4')))
  assert.ok(calls.some(([method, path]) => method === 'PUT' && path.endsWith('/bloqueos')))
})

test('guard APIs send assigned service, schedule, entry and checkout requests', async (context) => {
  const calls = []
  context.mock.method(httpClient, 'get', async (path) => {
    calls.push(['GET', path])
    return path === '/mis-servicios' ? { servicios: [{ id: 1 }] } : { horarios: [{ id: 2 }] }
  })
  context.mock.method(httpClient, 'post', async (path, body) => calls.push(['POST', path, body]))
  assert.deepEqual(await guardScheduleApi.listAssignedServices(), [{ id: 1 }])
  assert.deepEqual(await guardScheduleApi.listSchedules('Sede Norte'), [{ id: 2 }])
  await guardScheduleApi.registerEntry({ servicio_id: 1 })
  await guardScheduleApi.registerExit({ latitud: 0 })
  assert.deepEqual(calls.map(([method, path]) => `${method} ${path}`), [
    'GET /mis-servicios',
    'GET /servicio/Sede%20Norte/horarios',
    'POST /guardias',
    'POST /guardias/egreso',
  ])
})

test('dashboard API loads related assignments and returns empty fallbacks', async (context) => {
  context.mock.method(httpClient, 'get', async (path) => {
    if (path === '/admin/usuarios') return { usuarios: [{ id: 1 }] }
    if (path === '/admin/locales') return { locales: [{ id: 2 }] }
    if (path === '/admin/horarios') return { horarios: [{ id: 3 }, { id: 4 }] }
    if (path.endsWith('/guardias')) return { asignaciones: [{ usuario_id: 1 }] }
    return {}
  })
  const { loadOperationalDashboard } = await import('../src/services/adminDashboardApi.js')
  const dashboard = await loadOperationalDashboard()
  assert.equal(dashboard.assignments.length, 2)
  assert.deepEqual(dashboard.assignments[0].items, [{ usuario_id: 1 }])
})
