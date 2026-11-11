import { escapeHtml } from '../../utils/html.js'

function scheduleKey(schedule) {
  return schedule.horario_id ?? schedule.id
}

function scheduleLabel(schedule) {
  const days = Array.isArray(schedule.dias) ? schedule.dias.join(', ') : schedule.dias
  const hours = [schedule.hora_inicio, schedule.hora_fin].filter(Boolean).join('–')
  return [days && `Días ${days}`, hours].filter(Boolean).join(' · ') || `Turno ${scheduleKey(schedule)}`
}

export function renderServiceScheduleSelector({ services, selectedServiceId, schedules, selectedScheduleId, loadingSchedules, schedulesError }) {
  const serviceOptions = services.map((service) => `<option value="${escapeHtml(service.id)}" ${String(service.id) === String(selectedServiceId) ? 'selected' : ''}>${escapeHtml(service.nombre)}</option>`).join('')
  const scheduleOptions = schedules.map((schedule) => `<option value="${escapeHtml(scheduleKey(schedule))}" ${String(scheduleKey(schedule)) === String(selectedScheduleId) ? 'selected' : ''}>${escapeHtml(scheduleLabel(schedule))}</option>`).join('')
  return `
    <div class="guard-form-grid">
      <div class="field"><label for="assigned-service">Servicio asignado</label>
        <select id="assigned-service" ${services.length ? '' : 'disabled'}>
          <option value="">${services.length ? 'Selecciona un servicio' : 'Sin servicios asignados'}</option>${serviceOptions}
        </select>
      </div>
      <div class="field"><label for="assigned-schedule">Horario</label>
        <select id="assigned-schedule" ${!schedules.length || loadingSchedules ? 'disabled' : ''}>
          <option value="">${loadingSchedules ? 'Cargando horarios…' : 'Selecciona un horario'}</option>${scheduleOptions}
        </select>
      </div>
    </div>
    <p class="field-hint ${schedulesError ? 'guard-error' : ''}" role="${schedulesError ? 'alert' : 'status'}" aria-live="polite">${escapeHtml(schedulesError || (loadingSchedules ? 'Consultando horarios del servicio seleccionado.' : schedules.length ? '' : selectedServiceId ? 'Este servicio no tiene horarios asignados para tu usuario.' : ''))}</p>
  `
}
