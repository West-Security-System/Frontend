import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adminUserApi } from '../src/services/adminUserApi.js'
import { mountAdminUsers } from '../src/hooks/adminUsersController.js'
import { installBrowser, createApp, settle, submitForm } from './helpers/browser.js'

const admin = { id: 1, rol: 'admin', username: 'Admin' }
const users = [
  { id: 1, username: 'Admin', rol: 'admin', bloqueado: false },
  { id: 2, username: 'Ana', rol: 'guardia', bloqueado: false },
]

test('admin users controller creates, edits, deletes, and blocks accounts', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let fail = false
  const saved = []
  context.mock.method(adminUserApi, 'list', async () => ({ usuarios: users }))
  context.mock.method(adminUserApi, 'create', async (payload) => saved.push(['create', payload]))
  context.mock.method(adminUserApi, 'update', async (payload) => saved.push(['update', payload]))
  context.mock.method(adminUserApi, 'remove', async (id) => saved.push(['delete', id]))
  context.mock.method(adminUserApi, 'updateBlocks', async (id, blocks) => {
    if (fail) throw new Error('Bloqueos rechazados')
    saved.push(['blocks', id, blocks])
  })
  browser.confirm = () => true
  await mountAdminUsers(app, admin)

  app.querySelector('#new-user-button').click()
  const userForm = app.querySelector('#user-form')
  userForm.elements.username.value = 'Luis'
  userForm.elements.password.value = 'safe-pass'
  userForm.elements.rol.value = 'guardia'
  submitForm(browser, userForm)
  await settle(browser)
  assert.equal(saved[0][0], 'create')

  app.querySelector('[data-edit-user="2"]').click()
  const editForm = app.querySelector('#user-form')
  editForm.elements.username.value = 'Ana Editada'
  editForm.elements.password.value = ''
  submitForm(browser, editForm)
  await settle(browser)
  assert.equal(saved[1][0], 'update')
  assert.equal(saved[1][1].password, undefined)

  app.querySelector('[data-delete-user="2"]').click()
  await settle(browser)
  assert.deepEqual(saved[2], ['delete', 2])

  app.querySelector('[data-block-user="2"]').click()
  app.querySelector('#add-block-button').click()
  const entry = app.querySelector('.block-entry')
  entry.querySelector('[name="fecha"]').value = '2026-07-14'
  submitForm(browser, app.querySelector('#blocks-form'))
  await settle(browser)
  assert.deepEqual(saved[3], ['blocks', '2', [{ tipo: 'fecha', motivo: '', fecha: '2026-07-14' }]])

  app.querySelector('[data-block-user="2"]').click()
  app.querySelector('#add-block-button').click()
  const type = app.querySelector('.block-type')
  type.value = 'rango'
  type.dispatchEvent(new browser.Event('change', { bubbles: true }))
  assert.equal(app.querySelector('.block-date-single').hidden, true)
  assert.equal(app.querySelector('.block-range').hidden, false)
  app.querySelector('[name="fecha_inicio"]').value = '2026-07-15'
  app.querySelector('[name="fecha_fin"]').value = '2026-07-16'
  submitForm(browser, app.querySelector('#blocks-form'))
  await settle(browser)
  assert.deepEqual(saved[4][2][0], { tipo: 'rango', motivo: '', fecha_inicio: '2026-07-15', fecha_fin: '2026-07-16' })
})

test('admin users controller validates forms, blocks, and cancelled actions', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  context.mock.method(adminUserApi, 'list', async () => ({ usuarios: users }))
  context.mock.method(adminUserApi, 'create', async () => {})
  context.mock.method(adminUserApi, 'updateBlocks', async () => {})
  browser.confirm = () => false
  await mountAdminUsers(app, admin)

  app.querySelector('#new-user-button').click()
  submitForm(browser, app.querySelector('#user-form'))
  assert.match(app.querySelector('#user-form-error').textContent, /obligatorios/)
  app.querySelector('[data-delete-user="2"]').click()
  await settle(browser)
  app.querySelector('[data-block-user="2"]').click()
  app.querySelector('#add-block-button').click()
  submitForm(browser, app.querySelector('#blocks-form'))
  assert.match(app.querySelector('#blocks-form-error').textContent, /Completa todas/)
  app.querySelector('.remove-block').click()
  assert.equal(app.querySelectorAll('.block-entry').length, 0)
  app.querySelector('[data-close-modal="blocks-modal"]').click()
  assert.equal(app.querySelector('#blocks-modal').hidden, true)
})

test('admin users controller displays API errors and retry succeeds', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  let fail = true
  context.mock.method(adminUserApi, 'list', async () => {
    if (fail) throw new Error('Directorio fuera de línea')
    return { usuarios: [] }
  })
  await mountAdminUsers(app, admin)
  assert.match(app.textContent, /Directorio fuera de línea/)
  fail = false
  app.querySelector('#retry-users').click()
  await settle(browser)
  assert.match(app.textContent, /No hay usuarios registrados/)
})

test('admin users controller shows save and block API errors', async (context) => {
  const browser = installBrowser(context)
  const app = createApp(browser)
  context.mock.method(adminUserApi, 'list', async () => ({ usuarios: users }))
  context.mock.method(adminUserApi, 'create', async () => { throw new Error('Usuario duplicado') })
  context.mock.method(adminUserApi, 'updateBlocks', async () => { throw new Error('Bloqueos rechazados') })
  await mountAdminUsers(app, admin)

  app.querySelector('#new-user-button').click()
  const form = app.querySelector('#user-form')
  form.elements.username.value = 'Ana'
  form.elements.password.value = 'pass'
  submitForm(browser, form)
  await settle(browser)
  assert.match(app.querySelector('#user-form-error').textContent, /Usuario duplicado/)

  app.querySelector('[data-block-user="2"]').click()
  app.querySelector('#add-block-button').click()
  app.querySelector('[name="fecha"]').value = '2026-07-14'
  submitForm(browser, app.querySelector('#blocks-form'))
  await settle(browser)
  assert.match(app.querySelector('#blocks-form-error').textContent, /Bloqueos rechazados/)
})
