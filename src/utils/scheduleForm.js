import { escapeHtml, WEEKDAYS } from './serviceValidation.js'

export function selectedScheduleDays(schedule) {
  return Array.isArray(schedule?.dias) ? schedule.dias.map(Number) : []
}

export function renderScheduleTitle(schedule) {
  return schedule ? 'Editar horario' : 'Nuevo horario'
}

export function renderWeekdayOptions(days) {
  return WEEKDAYS.map(({ value, label }) => `
    <label>
      <input type="checkbox" name="dias" value="${value}" ${days.includes(value) ? 'checked' : ''} />
      <span>${label}</span>
    </label>
  `).join('')
}

export function renderScheduleFields(service, schedule) {
  return `
    <input type="hidden" name="id" value="${escapeHtml(schedule?.id || '')}" />
    <input type="hidden" name="servicio_id" value="${escapeHtml(service?.id || '')}" />
    <fieldset class="weekday-list"><legend>Días de la semana</legend>${renderWeekdayOptions(selectedScheduleDays(schedule))}</fieldset>
    <div class="form-grid">
      <div class="field"><label for="schedule-start">Hora inicial</label><input id="schedule-start" name="hora_inicio" type="time" required value="${escapeHtml(schedule?.hora_inicio || '')}" /></div>
      <div class="field"><label for="schedule-end">Hora final</label><input id="schedule-end" name="hora_fin" type="time" required value="${escapeHtml(schedule?.hora_fin || '')}" /></div>
    </div>
    <div class="field"><label for="schedule-capacity">Capacidad</label><input id="schedule-capacity" name="capacidad" type="number" min="1" step="1" required value="${escapeHtml(schedule?.capacidad || '')}" /></div>
  `
}
