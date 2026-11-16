import { escapeHtml } from '../../utils/serviceValidation.js'
import { currentLocalDateTime } from '../../utils/adminRecords.js'

function detailField(label, value) {
  return `<div><dt>${label}</dt><dd>${escapeHtml(value ?? '—')}</dd></div>`
}

export function renderRecordDetail({ status, record, error, notFound }) {
  if (status === 'idle') return ''
  const body = status === 'loading'
    ? '<p role="status">Cargando detalle del registro…</p>'
    : status === 'error'
      ? `<div role="alert" class="form-error"><strong>${notFound ? 'Registro no encontrado (404).' : 'No se pudo cargar el detalle.'}</strong><p>${escapeHtml(error)}</p></div>`
      : `<dl class="record-detail-grid">${detailField('ID', record.id)}${detailField('Guardia', record.username || record.usuario_nombre || record.usuario_id)}${detailField('Servicio', record.local_nombre || record.servicio_nombre || record.local_id)}${detailField('Horario', record.horario_hora_inicio && record.horario_hora_fin ? `${record.horario_hora_inicio}–${record.horario_hora_fin}` : record.horario_id)}${detailField('Estado', record.estado)}${detailField('Ingreso', record.hora_ingreso)}${detailField('Egreso', record.hora_egreso)}${detailField('Duración (segundos)', record.duracion_segundos)}${detailField('Coordenadas de ingreso', `${record.latitud_ingreso ?? '—'}, ${record.longitud_ingreso ?? '—'}`)}${detailField('Coordenadas de egreso', `${record.latitud_egreso ?? '—'}, ${record.longitud_egreso ?? '—'}`)}</dl>`
  return `<div class="modal-backdrop" id="record-detail-modal">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="record-detail-title">
      <button class="modal-close" type="button" data-close-record-detail aria-label="Cerrar detalle">×</button>
      <span class="eyebrow">Supervisión</span><h2 id="record-detail-title">Detalle del registro</h2>${body}
      <div class="form-actions"><button class="button" type="button" data-close-record-detail>Cerrar</button></div>
    </section></div>`
}

export function renderRecordConfirmation(action, count, error = '', busy = false) {
  if (!action) return ''
  const closing = action === 'close'
  return `<div class="modal-backdrop" id="record-confirm-modal">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="record-confirm-title">
      <span class="eyebrow">Confirmación</span>
      <h2 id="record-confirm-title">${closing ? 'Completar registros' : 'Eliminar registros'}</h2>
      <p>${closing ? `Se cerrarán ${count} registros seleccionados. La hora debe ser posterior al ingreso.` : `Se eliminarán ${count} registros seleccionados. Esta acción no se puede deshacer.`}</p>
      ${closing ? `<div class="field"><label for="record-exit-time">Hora de egreso</label><input id="record-exit-time" type="datetime-local" required value="${currentLocalDateTime()}" /></div>` : ''}
      <p id="record-confirm-error" class="form-error" role="alert" aria-live="polite">${escapeHtml(error)}</p>
      <div class="form-actions"><button class="button primary" type="button" data-confirm-record-action ${busy ? 'disabled' : ''}>${closing ? 'Confirmar cierre' : 'Confirmar eliminación'}</button><button class="button" type="button" data-cancel-record-action ${busy ? 'disabled' : ''}>Cancelar</button></div>
    </section></div>`
}
