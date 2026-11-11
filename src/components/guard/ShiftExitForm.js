import { escapeHtml } from '../../utils/serviceValidation.js'

function renderLocation(locationState) {
  if (locationState.status === 'loading') {
    return '<p class="location-status" role="status">Obteniendo ubicación para confirmar el egreso…</p>'
  }
  if (locationState.error) {
    return `<p class="form-error" role="alert">${escapeHtml(locationState.error)}</p>`
  }
  return '<p class="location-status">La ubicación se capturará al confirmar el egreso.</p>'
}

function renderFeedback(feedback, completed) {
  if (!feedback) return ''
  const tone = completed ? ' success' : ''
  const role = completed ? 'status' : 'alert'
  return `<p class="guard-exit-feedback${tone}" role="${role}">${escapeHtml(feedback)}</p>`
}

export function renderShiftExitForm({ locationState, feedback, observations, submitting, completed }) {
  const disabled = submitting || completed
  const buttonLabel = locationState.status === 'loading' ? 'Obteniendo ubicación…' : 'Confirmar egreso'
  return `
    <section class="surface" aria-labelledby="guard-exit-title">
      <div class="surface-heading"><div><span class="eyebrow">Cierre de turno</span><h2 id="guard-exit-title">Registrar egreso</h2></div></div>
      <p>La ubicación debe estar dentro de los 100 metros del servicio y se comprobará que tengas un turno activo.</p>
      ${renderFeedback(feedback, completed)}
      <form id="guard-checkout-form" class="guard-exit-form">
        <div class="field">
          <label for="guard-exit-observations">Observaciones o novedades del turno</label>
          <textarea id="guard-exit-observations" name="observaciones" maxlength="2000" data-exit-observations>${escapeHtml(observations)}</textarea>
        </div>
        ${renderLocation(locationState)}
        <div class="form-actions">
          <button class="button primary" type="submit" data-confirm-exit ${disabled ? 'disabled' : ''}>${buttonLabel}</button>
        </div>
      </form>
    </section>
  `
}
