import { escapeHtml } from '../../utils/serviceValidation.js'

export function renderServiceForm(service = null) {
  const current = service || { nombre: '', latitud: '', longitud: '' }
  return `
    <div class="modal-backdrop" id="service-modal" hidden>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="service-modal-title">
        <button class="modal-close" type="button" data-close-service aria-label="Cerrar formulario">×</button>
        <span class="eyebrow">Servicio</span><h2 id="service-modal-title">${service ? 'Editar servicio' : 'Nuevo servicio'}</h2>
        <form id="service-form" class="admin-form" novalidate>
          <input type="hidden" name="id" value="${escapeHtml(current.id || '')}" />
          <div class="field"><label for="service-name">Nombre</label><input id="service-name" name="nombre" maxlength="100" required value="${escapeHtml(current.nombre)}" /></div>
          <div class="form-grid coordinates-grid">
            <div class="field"><label for="service-lat">Latitud</label><input id="service-lat" name="latitud" type="number" step="any" min="-90" max="90" required value="${escapeHtml(current.latitud)}" /></div>
            <div class="field"><label for="service-lng">Longitud</label><input id="service-lng" name="longitud" type="number" step="any" min="-180" max="180" required value="${escapeHtml(current.longitud)}" /></div>
          </div>
          <p id="service-form-error" class="form-error" role="alert" aria-live="polite"></p>
          <div class="form-actions"><button class="button primary" type="submit">Guardar servicio</button><button class="button" type="button" data-close-service>Cancelar</button></div>
        </form>
      </section>
    </div>`
}
