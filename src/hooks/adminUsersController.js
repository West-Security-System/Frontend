import { adminUserApi } from '../services/adminUserApi.js'
import { renderBlockEntry, renderUsersView } from '../views/admin/UsersView.js'
import { apiMessage, invalidBlocks, readBlocks } from '../utils/adminUserData.js'

let activeListeners

function showError(app, selector, message) {
  const target = app.querySelector(selector)
  if (target) target.textContent = message
}

function openModal(app, id) {
  const modal = app.querySelector(`#${id}`)
  modal.hidden = false
  modal.querySelector('input, select, button').focus()
}

function closeModal(app, id) {
  app.querySelector(`#${id}`).hidden = true
}

function startNewUser(app) {
  const form = app.querySelector('#user-form')
  form.reset()
  form.elements.id.value = ''
  app.querySelector('#user-modal-title').textContent = 'Añadir usuario'
  openModal(app, 'user-modal')
}

function editUser(app, users, id) {
  const user = users.find((item) => Number(item.id) === Number(id))
  if (!user) return
  const form = app.querySelector('#user-form')
  form.elements.id.value = user.id
  form.elements.username.value = user.username
  form.elements.password.value = ''
  form.elements.rol.value = user.rol
  form.elements.bloqueado.checked = Boolean(user.bloqueado)
  app.querySelector('#user-modal-title').textContent = `Editar ${user.username}`
  openModal(app, 'user-modal')
}

function startBlocks(app, users, id) {
  const user = users.find((item) => Number(item.id) === Number(id))
  if (!user) return
  const form = app.querySelector('#blocks-form')
  form.reset()
  form.elements.userId.value = user.id
  app.querySelector('#blocks-user-label').textContent = `Guardia: ${user.username}. Puedes guardar una lista vacía para quitar todos los bloqueos.`
  app.querySelector('#block-entries').innerHTML = ''
  openModal(app, 'blocks-modal')
}

async function saveBlocks(event, app) {
  event.preventDefault()
  const form = event.currentTarget
  const blocks = readBlocks(app.querySelector('#block-entries'))
  if (invalidBlocks(blocks)) return showError(app, '#blocks-form-error', 'Completa todas las fechas de los bloqueos antes de guardar.')
  try {
    await adminUserApi.updateBlocks(form.elements.userId.value, blocks)
    closeModal(app, 'blocks-modal')
    showUsersAlert(app, 'Disponibilidad guardada correctamente.', 'success')
  } catch (error) {
    showError(app, '#blocks-form-error', apiMessage(error))
  }
}

function showUsersAlert(app, message, tone = 'error') {
  const alert = app.querySelector('#users-alert')
  if (!alert) return
  alert.className = `users-alert ${tone}`
  alert.textContent = message
}

async function saveUser(event, app, sessionUser) {
  event.preventDefault()
  const form = event.currentTarget
  const id = form.elements.id.value
  const payload = readUserPayload(form)
  if (isMissingRequiredUserData(id, payload)) {
    return showError(app, '#user-form-error', 'Username y contraseña son obligatorios al crear una cuenta.')
  }
  try {
    await persistUser(id, payload)
    await mountAdminUsers(app, sessionUser)
  } catch (error) {
    showError(app, '#user-form-error', apiMessage(error))
  }
}

function readUserPayload(form) {
  const payload = {
    username: form.elements.username.value.trim(),
    rol: form.elements.rol.value,
    bloqueado: form.elements.bloqueado.checked,
  }
  const password = form.elements.password.value
  return password ? { ...payload, password } : payload
}

function isMissingRequiredUserData(id, payload) {
  return !payload.username || (!id && !payload.password)
}

async function persistUser(id, payload) {
  const actions = {
    update: () => adminUserApi.update({ ...payload, id }),
    create: () => adminUserApi.create(payload),
  }
  const action = id ? actions.update : actions.create
  await action()
}

async function deleteUser(app, user, sessionUser) {
  if (!user || user.id === undefined || !window.confirm(`¿Eliminar la cuenta de ${user.username}?`)) return
  try {
    await adminUserApi.remove(user.id)
    await mountAdminUsers(app, sessionUser)
  } catch (error) {
    showUsersAlert(app, apiMessage(error))
  }
}

function changeBlockType(event, app) {
  if (!event.target.matches('.block-type')) return
  const entry = event.target.closest('.block-entry')
  entry.querySelector('.block-date-single').hidden = event.target.value === 'rango'
  entry.querySelector('.block-range').hidden = event.target.value !== 'rango'
}

function manageBlockEntry(event, app) {
  if (event.target.matches('.remove-block')) return removeBlockEntry(event.target)
  if (!event.target.closest('#add-block-button')) return
  return addBlockEntry(app)
}

function removeBlockEntry(target) {
  target.closest('.block-entry').remove()
}

function addBlockEntry(app) {
  const entries = app.querySelector('#block-entries')
  entries.insertAdjacentHTML('beforeend', renderBlockEntry(entries.children.length))
}

function userAction(target) {
  if (target.dataset.closeModal) {
    return (app) => closeModal(app, target.dataset.closeModal)
  }
  const actions = {
    'new-user-button': (app) => startNewUser(app),
    editUser: (app, user, users) => editUser(app, users, target.dataset.editUser),
    deleteUser: (app, user, users) => deleteUser(app, users.find((item) => String(item.id) === target.dataset.deleteUser), user),
    blockUser: (app, user, users) => startBlocks(app, users, target.dataset.blockUser),
  }
  const actionKey = target.id === 'new-user-button'
    ? target.id
    : Object.keys(actions).find((key) => target.dataset[key])
  return actions[actionKey]
}

async function handleUserClick(event, app, user, users) {
  const target = event.target.closest('[data-close-modal], #new-user-button, [data-edit-user], [data-delete-user], [data-block-user]')
  if (!target) return
  const action = userAction(target)
  if (!action) return
  return action(app, user, users)
}

function bindUserEvents(app, user, users) {
  activeListeners?.abort()
  activeListeners = new AbortController()
  const options = { signal: activeListeners.signal }
  app.addEventListener('click', (event) => handleUserClick(event, app, user, users), options)
  app.addEventListener('change', (event) => changeBlockType(event, app), options)
  app.addEventListener('click', (event) => manageBlockEntry(event, app), options)
  app.querySelector('#user-form').addEventListener('submit', (event) => saveUser(event, app, user), options)
  app.querySelector('#blocks-form').addEventListener('submit', (event) => saveBlocks(event, app), options)
}

async function loadUsers(app, user) {
  app.innerHTML = '<main class="page"><section class="auth-panel session-loading" role="status"><span class="loader" aria-hidden="true"></span><p>Cargando usuarios...</p></section></main>'
  try {
    const response = await adminUserApi.list()
    const users = response?.usuarios || []
    app.innerHTML = renderUsersView({ users, currentUser: user })
    bindUserEvents(app, user, users)
  } catch (error) {
    app.innerHTML = `<main class="page"><section class="auth-panel" role="alert"><span class="eyebrow">Usuarios</span><h1>No se pudo cargar el directorio.</h1><p>${apiMessage(error)}</p><button class="button primary" id="retry-users" type="button">Reintentar</button></section></main>`
    app.querySelector('#retry-users').addEventListener('click', () => mountAdminUsers(app, user))
  }
}

export function mountAdminUsers(app, user) {
  activeListeners?.abort()
  return loadUsers(app, user)
}
