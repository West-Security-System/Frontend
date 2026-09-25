import './style.css'
import { renderPublicView } from './views/public/PublicView.js'
import { renderProtectedView } from './views/protected/ProtectedView.js'

const app = document.querySelector('#app')

function renderRoute() {
  const isProtectedRoute = window.location.hash === '#/app'
  app.innerHTML = isProtectedRoute ? renderProtectedView() : renderPublicView()
}

window.addEventListener('hashchange', renderRoute)
renderRoute()
