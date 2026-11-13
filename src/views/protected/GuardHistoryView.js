import { renderLayout } from '../../components/Layout.js'
import { escapeHtml } from '../../utils/serviceValidation.js'
import { renderActivityRow } from '../../utils/activityHistory.js'

function renderFilters(filters) {
  return `<form id="activity-filters" class="admin-form activity-filters"><div class="field"><label for="activity-from">Desde</label><input id="activity-from" name="desde" type="date" value="${escapeHtml(filters.desde || '')}" /></div><div class="field"><label for="activity-to">Hasta</label><input id="activity-to" name="hasta" type="date" value="${escapeHtml(filters.hasta || '')}" /></div><div class="field"><label for="activity-status">Estado</label><select id="activity-status" name="estado"><option value="">Todos</option><option value="abierto" ${filters.estado === 'abierto' ? 'selected' : ''}>En curso</option><option value="cerrado" ${filters.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option></select></div><div class="form-actions"><button class="button primary" type="submit">Aplicar filtros</button><button class="button" type="button" id="refresh-activity">Actualizar</button></div></form>`
}

function renderRecords(records, loading, error) {
  if (loading) return '<p role="status">Cargando historial…</p>'
  if (error) return `<div role="alert" class="users-alert error">${escapeHtml(error)} <button class="button" type="button" id="retry-activity">Reintentar</button></div>`
  if (!records.length) return '<p class="empty-users" role="status">No hay registros para los filtros seleccionados.</p>'
  return `<div class="table-wrap"><table><caption class="sr-only">Historial de mis servicios y marcas</caption><thead><tr><th scope="col">Servicio</th><th scope="col">Ingreso</th><th scope="col">Egreso</th><th scope="col">Estado</th></tr></thead><tbody>${records.map(renderActivityRow).join('')}</tbody></table></div>`
}

function renderNotifications(notifications) {
  if (!notifications.length) return '<p role="status">No tienes avisos.</p>'
  return `<ul class="activity-notifications">${notifications.map((item) => `<li class="${item.leido ? 'read' : 'unread'}"><span>${escapeHtml(item.mensaje || item.titulo || 'Aviso')}</span><span>${item.leido ? 'Leído' : 'No leído'}</span></li>`).join('')}</ul>`
}

export function renderGuardHistoryView({
  user,
  records = [],
  notifications = [],
  filters = {},
  loading = false,
  error = '',
}) {
  const unreadCount = notifications.filter((item) => !item.leido).length
  const content = `<section class="dashboard guard-history-page" aria-labelledby="history-title"><div class="section-heading"><div><span class="eyebrow">Operaciones de guardia</span><h1 id="history-title">Mi historial.</h1><p>Consulta tus servicios, marcas de ingreso y egreso y avisos.</p></div></div><section class="surface" aria-labelledby="records-title"><div class="surface-heading"><h2 id="records-title">Servicios y marcas</h2></div>${renderFilters(filters)}${renderRecords(records, loading, error)}</section><section class="surface" aria-labelledby="notifications-title"><div class="surface-heading"><h2 id="notifications-title">Avisos</h2><span class="record-count" aria-label="${unreadCount} avisos sin leer">${unreadCount}</span><button class="button" id="mark-notifications-read" type="button" ${unreadCount ? '' : 'disabled'}>Marcar leídos</button></div>${renderNotifications(notifications)}</section></section>`
  return renderLayout({ user, activeSection: 'historial', content })
}
