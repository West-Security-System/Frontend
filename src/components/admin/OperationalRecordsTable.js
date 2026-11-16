import { escapeHtml } from '../../utils/serviceValidation.js'
import { newestRecords } from '../../utils/adminRecords.js'

function recordStatus(record) {
  return record.estado === 'abierto' || !record.hora_egreso ? 'Abierto' : 'Cerrado'
}

function recordRow(record, selected) {
  return `<tr>
    <td><input type="checkbox" aria-label="Seleccionar registro ${escapeHtml(record.id)}" data-record-select="${escapeHtml(record.id)}" ${selected ? 'checked' : ''}></td>
    <th scope="row">${escapeHtml(record.id)}</th>
    <td>${escapeHtml(record.username || record.usuario_nombre || record.usuario_id)}</td>
    <td>${escapeHtml(record.local_nombre || record.servicio_nombre || record.local_id)}</td>
    <td><span class="tag ${recordStatus(record) === 'Abierto' ? 'warning' : 'success'}">${recordStatus(record)}</span></td>
    <td><time datetime="${escapeHtml(record.hora_ingreso || '')}">${escapeHtml(record.hora_ingreso || '—')}</time></td>
    <td><time datetime="${escapeHtml(record.hora_egreso || '')}">${escapeHtml(record.hora_egreso || '—')}</time></td>
    <td><button class="button text" type="button" data-record-detail="${escapeHtml(record.id)}" aria-label="Ver detalle del registro ${escapeHtml(record.id)}">Detalle</button></td>
  </tr>`
}

export function renderOperationalRecordsTable(records, selection, tab) {
  if (!records.length) return '<div class="empty-users"><h3>No hay registros</h3><p>No se encontraron turnos para esta consulta.</p></div>'
  const rows = newestRecords(records).map((record) => recordRow(record, selection.has(String(record.id)))).join('')
  const allSelected = records.every((record) => selection.has(String(record.id)))
  return `<div class="table-wrap"><table class="operational-records-table">
    <caption class="sr-only">Registros ${tab === 'active' ? 'activos' : 'históricos'}, ordenados del más reciente al más antiguo</caption>
    <thead><tr><th scope="col"><input type="checkbox" id="select-all-records" aria-label="Seleccionar todos los registros" ${allSelected ? 'checked' : ''}></th>
      <th scope="col">ID</th><th scope="col">Guardia</th><th scope="col">Servicio / local</th>
      <th scope="col">Estado</th><th scope="col">Ingreso</th><th scope="col">Egreso</th><th scope="col">Acciones</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`
}
