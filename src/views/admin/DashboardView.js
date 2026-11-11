import { renderLayout } from '../../components/Layout.js'
import { renderDashboardContent } from '../../components/admin/DashboardContent.js'
import { escapeHtml } from '../../utils/serviceValidation.js'

export function renderDashboardView({ user, data = null, loading = false, error = '' }) {
  let body = '<section class="dashboard-loading surface" role="status"><span class="loader" aria-hidden="true"></span><p>Cargando información operativa…</p></section>'
  if (error) body = `<section class="surface dashboard-error" role="alert"><h2>No se pudo cargar el dashboard</h2><p>${escapeHtml(error)}</p><button class="button primary" id="refresh-dashboard-error" type="button">Reintentar</button></section>`
  if (!loading && !error && data) body = renderDashboardContent(data)
  const content = `<section class="dashboard operational-dashboard" aria-labelledby="dashboard-title"><div class="section-heading"><div><span class="eyebrow">Operaciones</span><h1 id="dashboard-title">Dashboard.</h1><p>Vista actualizada del equipo, las asignaciones y la cobertura.</p></div><div class="dashboard-actions"><a class="button" href="#/admin/usuarios">Gestionar guardias</a><a class="button" href="#/admin/locales">Servicios y horarios</a><button class="button primary" id="refresh-dashboard" type="button" ${loading ? 'disabled' : ''}>Actualizar</button></div></div>${body}</section>`
  return renderLayout({ user, activeSection: 'admin', content })
}
