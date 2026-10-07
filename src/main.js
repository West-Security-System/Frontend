import './style.css'
import { ApiError } from './api/httpClient.js'
import { getCurrentUser, isUnauthorized, loadSession, login, logout } from './auth/session.js'
import { httpClient } from './api/httpClient.js'
import { renderBlockEntry, renderUsersView } from './views/admin/UsersView.js'
import { renderLoginView } from './views/public/LoginView.js'
import { renderPublicView } from './views/public/PublicView.js'
import { renderProtectedView } from './views/protected/ProtectedView.js'

const app = document.querySelector('#app')
let isBootstrapping = false
let loginError = ''

function routeName() {
  return window.location.hash.replace(/^#\/?/, '') || 'home'
}

function roleRoute(user) {
  return user?.rol === 'admin' ? 'admin' : 'guardia'
}

function activeSection(route, user) {
  if (user.rol === 'admin' && route.startsWith('admin/usuarios')) return 'usuarios'
  if (user.rol === 'admin' && route.startsWith('admin/locales')) return 'locales'
  if (user.rol === 'guardia' && route.startsWith('guardia/horarios')) return 'horarios'
  return user.rol
}

function replaceRoute(route) {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/${route}`)
  renderRoute()
}

function navigateToLogin() {
  loginError = ''
  replaceRoute('login')
}

function renderSessionError(error) {
  app.innerHTML = `<main class="page"><section class="auth-panel" role="alert"><span class="eyebrow">Sesión</span><h1>No se pudo comprobar la sesión.</h1><p>${error.message}</p><button class="button primary" id="retry-session" type="button">Reintentar</button></section></main>`
  document.querySelector('#retry-session').addEventListener('click', renderRoute)
}

function bindLoginForm() {
  const form = document.querySelector('#login-form')
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const username = form.elements.username.value.trim()
    const password = form.elements.password.value
    const formError = document.querySelector('#login-form-error')
    if (!username || !password) {
      formError.textContent = 'Completa usuario y contraseña antes de continuar.'
      return
    }
    formError.textContent = ''
    app.innerHTML = renderLoginView({ isSubmitting: true })
    try {
      const user = await login(username, password)
      if (!user) throw new ApiError('La respuesta de autenticación no contiene un usuario.')
      replaceRoute(roleRoute(user))
    } catch (error) {
      loginError = error.message
      app.innerHTML = renderLoginView({ errorMessage: loginError })
      bindLoginForm()
    }
  })
}

function apiErrorMessage(error) {
  if (error.status === 409) return `Conflicto: ${error.message || 'El username ya está registrado.'}`
  if (error.status === 422) return `Validación: ${error.message || 'Revisa los datos introducidos.'}`
  return error.message || 'No se pudo completar la operación.'
}

function showUsersAlert(message, tone = 'error') {
  const alert = document.querySelector('#users-alert')
  if (alert) {
    alert.className = `users-alert ${tone}`
    alert.textContent = message
  }
}

function openModal(id) {
  const modal = document.querySelector(`#${id}`)
  modal.hidden = false
  modal.querySelector('input, select, button').focus()
}

function closeModal(id) {
  document.querySelector(`#${id}`).hidden = true
}

function bindBlocksModal(users) {
  const modal = document.querySelector('#blocks-modal')
  const form = document.querySelector('#blocks-form')
  const entries = document.querySelector('#block-entries')
  const addEntry = (entry) => {
    const index = entries.children.length
    entries.insertAdjacentHTML('beforeend', renderBlockEntry(index, entry))
  }
  document.querySelector('#add-block-button').addEventListener('click', () => addEntry())
  modal.addEventListener('change', (event) => {
    if (!event.target.matches('.block-type')) return
    const fieldset = event.target.closest('.block-entry')
    fieldset.querySelector('.block-date-single').hidden = event.target.value === 'rango'
    fieldset.querySelector('.block-range').hidden = event.target.value !== 'rango'
  })
  modal.addEventListener('click', (event) => {
    if (event.target.matches('.remove-block')) event.target.closest('.block-entry').remove()
  })
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const userId = form.elements.userId.value
    const bloqueos = [...entries.querySelectorAll('.block-entry')].map((entry) => {
      const type = entry.querySelector('[name="tipo"]').value
      const block = { tipo: type, motivo: entry.querySelector('[name="motivo"]').value.trim() }
      if (type === 'fecha') block.fecha = entry.querySelector('[name="fecha"]').value
      else {
        block.fecha_inicio = entry.querySelector('[name="fecha_inicio"]').value
        block.fecha_fin = entry.querySelector('[name="fecha_fin"]').value
      }
      return block
    })
    const error = document.querySelector('#blocks-form-error')
    if (bloqueos.some((block) => block.tipo === 'fecha' ? !block.fecha : (!block.fecha_inicio || !block.fecha_fin))) {
      error.textContent = 'Completa todas las fechas de los bloqueos antes de guardar.'
      return
    }
    try {
      await httpClient.put(`/admin/usuarios/${userId}/bloqueos`, { bloqueos })
      closeModal('blocks-modal')
      showUsersAlert('Disponibilidad guardada correctamente.', 'success')
    } catch (requestError) {
      error.textContent = apiErrorMessage(requestError)
    }
  })
}

function bindUsersView(currentUser, users) {
  const modal = document.querySelector('#user-modal')
  const form = document.querySelector('#user-form')
  document.querySelector('#new-user-button').addEventListener('click', () => {
    form.reset()
    form.elements.id.value = ''
    document.querySelector('#user-modal-title').textContent = 'Añadir usuario'
    openModal('user-modal')
  })
  document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.closeModal)))
  document.querySelectorAll('[data-edit-user]').forEach((button) => button.addEventListener('click', () => {
    const user = users.find((item) => Number(item.id) === Number(button.dataset.editUser))
    form.elements.id.value = user.id
    form.elements.username.value = user.username
    form.elements.password.value = ''
    form.elements.rol.value = user.rol
    form.elements.bloqueado.checked = Boolean(user.bloqueado)
    document.querySelector('#user-modal-title').textContent = `Editar ${user.username}`
    openModal('user-modal')
  }))
  document.querySelectorAll('[data-delete-user]').forEach((button) => button.addEventListener('click', async () => {
    if (button.disabled) return
    const user = users.find((item) => Number(item.id) === Number(button.dataset.deleteUser))
    if (!window.confirm(`¿Eliminar la cuenta de ${user.username}?`)) return
    try {
      await httpClient.delete(`/admin/usuarios?id=${user.id}`)
      await renderRoute()
    } catch (error) {
      showUsersAlert(apiErrorMessage(error))
    }
  }))
  document.querySelectorAll('[data-block-user]').forEach((button) => button.addEventListener('click', () => {
    const user = users.find((item) => Number(item.id) === Number(button.dataset.blockUser))
    const blocksForm = document.querySelector('#blocks-form')
    blocksForm.reset()
    blocksForm.elements.userId.value = user.id
    document.querySelector('#blocks-user-label').textContent = `Guardia: ${user.username}. Puedes guardar una lista vacía para quitar todos los bloqueos.`
    document.querySelector('#block-entries').innerHTML = ''
    openModal('blocks-modal')
  }))
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const id = form.elements.id.value
    const payload = { username: form.elements.username.value.trim(), rol: form.elements.rol.value, bloqueado: form.elements.bloqueado.checked }
    if (!id) payload.password = form.elements.password.value
    else if (form.elements.password.value) payload.password = form.elements.password.value
    const error = document.querySelector('#user-form-error')
    if (!payload.username || (!id && !payload.password)) {
      error.textContent = 'Username y contraseña son obligatorios al crear una cuenta.'
      return
    }
    try {
      if (id) await httpClient.put('/admin/usuarios', { ...payload, id })
      else await httpClient.post('/admin/usuarios', payload)
      closeModal('user-modal')
      await renderRoute()
    } catch (requestError) {
      error.textContent = apiErrorMessage(requestError)
    }
  })
  bindBlocksModal(users)
}

async function renderUsersRoute(user) {
  app.innerHTML = '<main class="page"><section class="auth-panel session-loading" role="status"><span class="loader" aria-hidden="true"></span><p>Cargando usuarios...</p></section></main>'
  try {
    const response = await httpClient.get('/admin/usuarios')
    const users = response?.usuarios || []
    app.innerHTML = renderUsersView({ users, currentUser: user })
    bindUsersView(user, users)
  } catch (error) {
    app.innerHTML = `<main class="page"><section class="auth-panel" role="alert"><span class="eyebrow">Usuarios</span><h1>No se pudo cargar el directorio.</h1><p>${apiErrorMessage(error)}</p><button class="button primary" id="retry-users" type="button">Reintentar</button></section></main>`
    document.querySelector('#retry-users').addEventListener('click', () => renderUsersRoute(user))
  }
}

async function renderRoute() {
  if (isBootstrapping) return
  isBootstrapping = true
  app.innerHTML = '<main class="page"><section class="auth-panel session-loading" role="status" aria-live="polite"><span class="loader" aria-hidden="true"></span><p>Comprobando sesión...</p></section></main>'
  const route = routeName()
  let user = getCurrentUser()
  try {
    user = await loadSession()
  } catch (error) {
    if (!isUnauthorized(error) && route !== 'login' && route !== 'home') {
      isBootstrapping = false
      renderSessionError(error)
      return
    }
    user = null
  }
  isBootstrapping = false

  if (!user && (route === 'admin' || route === 'guardia' || route === 'app')) {
    navigateToLogin()
    return
  }
  if (user && (route === 'login' || route === 'home' || route === 'app')) {
    replaceRoute(roleRoute(user))
    return
  }
  if (route.startsWith('admin') && user?.rol !== 'admin') {
    replaceRoute(roleRoute(user))
    return
  }
  if (route.startsWith('guardia') && user?.rol !== 'guardia') {
    replaceRoute(roleRoute(user))
    return
  }
  if (route === 'login') {
    app.innerHTML = renderLoginView({ errorMessage: loginError })
    bindLoginForm()
    return
  }
  if (user) {
    if (route === 'admin/usuarios') {
      await renderUsersRoute(user)
      return
    }
    app.innerHTML = renderProtectedView(user, activeSection(route, user))
    document.querySelector('#logout-button').addEventListener('click', async () => {
      await logout()
      navigateToLogin()
    })
    return
  }
  app.innerHTML = renderPublicView()
}

window.addEventListener('hashchange', renderRoute)
renderRoute()
