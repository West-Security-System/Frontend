import { renderLayout } from '../../components/Layout.js'
import { renderShiftExitForm } from '../../components/guard/ShiftExitForm.js'

export function renderGuardExitView({
  user,
  locationState = { status: 'idle', position: null, error: '' },
  feedback = '',
  observations = '',
  submitting = false,
  completed = false,
}) {
  const content = `
    <section class="dashboard guard-exit-page" aria-labelledby="guard-exit-page-title">
      <div class="section-heading">
        <div><span class="eyebrow">Operaciones de guardia</span><h1 id="guard-exit-page-title">Cierre de turno.</h1><p>Registra las novedades y confirma tu salida desde el servicio.</p></div>
      </div>
      ${renderShiftExitForm({ locationState, feedback, observations, submitting, completed })}
    </section>
  `
  return renderLayout({ user, activeSection: 'egreso', content })
}
