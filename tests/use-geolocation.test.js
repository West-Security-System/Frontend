import { test } from 'node:test'
import assert from 'node:assert/strict'
import { useGeolocation } from '../src/hooks/useGeolocation.js'

function fakeGeolocation(result) {
  return {
    getCurrentPosition(success, failure, options) {
      this.options = options
      if (result.error) failure(result.error)
      else success(result.position)
    },
  }
}

test('geolocation hook captures latitude, longitude and precision with high accuracy', async () => {
  const geolocation = fakeGeolocation({
    position: { coords: { latitude: -32.9, longitude: -68.8, accuracy: 6.4 } },
  })
  const hook = useGeolocation(geolocation)

  const position = await hook.getCurrentPosition()

  assert.deepEqual(position, { latitud: -32.9, longitud: -68.8, precision: 6.4 })
  assert.equal(hook.state.status, 'ready')
  assert.equal(geolocation.options.enableHighAccuracy, true)
  assert.equal(geolocation.options.timeout, 10000)
})

test('geolocation hook explains denied permissions and location failures', async () => {
  const denied = useGeolocation(fakeGeolocation({ error: { code: 1 } }))
  assert.equal(await denied.getCurrentPosition(), null)
  assert.equal(denied.state.status, 'permission-denied')
  assert.match(denied.state.error, /Permite el acceso/)

  const unavailable = useGeolocation(fakeGeolocation({ error: { code: 2 } }))
  await unavailable.getCurrentPosition()
  assert.equal(unavailable.state.status, 'unavailable')
  assert.match(unavailable.state.error, /señal/)
})

test('geolocation hook exposes incompatibility and timeout states', async () => {
  const unsupported = useGeolocation(null)
  assert.equal(await unsupported.getCurrentPosition(), null)
  assert.equal(unsupported.state.status, 'unsupported')
  assert.match(unsupported.state.error, /no es compatible/)

  const timedOut = useGeolocation(fakeGeolocation({ error: { code: 3 } }))
  await timedOut.getCurrentPosition()
  assert.match(timedOut.state.error, /tardó demasiado/)
})

test('geolocation hook stays in a waiting state until the browser callback completes', async () => {
  let resolvePosition
  const geolocation = {
    getCurrentPosition(success) {
      resolvePosition = success
    },
  }
  const hook = useGeolocation(geolocation)
  const pendingRequest = hook.getCurrentPosition()

  assert.equal(hook.state.status, 'loading')
  resolvePosition({ coords: { latitude: 1, longitude: 2, accuracy: 3 } })
  await pendingRequest
  assert.equal(hook.state.status, 'ready')
})
