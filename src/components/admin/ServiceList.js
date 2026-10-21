import { escapeHtml } from '../../utils/serviceValidation.js'

export function renderServiceList(services, selectedId) {
  if (!services.length) return '<div class="empty-users"><span class="state-icon" aria-hidden="true">○</span><h3>No hay servicios registrados</h3><p>Crea un servicio para definir sus coordenadas y horarios.</p></div>'
  return `<div class="service-list">${services.map((service) => `
    <article class="service-card ${String(service.id) === String(selectedId) ? 'selected' : ''}">
      <button class="service-select" type="button" data-select-service="${escapeHtml(service.id)}" aria-pressed="${String(service.id) === String(selectedId)}"><span class="service-name">${escapeHtml(service.nombre)}</span><span class="coordinates">${Number(service.latitud).toFixed(5)}, ${Number(service.longitud).toFixed(5)}</span></button>
      <div class="service-actions"><button class="button text" type="button" data-edit-service="${escapeHtml(service.id)}">Editar</button><button class="button text danger-text" type="button" data-delete-service="${escapeHtml(service.id)}">Eliminar</button></div>
    </article>`).join('')}</div>`
}
