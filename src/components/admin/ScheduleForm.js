import { escapeHtml, WEEKDAYS } from '../../utils/serviceValidation.js'

export function renderScheduleForm(service, schedule = null) {
  const days = Array.isArray(schedule?.dias) ? schedule.dias.map(Number) : []
  return `
    <div class="modal-backdrop" id="schedule-modal" hidden>
      <section class="modal schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
        <button class="modal-close" type="button" data-close-schedule aria-label="Cerrar formulario">×</button>
        <span class="eyebrow">${escapeHtml(service?.nombre || 'Servicio')}</span><h2 id="schedule-modal-title">${schedule ? 'Editar horario' : 'Nuevo horario'}</h2>
        <form id="schedule-form" class="admin-form" novalidate>
          <input type="hidden" name="id" value="${escapeHtml(schedule?.id || '')}" />
          <input type="hidden" name="servicio_id" value="${escapeHtml(service?.id || '')}" />
          <fieldset class="weekday-list"><legend>Días de la semana</legend>${WEEKDAYS.map((day) => `<label><input type="checkbox" name="dias" value="${day.value}" ${days.includes(day.value) ? 'checked' : ''} /><span>${day.label}</span></label>`).join('')}</fieldset>
          <div class="form-grid">
            <div class="field"><label for="schedule-start">Hora inicial</label><input id="schedule-start" name="hora_inicio" type="time" required value="${escapeHtml(schedule?.hora_inicio || '')}" /></div>
            <div class="field"><label for="schedule-end">Hora final</label><input id="schedule-end" name="hora_fin" type="time" required value="${escapeHtml(schedule?.hora_fin || '')}" /></div>
          </div>
          <div class="field"><label for="schedule-capacity">Capacidad</label><input id="schedule-capacity" name="capacidad" type="number" min="1" step="1" required value="${escapeHtml(schedule?.capacidad || '')}" /></div>
          <p id="schedule-form-error" class="form-error" role="alert" aria-live="polite"></p>
          <div class="form-actions"><button class="button primary" type="submit">Guardar horario</button><button class="button" type="button" data-close-schedule>Cancelar</button></div>
        </form>
      </section>
    </div>`
}
