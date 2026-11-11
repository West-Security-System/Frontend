import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderGuardSchedulesView } from '../src/views/protected/GuardSchedulesView.js'

const user = { rol: 'guardia', username: 'Guardia Uno' }

test('guard schedules view explains the empty assignment state', () => {
  const html = renderGuardSchedulesView({ user, services: [], loading: false })
  assert.match(html, /Aún no tienes servicios asignados/)
  assert.match(html, /Solicita a administración/)
  assert.doesNotMatch(html, /guard-checkin-form/)
})

test('guard schedules view renders dynamic service and schedule selectors', () => {
  const html = renderGuardSchedulesView({
    user,
    services: [{ id: 1, nombre: '<Central>' }],
    selectedServiceId: 1,
    schedules: [{ id: 5, hora_inicio: '08:00', hora_fin: '16:00' }],
    selectedScheduleId: 5,
    locationState: { status: 'ready', position: { latitud: 0, longitud: 0, precision: 4 }, error: '' },
  })
  assert.match(html, /data-service-select/)
  assert.match(html, /data-schedule-select/)
  assert.match(html, /&lt;Central&gt;/)
  assert.match(html, /precisión ±4 m/)
  assert.match(html, /Registrar ingreso/)
})

test('guard schedules view disables controls while loading and explains geolocation failures', () => {
  const html = renderGuardSchedulesView({
    user,
    services: [{ id: 1, nombre: 'Central' }],
    loading: true,
    locationState: { status: 'permission-denied', position: null, error: 'Permite el acceso.' },
  })
  assert.match(html, /Cargando horarios/)
  assert.match(html, /disabled/)
  assert.match(html, /Permite el acceso/)
})
