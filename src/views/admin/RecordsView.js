import { renderLayout } from '../../components/Layout.js'
import { escapeHtml } from '../../utils/serviceValidation.js'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : escapeHtml(new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(date))
}

function renderRows(records, active, selectedIds) {
  if (!records.length) return '<tr><td colspan="7" class="records-empty">No hay registros para los filtros seleccionados.</td></tr>'
  return records.map((record) => {
    const closed = Boolean(record.hora_egreso || record.estado === 'cerrado')
    const id = escapeHtml(record.id)
    return `<tr><td><label class="record-select"><span class="sr-only">Seleccionar registro ${id}</span><input type="checkbox" name="ids" value="${id}" ${selectedIds.includes(String(record.id)) ? 'checked' : ''} /></label></td><th scope="row">${escapeHtml(record.guardia || record.guardia_username || record.username || `Registro ${id}`)}</th><td>${escapeHtml(record.local || record.local_nombre || record.servicio || 'Servicio')}</td><td>${formatDate(record.hora_ingreso)}</td><td>${formatDate(record.hora_egreso)}</td><td><span class="tag ${closed ? 'success' : 'warning'}">${closed ? 'Cerrado' : 'Activo'}</span></td><td>${active && !closed ? `<button class="button secondary" type="button" data-close-record="${id}">Cerrar registro</button>` : ''}</td></tr>`
  }).join('')
}

export function renderAdminRecordsView({ user, records = [], active = true, filters = {}, selectedIds = [], loading = false, error = '', feedback = '' }) {
  const rows = loading ? '<tr><td colspan="7" role="status">Cargando registros…</td></tr>' : error
    ? `<tr><td colspan="7" role="alert">${escapeHtml(error)}</td></tr>`
    : renderRows(records, active, selectedIds)
  const content = `<section class="dashboard admin-records-page" aria-labelledby="admin-records-title"><div class="section-heading"><div><span class="eyebrow">Supervisión</span><h1 id="admin-records-title">Registros de guardia.</h1><p>Consulta ingresos activos y el historial de turnos registrados.</p></div></div><div id="records-feedback" role="status" aria-live="polite">${escapeHtml(feedback)}</div><form id="admin-records-filters" class="admin-form records-filters"><div class="field"><label for="records-state">Vista</label><select id="records-state" name="vista"><option value="active" ${active ? 'selected' : ''}>Activos</option><option value="history" ${!active ? 'selected' : ''}>Historial</option></select></div><div class="field"><label for="records-from">Desde</label><input id="records-from" name="desde" type="date" value="${escapeHtml(filters.desde || '')}" /></div><div class="field"><label for="records-to">Hasta</label><input id="records-to" name="hasta" type="date" value="${escapeHtml(filters.hasta || '')}" /></div><div class="form-actions"><button class="button primary" type="submit" ${loading ? 'disabled' : ''}>Aplicar filtros</button><button class="button" id="delete-selected-records" type="button" ${!selectedIds.length || loading ? 'disabled' : ''}>Eliminar seleccionados</button></div></form><section class="surface" aria-labelledby="records-table-title"><div class="surface-heading"><h2 id="records-table-title">${active ? 'Ingresos activos' : 'Historial de registros'}</h2><span class="record-count">${records.length} registros</span></div><div class="table-wrap"><table class="admin-records-table"><caption class="sr-only">Registros de ingreso y egreso de guardias</caption><thead><tr><th scope="col">Seleccionar</th><th scope="col">Guardia</th><th scope="col">Local</th><th scope="col">Ingreso</th><th scope="col">Egreso</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead><tbody>${rows}</tbody></table></div></section></section>`
  return renderLayout({ user, activeSection: 'registros', content })
}
