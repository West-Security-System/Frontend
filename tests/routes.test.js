import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  activeSection,
  isPrivateRoute,
  roleRoute,
  routeCorrection,
  routeName,
} from '../src/utils/routes.js'

test('route utilities normalize hash routes and select the correct section', () => {
  const guard = { rol: 'guardia' }
  const admin = { rol: 'admin' }
  assert.equal(routeName('#/guardia/horarios'), 'guardia/horarios')
  assert.equal(routeName(''), 'home')
  assert.equal(roleRoute(guard), 'guardia/horarios')
  assert.equal(roleRoute(admin), 'admin')
  assert.equal(activeSection('guardia/horarios', guard), 'horarios')
  assert.equal(activeSection('guardia/egreso', guard), 'egreso')
  assert.equal(activeSection('admin/locales', admin), 'locales')
  assert.equal(activeSection('other', guard), 'guardia')
})

test('route utilities protect private routes and redirect users to permitted areas', () => {
  assert.equal(isPrivateRoute('admin/locales'), true)
  assert.equal(isPrivateRoute('home'), false)
  assert.equal(routeCorrection('admin/locales', null), 'login')
  assert.equal(routeCorrection('login', { rol: 'guardia' }), 'guardia/horarios')
  assert.equal(routeCorrection('admin/locales', { rol: 'guardia' }), 'guardia/horarios')
  assert.equal(routeCorrection('guardia/horarios', { rol: 'admin' }), 'admin')
  assert.equal(routeCorrection('admin/locales', { rol: 'admin' }), '')
})
