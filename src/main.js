import './style.css'
import { ApiError } from './api/httpClient.js'
import { getCurrentUser, isUnauthorized, loadSession, login, logout } from './auth/session.js'
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
