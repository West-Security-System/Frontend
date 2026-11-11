import { escapeHtml } from '../../utils/serviceValidation.js'
import { renderScheduleFields, renderScheduleTitle } from '../../utils/scheduleForm.js'

export function renderScheduleForm(service, schedule = null) {
  return `
    <div class="modal-backdrop" id="schedule-modal" hidden>
      <section class="modal schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
        <button class="modal-close" type="button" data-close-schedule aria-label="Cerrar formulario">×</button>
        <span class="eyebrow">${escapeHtml(service?.nombre || 'Servicio')}</span><h2 id="schedule-modal-title">${renderScheduleTitle(schedule)}</h2>
        <form id="schedule-form" class="admin-form" novalidate>
          ${renderScheduleFields(service, schedule)}
          <p id="schedule-form-error" class="form-error" role="alert" aria-live="polite"></p>
          <div class="form-actions"><button class="button primary" type="submit">Guardar horario</button><button class="button" type="button" data-close-schedule>Cancelar</button></div>
        </form>
      </section>
    </div>`
}
