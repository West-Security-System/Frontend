import { renderLayout } from '../../components/Layout.js'
import { escapeHtml } from '../../utils/serviceValidation.js'

function renderServiceOptions(services, selectedId) {
  return services.map((service) => `
    <option value="${escapeHtml(service.id)}" ${String(service.id) === String(selectedId) ? 'selected' : ''}>
      ${escapeHtml(service.nombre)}
    </option>
  `).join('')
}

function renderScheduleOptions(schedules, selectedId) {
  return schedules.map((schedule) => `
    <option value="${escapeHtml(schedule.id)}" ${String(schedule.id) === String(selectedId) ? 'selected' : ''}>
      ${escapeHtml(schedule.hora_inicio)}–${escapeHtml(schedule.hora_fin)}
    </option>
  `).join('')
}

function renderAssignmentState(services, loading) {
  if (services.length) {
    return loading ? '<p class="guard-schedule-state" role="status">Cargando horarios…</p>' : ''
  }
  if (loading) return '<p class="guard-schedule-state" role="status">Cargando tus servicios asignados…</p>'
  return `
    <div class="guard-schedule-empty" role="status">
      <span class="state-icon" aria-hidden="true">i</span>
      <div><h3>Aún no tienes servicios asignados</h3><p>Solicita a administración que te asigne un servicio y horario para registrar tu ingreso.</p></div>
    </div>
  `
}

function renderLocationState(locationState) {
  const position = locationState.position
  if (position) {
    return `<p class="location-status" role="status">Ubicación capturada: ${position.latitud.toFixed(6)}, ${position.longitud.toFixed(6)} · precisión ±${Math.round(position.precision)} m</p>`
  }
  if (locationState.status === 'loading') return '<p class="location-status" role="status">Obteniendo ubicación…</p>'
  if (locationState.error) return `<p class="form-error" role="alert">${escapeHtml(locationState.error)}</p>`
  return '<p class="location-status">Captura tu ubicación para habilitar el registro de ingreso.</p>'
}

export function renderGuardSchedulesView({
  user,
  services = [],
  selectedServiceId = '',
  schedules = [],
  selectedScheduleId = '',
  loading = false,
  feedback = '',
  locationState = { status: 'idle', position: null, error: '' },
}) {
  const hasAssignment = services.length > 0
  const hasSchedules = schedules.length > 0
  const isLocating = locationState.status === 'loading'
  const disableForm = loading || !hasAssignment
  const content = `
    <section class="dashboard guard-schedules-page" aria-labelledby="guard-schedules-title">
      <div class="section-heading">
        <div><span class="eyebrow">Operaciones de guardia</span><h1 id="guard-schedules-title">Mis servicios.</h1><p>Consulta tus horarios asignados y registra el ingreso desde el servicio.</p></div>
      </div>
      ${feedback ? `<p class="users-alert ${feedback.startsWith('Ingreso registrado') ? 'success' : 'error'}" role="status">${escapeHtml(feedback)}</p>` : ''}
      ${renderAssignmentState(services, loading)}
      ${hasAssignment ? `
        <section class="surface" aria-labelledby="checkin-title">
          <div class="surface-heading"><div><span class="eyebrow">Asignaciones activas</span><h2 id="checkin-title">Registrar ingreso</h2></div></div>
          <form id="guard-checkin-form" class="admin-form">
            <div class="field"><label for="guard-service">Servicio asignado</label><select id="guard-service" name="servicio_id" data-service-select ${disableForm ? 'disabled' : ''}>${renderServiceOptions(services, selectedServiceId)}</select></div>
            <div class="field"><label for="guard-schedule">Horario</label><select id="guard-schedule" name="horario_id" data-schedule-select ${!hasSchedules || disableForm ? 'disabled' : ''}>${renderScheduleOptions(schedules, selectedScheduleId)}</select>${!hasSchedules && !loading ? '<p class="form-error">Este servicio no tiene horarios asignados.</p>' : ''}</div>
            ${renderLocationState(locationState)}
            <div class="form-actions">
              <button class="button" type="button" data-capture-location ${isLocating || disableForm ? 'disabled' : ''}>${isLocating ? 'Obteniendo ubicación…' : 'Capturar ubicación'}</button>
              <button class="button primary" type="submit" ${!hasSchedules || !locationState.position || disableForm ? 'disabled' : ''}>Registrar ingreso</button>
            </div>
          </form>
        </section>
      ` : ''}
    </section>
  `
  return renderLayout({ user, activeSection: 'horarios', content })
}
