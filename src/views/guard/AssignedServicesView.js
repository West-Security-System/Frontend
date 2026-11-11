import { renderLayout } from '../../components/Layout.js'
import { renderLocationCapture } from '../../components/guard/LocationCapture.js'
import { renderServiceScheduleSelector } from '../../components/guard/ServiceScheduleSelector.js'
import { escapeHtml } from '../../utils/html.js'

function renderAssignedState(state) {
  if (state.servicesLoading) return '<p class="guard-state" role="status">Cargando tus servicios asignados…</p>'
  if (state.servicesError) return `<p class="guard-state guard-error" role="alert">${escapeHtml(state.servicesError)} <button class="button text" id="retry-services" type="button">Reintentar</button></p>`
  if (state.services.length) return renderServiceScheduleSelector(state)
  return '<div class="guard-empty" role="status"><h3>No tienes servicios asignados</h3><p>Contacta a administración para que te asignen un servicio y horario.</p></div>'
}

function renderContinue(state) {
  const ready = Boolean(state.selectedScheduleId && state.location && !state.submitting && !state.prepared)
  const label = state.prepared ? 'Preparación completada' : state.submitting ? 'Preparando…' : 'Continuar'
  return `<div class="form-actions guard-actions"><button class="button primary" id="continue-checkin" type="button" ${ready ? '' : 'disabled'}>${label}</button></div><p class="guard-confirmation" role="status" aria-live="polite">${state.prepared ? 'Turno y ubicación preparados para el siguiente paso. El ingreso aún no se ha registrado.' : ''}</p>`
}

export function renderAssignedServicesView(user, state) {
  const content = `<section class="dashboard guard-dashboard" aria-labelledby="assigned-title">
    <div class="section-heading"><div><span class="eyebrow">Operaciones de guardia</span><h1 id="assigned-title">Prepara tu turno.</h1></div></div>
    <p class="guard-intro">Solo se muestran los servicios asignados a tu sesión. El navegador solicitará tu ubicación real cuando lo indiques.</p>
    <section class="surface" aria-labelledby="service-title"><div class="surface-heading"><div><span class="eyebrow">Tus asignaciones</span><h2 id="service-title">Servicio y horario.</h2></div></div>
      ${renderAssignedState(state)}</section>
    ${renderLocationCapture(state)}${renderContinue(state)}
  </section>`
  return renderLayout({ user, activeSection: 'horarios', content })
}
