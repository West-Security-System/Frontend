import { renderLayout } from '../../components/Layout.js'
import { renderScheduleForm } from '../../components/admin/ScheduleForm.js'
import { renderScheduleList } from '../../components/admin/ScheduleList.js'
import { renderServiceForm } from '../../components/admin/ServiceForm.js'
import { renderServiceList } from '../../components/admin/ServiceList.js'
import { escapeHtml } from '../../utils/serviceValidation.js'

export function renderServicesView({ user, services, schedules, selectedService, error = '' }) {
  const content = `
    <section class="dashboard services-page" aria-labelledby="services-title">
      <div class="section-heading"><div><span class="eyebrow">Administración</span><h1 id="services-title">Servicios.</h1><p>Gestiona ubicaciones, coordenadas y horarios de cobertura.</p></div><button class="button primary" id="new-service-button" type="button">Añadir servicio</button></div>
      <div id="services-alert" class="users-alert ${error ? 'error' : ''}" role="status" aria-live="polite">${escapeHtml(error)}</div>
      <section class="surface" aria-labelledby="service-list-title"><div class="surface-heading"><div><span class="eyebrow">Ubicaciones</span><h2 id="service-list-title">Servicios registrados</h2></div><span class="record-count">${services.length} ${services.length === 1 ? 'servicio' : 'servicios'}</span></div>${renderServiceList(services, selectedService?.id)}</section>
      <section class="surface" aria-labelledby="schedule-list-title"><div class="surface-heading"><div><span class="eyebrow">${selectedService?.nombre || 'Horarios'}</span><h2 id="schedule-list-title">Horarios del servicio</h2></div>${selectedService ? '<button class="button primary" id="new-schedule-button" type="button">Añadir horario</button>' : ''}</div>${selectedService ? renderScheduleList(schedules) : '<div class="empty-users"><h3>Selecciona un servicio</h3><p>Los horarios se muestran únicamente para la ubicación seleccionada.</p></div>'}</section>
    </section>
    ${renderServiceForm()}
    ${selectedService ? renderScheduleForm(selectedService) : ''}`
  return renderLayout({ user, activeSection: 'locales', content })
}
