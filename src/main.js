import './style.css'
import { ApiError } from './api/httpClient.js'
import { isUnauthorized, loadSession, login, logout } from './auth/session.js'
import { mountAdminDashboard } from './hooks/adminDashboardController.js'
import { mountAdminServices } from './hooks/adminServicesController.js'
import { mountAdminUsers } from './hooks/adminUsersController.js'
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
  app.querySelector('#retry-session').addEventListener('click', renderRoute)
}

async function submitLogin(event) {
  event.preventDefault()
  const form = event.currentTarget
  const username = form.elements.username.value.trim()
  const password = form.elements.password.value
  if (!username || !password) return showLoginError('Completa usuario y contraseña antes de continuar.')
  app.innerHTML = renderLoginView({ isSubmitting: true })
  try {
    const user = await login(username, password)
    if (!user) throw new ApiError('La respuesta de autenticación no contiene un usuario.')
    replaceRoute(roleRoute(user))
  } catch (error) {
    showLoginError(error.message)
  }
}

function showLoginError(message) {
  loginError = message
  app.innerHTML = renderLoginView({ errorMessage: loginError })
  bindLoginForm()
}

function bindLoginForm() {
  app.querySelector('#login-form').addEventListener('submit', submitLogin)
}

async function currentSession(route) {
  try {
    return { user: await loadSession() }
  } catch (error) {
    if (!isUnauthorized(error) && route !== 'login' && route !== 'home') return { error }
    return { user: null }
  }
}

function isPrivateRoute(route) {
  return route === 'admin' || route === 'guardia' || route === 'app' || route.startsWith('admin/') || route.startsWith('guardia/')
}

function correctRoleRoute(route, user) {
  if (!user && isPrivateRoute(route)) return navigateToLogin()
  if (user && ['login', 'home', 'app'].includes(route)) return replaceRoute(roleRoute(user))
  if (user?.rol !== 'admin' && route.startsWith('admin')) return replaceRoute(roleRoute(user))
  if (user?.rol !== 'guardia' && route.startsWith('guardia')) return replaceRoute(roleRoute(user))
  return false
}

function bindLogout() {
  const button = app.querySelector('#logout-button')
  if (!button) return
  button.addEventListener('click', async () => {
    await logout()
    navigateToLogin()
  })
}

async function renderPrivateRoute(route, user) {
  if (route === 'admin') {
    await mountAdminDashboard(app, user)
    return bindLogout()
  }
  if (route === 'admin/usuarios') {
    await mountAdminUsers(app, user)
    return bindLogout()
  }
  if (route === 'admin/locales') {
    await mountAdminServices(app, user)
    return bindLogout()
  }
  app.innerHTML = renderProtectedView(user, activeSection(route, user))
  bindLogout()
}

async function renderRouteContent(route, user) {
  if (route === 'login') {
    app.innerHTML = renderLoginView({ errorMessage: loginError })
    return bindLoginForm()
  }
  if (!user) return app.innerHTML = renderPublicView()
  await renderPrivateRoute(route, user)
}

async function renderRoute() {
  if (isBootstrapping) return
  isBootstrapping = true
  app.innerHTML = '<main class="page"><section class="auth-panel session-loading" role="status" aria-live="polite"><span class="loader" aria-hidden="true"></span><p>Comprobando sesión...</p></section></main>'
  const route = routeName()
  const session = await currentSession(route)
  isBootstrapping = false
  if (session.error) return renderSessionError(session.error)
  if (correctRoleRoute(route, session.user)) return
  await renderRouteContent(route, session.user)
}

window.addEventListener('hashchange', renderRoute)
renderRoute()
