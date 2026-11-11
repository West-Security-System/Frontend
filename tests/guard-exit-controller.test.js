import { test } from 'node:test'
import assert from 'node:assert/strict'
import { guardScheduleApi } from '../src/services/guardScheduleApi.js'
import {
  createExitPayload,
  mountGuardExit,
} from '../src/hooks/guardExitController.js'

class EventApp {
  listeners = {}
  innerHTML = ''

  addEventListener(type, listener) {
    this.listeners[type] = listener
  }

  dispatch(type, event) {
    return this.listeners[type](event)
  }
}

function submitEvent(observations = '') {
  return {
    preventDefault() {},
    target: {
      elements: { observaciones: { value: observations } },
      matches: (selector) => selector === '#guard-checkout-form',
    },
  }
}

function geolocation(latitude = -32.9, longitude = -68.8) {
  return {
    getCurrentPosition(success) {
      success({ coords: { latitude, longitude, accuracy: 5 } })
    },
  }
}

test('exit payload includes fresh coordinates and trimmed observations', () => {
  assert.deepEqual(createExitPayload({ latitud: -32.9, longitud: -68.8 }, ' Novedad '), {
    latitud: -32.9,
    longitud: -68.8,
    observaciones: 'Novedad',
  })
  assert.throws(() => createExitPayload(null), /obtener la ubicación/)
})

test('guard exit controller captures GPS and confirms a successful close', async (context) => {
  let submitted
  context.mock.method(guardScheduleApi, 'registerExit', async (payload) => {
    submitted = payload
    return { registro: { estado: 'cerrado' } }
  })
  const app = new EventApp()
  const state = mountGuardExit(app, { rol: 'guardia' }, geolocation())
  app.dispatch('input', {
    target: { matches: (selector) => selector === '[data-exit-observations]', value: 'Ronda finalizada' },
  })

  await app.dispatch('submit', submitEvent())

  assert.deepEqual(submitted, {
    latitud: -32.9,
    longitud: -68.8,
    observaciones: 'Ronda finalizada',
  })
  assert.equal(state.completed, true)
  assert.match(app.innerHTML, /Egreso registrado correctamente/)
  assert.match(app.innerHTML, /data-confirm-exit disabled/)
})

test('guard exit controller handles missing active turns and prevents double submission', async (context) => {
  let calls = 0
  context.mock.method(guardScheduleApi, 'registerExit', async () => {
    calls += 1
    const error = new Error('not active')
    error.code = 'ACTIVE_ENTRY_NOT_FOUND'
    throw error
  })
  const app = new EventApp()
  const state = mountGuardExit(app, { rol: 'guardia' }, geolocation())

  const firstSubmission = app.dispatch('submit', submitEvent())
  await app.dispatch('submit', submitEvent())
  await firstSubmission

  assert.equal(calls, 1)
  assert.equal(state.completed, false)
  assert.match(state.feedback, /No tienes un turno activo/)
})

test('guard exit controller does not submit if browser location permission is denied', async (context) => {
  context.mock.method(guardScheduleApi, 'registerExit', assert.fail)
  const denied = {
    getCurrentPosition(success, failure) {
      failure({ code: 1 })
    },
  }
  const app = new EventApp()
  const state = mountGuardExit(app, { rol: 'guardia' }, denied)

  await app.dispatch('submit', submitEvent())

  assert.equal(state.location.state.status, 'permission-denied')
  assert.match(app.innerHTML, /Permite el acceso/)
  assert.equal(state.submitting, false)
})

test('guard exit controller maps outside-radius and concurrent-close errors', async (context) => {
  const app = new EventApp()
  const state = mountGuardExit(app, { rol: 'guardia' }, geolocation())
  const failureCodes = [
    ['OUTSIDE_SERVICE_RADIUS', /radio permitido de 100 metros/],
    ['ACTIVE_ENTRY_CHANGED', /El turno ya fue cerrado/],
  ]

  for (const [code, message] of failureCodes) {
    context.mock.restoreAll()
    context.mock.method(guardScheduleApi, 'registerExit', async () => {
      const error = new Error('request failed')
      error.code = code
      throw error
    })
    state.feedback = ''
    await app.dispatch('submit', submitEvent())
    assert.match(state.feedback, message)
  }
})

test('guard exit controller displays a waiting state while GPS is pending', async (context) => {
  context.mock.method(guardScheduleApi, 'registerExit', async () => ({ registro: { estado: 'cerrado' } }))
  let resolvePosition
  const pendingGeolocation = {
    getCurrentPosition(success) {
      resolvePosition = success
    },
  }
  const app = new EventApp()
  const state = mountGuardExit(app, { rol: 'guardia' }, pendingGeolocation)
  const submission = app.dispatch('submit', submitEvent())

  assert.match(app.innerHTML, /Obteniendo ubicación para confirmar el egreso/)
  assert.match(app.innerHTML, /data-confirm-exit disabled/)
  resolvePosition({ coords: { latitude: 0, longitude: 0, accuracy: 3 } })
  await submission
  assert.equal(state.location.state.status, 'ready')
})
