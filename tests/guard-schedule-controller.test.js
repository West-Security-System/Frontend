import { test } from 'node:test'
import assert from 'node:assert/strict'
import { guardScheduleApi } from '../src/services/guardScheduleApi.js'
import {
  createEntryPayload,
  createGuardScheduleState,
  refreshGuardSchedules,
} from '../src/hooks/guardScheduleController.js'

test('guard schedule controller loads assigned services and the first matching schedule', async (context) => {
  context.mock.method(guardScheduleApi, 'listAssignedServices', async () => [
    { id: 3, nombre: 'Central' },
  ])
  context.mock.method(guardScheduleApi, 'listSchedules', async (name) => {
    assert.equal(name, 'Central')
    return [{ id: 12, hora_inicio: '08:00', hora_fin: '16:00' }]
  })
  const state = createGuardScheduleState({ rol: 'guardia' }, null)

  await refreshGuardSchedules(state)

  assert.equal(state.loading, false)
  assert.equal(state.selectedServiceId, '3')
  assert.equal(state.selectedScheduleId, '12')
  assert.equal(state.schedules.length, 1)
})

test('guard schedule controller presents empty and failed service loads without stale selections', async (context) => {
  context.mock.method(guardScheduleApi, 'listAssignedServices', async () => [])
  const emptyState = createGuardScheduleState({ rol: 'guardia' }, null)
  await refreshGuardSchedules(emptyState)
  assert.deepEqual(emptyState.services, [])
  assert.equal(emptyState.selectedServiceId, '')

  context.mock.method(guardScheduleApi, 'listAssignedServices', async () => {
    throw new Error('API no disponible')
  })
  const failedState = createGuardScheduleState({ rol: 'guardia' }, null)
  failedState.selectedServiceId = 'stale'
  await refreshGuardSchedules(failedState)
  assert.equal(failedState.selectedServiceId, '')
  assert.equal(failedState.feedback, 'API no disponible')
})

test('guard schedule controller prepares the registered service, schedule and coordinates', () => {
  const state = createGuardScheduleState({ rol: 'guardia' }, null)
  state.services = [{ id: '3', nombre: 'Central' }]
  state.selectedServiceId = '3'
  state.selectedScheduleId = '12'
  state.location.state.position = { latitud: -32.9, longitud: -68.8, precision: 5 }

  assert.deepEqual(createEntryPayload(state), {
    servicio_id: 3,
    horario_id: 12,
    latitud: -32.9,
    longitud: -68.8,
  })

  state.location.state.position = null
  assert.throws(() => createEntryPayload(state), /captura tu ubicación/)
})
