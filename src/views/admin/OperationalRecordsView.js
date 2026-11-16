import { renderLayout } from '../../components/Layout.js'
import { renderOperationalRecordsTable } from '../../components/admin/OperationalRecordsTable.js'
import { renderRecordConfirmation, renderRecordDetail } from '../../components/admin/RecordDialogs.js'
import { escapeHtml } from '../../utils/serviceValidation.js'

function options(items, valueKey, labelKey, selected) {
  return items.map((item) => `<option value="${escapeHtml(item[valueKey])}" ${String(item[valueKey]) === String(selected) ? 'selected' : ''}>${escapeHtml(item[labelKey])}</option>`).join('')
}

function filtersView(state) {
  const filters = state.filters[state.tab]
  return `<form id="records-filters" class="records-filters" aria-label="Filtros de registros">
    <div class="field"><label for="records-guard-filter">Guardia</label><select id="records-guard-filter" name="usuario_id"><option value="">Todos</option>${options(state.users, 'id', 'username', filters.usuario_id)}</select></div>
    <div class="field"><label for="records-service-filter">Servicio / local</label><select id="records-service-filter" name="local_id"><option value="">Todos</option>${options(state.services, 'id', 'nombre', filters.local_id)}</select></div>
    ${state.tab === 'history' ? `<div class="field"><label for="records-state-filter">Estado</label><select id="records-state-filter" name="estado"><option value="">Todos</option><option value="abierto" ${filters.estado === 'abierto' ? 'selected' : ''}>Abierto</option><option value="cerrado" ${filters.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option></select></div>` : ''}
    <div class="field"><label for="records-from-filter">Desde</label><input id="records-from-filter" name="desde" type="date" value="${escapeHtml(filters.desde)}" /></div>
    <div class="field"><label for="records-to-filter">Hasta</label><input id="records-to-filter" name="hasta" type="date" value="${escapeHtml(filters.hasta)}" /></div>
    <button class="button primary" type="submit">Aplicar filtros</button>
  </form>`
}

function listContent(state) {
  const list = state.lists[state.tab]
  if (list.status === 'loading') return '<div class="surface" role="status" aria-live="polite">Cargando registros…</div>'
  if (list.status === 'error') return `<div class="surface dashboard-error" role="alert"><p>${escapeHtml(list.error)}</p><button class="button" type="button" data-refresh-records>Reintentar</button></div>`
  if (list.status === 'empty') return '<div class="surface empty-users"><h3>No hay registros para mostrar</h3><p>Prueba cambiando los filtros o actualiza la consulta.</p></div>'
  return `<section class="surface" aria-labelledby="records-table-title"><div class="surface-heading"><div><span class="eyebrow">${state.tab === 'active' ? 'En curso' : 'Historial'}</span><h2 id="records-table-title">${state.tab === 'active' ? 'Registros activos' : 'Historial de registros'}</h2></div><span class="record-count">${list.records.length} registros</span></div>${renderOperationalRecordsTable(list.records, state.selection, state.tab)}</section>`
}

function actionsView(state) {
  const disabled = !state.selection.size || state.mutation.status === 'loading'
  return `<div class="records-actions"><span aria-live="polite">${state.selection.size} seleccionados</span><button class="button" type="button" data-record-action="close" ${disabled ? 'disabled' : ''}>Completar seleccionados</button><button class="button danger-text" type="button" data-record-action="delete" ${disabled ? 'disabled' : ''}>Eliminar seleccionados</button><button class="button primary" type="button" data-refresh-records ${state.lists[state.tab].status === 'loading' ? 'disabled' : ''}>Actualizar</button></div>`
}

function tabsView(tab) {
  return `<div class="records-tabs" role="tablist" aria-label="Tipo de registros"><button id="records-tab-active" role="tab" type="button" aria-selected="${tab === 'active'}" aria-controls="records-panel" data-record-tab="active" class="button ${tab === 'active' ? 'primary' : ''}">Activos</button><button id="records-tab-history" role="tab" type="button" aria-selected="${tab === 'history'}" aria-controls="records-panel" data-record-tab="history" class="button ${tab === 'history' ? 'primary' : ''}">Historial</button></div>`
}

export function renderOperationalRecordsView(state) {
  const content = `<section class="dashboard operational-records-page" aria-labelledby="records-title">
    <div class="section-heading"><div><span class="eyebrow">Administración</span><h1 id="records-title">Supervisión de registros.</h1><p>Consulta, corrige o elimina turnos operativos.</p></div></div>
    ${tabsView(state.tab)}${filtersView(state)}${actionsView(state)}
    <div id="records-feedback" class="users-alert ${state.mutation.tone}" role="status" aria-live="polite">${escapeHtml(state.mutation.message)}</div>
    <div id="records-panel" role="tabpanel" aria-labelledby="records-tab-${state.tab}">${listContent(state)}</div>
  </section>${renderRecordDetail(state.detail)}${renderRecordConfirmation(state.confirmation, state.selection.size, state.confirmationError, state.mutation.status === 'loading')}`
  return renderLayout({ user: state.user, activeSection: 'registros', content })
}
