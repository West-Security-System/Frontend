import { renderLayout } from '../../components/Layout.js'
import { renderCalendarAgenda } from '../../components/admin/MonthlyCalendar.js'
import { renderMonthlyValueForm } from '../../components/admin/MonthlyValueForm.js'
import { escapeHtml } from '../../utils/serviceValidation.js'
import { formatMonth } from '../../utils/monthNavigation.js'

function renderServiceOptions(services, selectedId) {
  return services.map((service) => `<option value="${escapeHtml(service.id)}" ${String(service.id) === String(selectedId) ? 'selected' : ''}>${escapeHtml(service.nombre)}</option>`).join('')
}

function renderCalendarControls(state) {
  const services = state.services.length
    ? `<div class="field"><label for="calendar-service">Servicio</label><select id="calendar-service" name="servicioId" ${state.loading ? 'disabled' : ''}>${renderServiceOptions(state.services, state.selectedServiceId)}</select></div>`
    : '<p class="calendar-empty" role="status">No hay servicios disponibles.</p>'
  const disabled = state.loading || !state.selectedServiceId ? 'disabled' : ''
  return `<div class="calendar-controls">${services}<div class="calendar-month-control" aria-label="Navegación mensual"><button class="button" id="calendar-previous" type="button" aria-label="Mes anterior" ${disabled}>&lsaquo;</button><h2 class="calendar-month-title">${escapeHtml(formatMonth(state.month, state.year))}</h2><button class="button" id="calendar-next" type="button" aria-label="Mes siguiente" ${disabled}>&rsaquo;</button><button class="button" id="calendar-current" type="button" ${disabled}>Mes actual</button></div></div>`
}

export function renderCalendarView(state) {
  const content = `<section class="dashboard calendar-page" aria-labelledby="calendar-title"><div class="section-heading"><div><span class="eyebrow">Administración</span><h1 id="calendar-title">Calendario.</h1><p>Actividad mensual por servicio.</p></div></div><section class="surface calendar-panel" aria-label="Calendario mensual">${renderCalendarControls(state)}${renderCalendarAgenda({ calendar: state.calendar, loading: state.loading, error: state.error })}</section>${renderMonthlyValueForm({ value: state.monthlyValue, draftValue: state.draftValue, error: state.valueError, feedback: state.valueFeedback, saving: state.saving, disabled: !state.selectedServiceId || state.loading || Boolean(state.error) })}</section>`
  return renderLayout({ user: state.user, activeSection: 'calendario', content })
}
