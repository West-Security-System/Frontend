import { renderLayout } from '../../components/Layout.js'
import { escapeHtml } from '../../utils/serviceValidation.js'

export function renderProtectedView(user) {
  const destination = user.rol === 'admin' ? '#/admin' : '#/guardia/horarios'
  const content = `<section class="dashboard" role="alert" aria-labelledby="protected-title"><span class="eyebrow">Acceso</span><h1 id="protected-title">Sección no disponible.</h1><p>No se encontró la vista solicitada.</p><a class="button primary" href="${destination}">Volver a mi panel</a><span class="sr-only">${escapeHtml(user.rol)}</span></section>`
  return renderLayout({ user, activeSection: user.rol, content })
}