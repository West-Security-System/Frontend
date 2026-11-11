import { escapeHtml } from '../../utils/serviceValidation.js'

function formatDate(value) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return escapeHtml(value || 'Fecha no disponible')
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}

function renderGuards(guards) {
  if (!guards.length) return '<div class="dashboard-empty">No hay guardias activos registrados.</div>'
  return `<ul class="guard-list">${guards.map((guard) => `<li><span class="guard-indicator" aria-hidden="true"></span>${escapeHtml(guard.username)}</li>`).join('')}</ul>`
}

function renderRecords(records) {
  if (!records.length) return '<div class="dashboard-empty">Todavía no hay asignaciones recientes.</div>'
  return `<div class="table-wrap"><table class="dashboard-table"><thead><tr><th>Guardia</th><th>Servicio</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>${records.map((record) => `<tr><th scope="row">${escapeHtml(record.guardia)}</th><td>${escapeHtml(record.servicio)}</td><td>${formatDate(record.fecha)}</td><td><span class="tag success">${escapeHtml(record.estado)}</span></td></tr>`).join('')}</tbody></table></div>`
}

function renderAlerts(alerts) {
  if (!alerts.length) return '<div class="dashboard-empty">No hay alertas operativas.</div>'
  return `<ul class="alert-list">${alerts.map((alert) => `<li class="${alert.type}"><strong>${escapeHtml(alert.title)}</strong><span>${escapeHtml(alert.detail)}</span></li>`).join('')}</ul>`
}

export function renderDashboardContent(data) {
  return `<div class="dashboard-grid"><section class="surface dashboard-panel"><div class="surface-heading"><div><span class="eyebrow">Equipo disponible</span><h2>Guardias activos</h2></div><span class="record-count">${data.activeGuards.length}</span></div>${renderGuards(data.activeGuards)}</section><section class="surface dashboard-panel"><div class="surface-heading"><div><span class="eyebrow">Seguimiento</span><h2>Alertas operativas</h2></div><span class="record-count">${data.alerts.length}</span></div>${renderAlerts(data.alerts)}</section><section class="surface dashboard-panel records-panel"><div class="surface-heading"><div><span class="eyebrow">Actividad</span><h2>Registros recientes</h2></div></div>${renderRecords(data.records)}</section></div>`
}
