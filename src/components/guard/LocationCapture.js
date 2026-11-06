import { escapeHtml } from '../../utils/html.js'

function locationDetails(location) {
  if (!location) return '<p class="location-placeholder">Aún no se ha solicitado tu ubicación.</p>'
  return `<dl class="location-values"><div><dt>Latitud</dt><dd>${location.latitude}</dd></div><div><dt>Longitud</dt><dd>${location.longitude}</dd></div><div><dt>Precisión</dt><dd>±${Math.round(location.accuracy)} m</dd></div></dl>`
}

export function renderLocationCapture({ location, locationStatus, locationError, selectedScheduleId }) {
  const message = locationStatus === 'loading' ? 'Esperando permiso y señal de ubicación…' : escapeHtml(locationError)
  const disabled = locationStatus === 'loading' || !selectedScheduleId ? 'disabled' : ''
  return `<section class="surface location-surface" aria-labelledby="location-title">
    <div class="surface-heading"><div><span class="eyebrow">Ubicación del dispositivo</span><h2 id="location-title">Confirma tu posición.</h2></div>
      <button class="button secondary" id="request-location" type="button" ${disabled}>${locationStatus === 'loading' ? 'Obteniendo ubicación…' : location ? 'Actualizar ubicación' : 'Obtener ubicación'}</button>
    </div>
    <p class="location-message ${locationError ? 'location-error' : ''}" role="${locationError ? 'alert' : 'status'}" aria-live="polite">${message}</p>
    ${locationDetails(location)}
  </section>`
}
