import { test } from 'node:test'
import assert from 'node:assert/strict'
import { installBrowser, createApp, settle, submitForm } from './helpers/browser.js'

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

test('main application handles login, protected history, role correction, logout and session retry', async (context) => {
  const browser = installBrowser(context, 'http://localhost/#/home')
  const app = createApp(browser)
  let serverUser = null
  let failSession = false
  context.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    const path = new URL(url).pathname.replace('/api', '')
    if (path === '/me') {
      if (failSession) return jsonResponse({ error: { message: 'Servicio temporalmente no disponible' } }, 500)
      return serverUser
        ? jsonResponse({ data: { user: serverUser } })
        : jsonResponse({ error: { message: 'No autenticado' } }, 401)
    }
    if (path === '/login') {
      const body = JSON.parse(options.body)
      if (!body.username || body.password === 'bad') return jsonResponse({ error: { message: 'Credenciales inválidas' } }, 401)
      serverUser = { id: 2, username: body.username, rol: body.username === 'admin' ? 'admin' : 'guardia' }
      return jsonResponse({ data: { user: serverUser } })
    }
    if (path === '/logout') {
      serverUser = null
      return jsonResponse({ data: {} })
    }
    if (path === '/mis-servicios') return jsonResponse({ data: { servicios: [] } })
    if (path === '/mis-registros') return jsonResponse({ data: { registros: [] } })
    if (path === '/notificaciones') return jsonResponse({ data: { notificaciones: [] } })
    if (path === '/admin/usuarios') return jsonResponse({ data: { usuarios: [] } })
    if (path === '/admin/locales') return jsonResponse({ data: { locales: [] } })
    if (path === '/admin/horarios') return jsonResponse({ data: { horarios: [] } })
    return jsonResponse({ data: {} })
  })

  await import('../src/main.js')
  await settle(browser)
  assert.match(app.textContent, /Claridad para proteger/)

  browser.location.hash = '#/login'
  browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
  await settle(browser)
  submitForm(browser, app.querySelector('#login-form'))
  await settle(browser)
  assert.match(app.textContent, /Completa usuario y contraseña/)

  browser.location.hash = '#/login'
  browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
  await settle(browser)
  app.querySelector('#username').value = 'Ana'
  app.querySelector('#password').value = 'bad'
  submitForm(browser, app.querySelector('#login-form'))
  await settle(browser)
  assert.match(app.textContent, /Credenciales inválidas/)

  app.querySelector('#username').value = 'Ana'
  app.querySelector('#password').value = 'correct'
  submitForm(browser, app.querySelector('#login-form'))
  await settle(browser)
  assert.match(app.textContent, /Aún no tienes servicios asignados/)
  browser.location.hash = '#/guardia/historial'
  browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
  await settle(browser)
  assert.match(app.textContent, /Mi historial/)
  assert.match(app.textContent, /No tienes avisos/)

  browser.location.hash = '#/admin/usuarios'
  browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
  await settle(browser)
  assert.match(browser.location.hash, /guardia\/horarios/)
  app.querySelector('#logout-button').click()
  await settle(browser)
  assert.match(app.textContent, /Inicia sesión|Iniciar sesión/)

  failSession = true
  browser.location.hash = '#/admin/locales'
  browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
  await settle(browser)
  assert.match(app.textContent, /No se pudo comprobar la sesión/)
  failSession = false
  app.querySelector('#retry-session').click()
  await settle(browser)
  assert.match(app.textContent, /Iniciar sesión/)

  browser.location.hash = '#/login'
  browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
  await settle(browser)
  app.querySelector('#username').value = 'admin'
  app.querySelector('#password').value = 'correct'
  submitForm(browser, app.querySelector('#login-form'))
  await settle(browser)
  assert.match(app.textContent, /Dashboard/)
  browser.location.hash = '#/admin/usuarios'
  browser.dispatchEvent(new browser.HashChangeEvent('hashchange'))
  await settle(browser)
  assert.match(app.textContent, /Usuarios/)
})
