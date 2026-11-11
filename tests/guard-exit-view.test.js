import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderGuardExitView } from '../src/views/protected/GuardExitView.js'

const user = { rol: 'guardia', username: 'Guardia Uno' }

test('guard exit view renders observations and explains active-turn geolocation checks', () => {
  const html = renderGuardExitView({
    user,
    observations: '<Novedad & detalle>',
    locationState: { status: 'idle', position: null, error: '' },
  })

  assert.match(html, /Registrar egreso/)
  assert.match(html, /name="observaciones"/)
  assert.match(html, /&lt;Novedad &amp; detalle&gt;/)
  assert.match(html, /turno activo/)
  assert.match(html, /Confirmar egreso/)
  assert.match(html, /data-exit-observations/)
})

test('guard exit view shows GPS wait, radius errors and disables repeated submission', () => {
  const loadingHtml = renderGuardExitView({
    user,
    submitting: true,
    locationState: { status: 'loading', position: null, error: '' },
  })
  assert.match(loadingHtml, /Obteniendo ubicación para confirmar/)
  assert.match(loadingHtml, /disabled/)

  const errorHtml = renderGuardExitView({
    user,
    feedback: 'Estás fuera del radio permitido.',
    locationState: { status: 'permission-denied', position: null, error: 'Permite ubicación.' },
  })
  assert.match(errorHtml, /Estás fuera del radio permitido/)
  assert.match(errorHtml, /Permite ubicación/)
  assert.match(errorHtml, /role="alert"/)
})

test('guard exit view confirms success and prevents another exit submission', () => {
  const html = renderGuardExitView({
    user,
    feedback: 'Egreso registrado correctamente.',
    completed: true,
  })

  assert.match(html, /role="status"/)
  assert.match(html, /Egreso registrado correctamente/)
  assert.match(html, /data-confirm-exit disabled/)
})
