import { test } from 'node:test'
import assert from 'node:assert/strict'
import { httpClient } from '../src/api/httpClient.js'
import { guardScheduleApi } from '../src/services/guardScheduleApi.js'

test('assigned-service API reads guard services and schedules through the HTTP client', async (context) => {
  const calls = []
  context.mock.method(httpClient, 'get', async (path) => {
    calls.push(path)
    if (path === '/mis-servicios') return { servicios: [{ id: 4, nombre: 'Central' }] }
    return { horarios: [{ id: 8, hora_inicio: '08:00', hora_fin: '16:00' }] }
  })

  assert.deepEqual(await guardScheduleApi.listAssignedServices(), [{ id: 4, nombre: 'Central' }])
  assert.deepEqual(await guardScheduleApi.listSchedules('Central & Norte'), [
    { id: 8, hora_inicio: '08:00', hora_fin: '16:00' },
  ])
  assert.deepEqual(calls, ['/mis-servicios', '/servicio/Central%20%26%20Norte/horarios'])
})

test('assigned-service API submits a check-in using POST /guardias', async (context) => {
  const entry = { servicio_id: 4, horario_id: 8, latitud: -32.9, longitud: -68.8 }
  let submitted
  context.mock.method(httpClient, 'post', async (path, body) => {
    submitted = { path, body }
    return { registro: { id: 12, estado: 'abierto' } }
  })

  assert.deepEqual(await guardScheduleApi.registerEntry(entry), { registro: { id: 12, estado: 'abierto' } })
  assert.deepEqual(submitted, { path: '/guardias', body: entry })
})

test('guard schedule API submits an exit with coordinates and observations', async (context) => {
  const exit = { latitud: -32.9, longitud: -68.8, observaciones: 'Novedad de turno' }
  let submitted
  context.mock.method(httpClient, 'post', async (path, body) => {
    submitted = { path, body }
    return { registro: { id: 12, estado: 'cerrado' } }
  })

  assert.deepEqual(await guardScheduleApi.registerExit(exit), { registro: { id: 12, estado: 'cerrado' } })
  assert.deepEqual(submitted, { path: '/guardias/egreso', body: exit })
})
