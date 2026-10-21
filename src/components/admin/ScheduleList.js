import { escapeHtml, WEEKDAYS } from '../../utils/serviceValidation.js'

function weekdayLabels(days) {
  const values = Array.isArray(days) ? days.map(Number) : JSON.parse(days || '[]')
  return values.sort((a, b) => a - b).map((day) => WEEKDAYS.find((item) => item.value === day)?.label).filter(Boolean).join(', ')
}

export function renderScheduleList(schedules) {
  if (!schedules.length) return '<div class="empty-users"><span class="state-icon" aria-hidden="true">○</span><h3>Este servicio aún no tiene horarios</h3><p>Añade días, franja horaria y capacidad para empezar.</p></div>'
  return `<div class="table-wrap"><table class="schedule-table"><caption class="sr-only">Horarios del servicio seleccionado</caption><thead><tr><th>Días</th><th>Franja horaria</th><th>Capacidad</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>${schedules.map((schedule) => `
    <tr><td>${escapeHtml(weekdayLabels(schedule.dias))}</td><td>${escapeHtml(schedule.hora_inicio)}–${escapeHtml(schedule.hora_fin)}</td><td>${escapeHtml(schedule.capacidad)}</td><td class="row-actions"><button class="button text" type="button" data-edit-schedule="${escapeHtml(schedule.id)}">Editar</button><button class="button text danger-text" type="button" data-delete-schedule="${escapeHtml(schedule.id)}">Eliminar</button></td></tr>`).join('')}</tbody></table></div>`
}
