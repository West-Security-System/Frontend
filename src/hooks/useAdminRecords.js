import { adminOperationalRecordsApi } from '../services/adminOperationalRecordsApi.js'
import { adminServiceApi } from '../services/adminServiceApi.js'
import { adminUserApi } from '../services/adminUserApi.js'
import { localDateTimeToIso, newestRecords, recordList, selectedIds } from '../utils/adminRecords.js'

function emptyList() {
  return { status: 'idle', records: [], error: '' }
}

export function createAdminRecordsState(user) {
  return {
    user, tab: 'active', filters: {
      active: { usuario_id: '', local_id: '', desde: '', hasta: '' },
      history: { usuario_id: '', local_id: '', estado: '', desde: '', hasta: '' },
    },
    lists: { active: emptyList(), history: emptyList() }, requestIds: { active: 0, history: 0 },
    selection: new Set(), users: [], services: [], detail: { status: 'idle', record: null, error: '', notFound: false },
    confirmation: '', confirmationError: '', mutation: { status: 'idle', tone: '', message: '' },
  }
}

function filtersFor(state, tab) {
  return { ...state.filters[tab] }
}

function responseRecords(response) {
  const records = newestRecords(recordList(response))
  return { status: records.length ? 'success' : 'empty', records, error: '' }
}

export async function refreshAdminRecords(app, state, tab = state.tab) {
  const requestId = ++state.requestIds[tab]
  state.lists[tab] = { status: 'loading', records: [], error: '' }
  state.selection.clear()
  draw(app, state)
  try {
    const filters = filtersFor(state, tab)
    const response = tab === 'active'
      ? await adminOperationalRecordsApi.listActive(filters)
      : await adminOperationalRecordsApi.listHistory(filters)
    if (requestId !== state.requestIds[tab]) return
    state.lists[tab] = responseRecords(response)
  } catch (error) {
    if (requestId !== state.requestIds[tab]) return
    state.lists[tab] = { status: 'error', records: [], error: error.message || 'No se pudieron cargar los registros.' }
  }
  draw(app, state)
}

function draw(app, state) {
  app.innerHTML = state.render(state)
}

export async function loadRecordFilters(state) {
  const [users, services] = await Promise.all([adminUserApi.list(), adminServiceApi.listServices()])
  state.users = users?.usuarios || []
  state.services = services?.locales || []
}

export async function showRecordDetail(app, state, id) {
  state.detail = { status: 'loading', record: null, error: '', notFound: false }
  draw(app, state)
  try {
    const result = await adminOperationalRecordsApi.getDetail(id)
    state.detail = { status: 'success', record: result?.registro || result, error: '', notFound: false }
  } catch (error) {
    state.detail = { status: 'error', record: null, error: error.message, notFound: error.status === 404 }
  }
  draw(app, state)
  app.querySelector('[data-close-record-detail]')?.focus()
}

export function beginRecordAction(app, state, action) {
  if (!['close', 'delete'].includes(action) || !selectedIds(state.selection).length) return false
  state.confirmation = action
  state.confirmationError = ''
  draw(app, state)
  app.querySelector('[data-confirm-record-action]')?.focus()
  return true
}

function mutationMessage(action, result) {
  const complete = action === 'close'
  const changed = result?.cantidad_cerrada ?? result?.cantidad_eliminada ?? 0
  const missing = result?.ids_no_encontrados || []
  const rejected = result?.ids_no_abiertos || []
  const status = missing.length || rejected.length ? 'error' : 'success'
  const message = complete
    ? `${changed} registro(s) completado(s). ${missing.length} inexistente(s), ${rejected.length} no abierto(s).`
    : `${changed} registro(s) eliminado(s). ${missing.length} inexistente(s).`
  return { status, tone: status, message }
}

export async function confirmRecordAction(app, state) {
  const ids = selectedIds(state.selection)
  if (!ids.length || !state.confirmation) return false
  const action = state.confirmation
  const exitTime = action === 'close' ? localDateTimeToIso(app.querySelector('#record-exit-time')?.value) : ''
  if (action === 'close' && !exitTime) {
    state.confirmationError = 'Indica una hora de egreso válida.'
    draw(app, state)
    return false
  }
  state.mutation = { status: 'loading', tone: '', message: 'Guardando cambios…' }
  draw(app, state)
  try {
    const result = action === 'close'
      ? await adminOperationalRecordsApi.close(ids, exitTime)
      : await adminOperationalRecordsApi.remove(ids)
    state.mutation = mutationMessage(action, result)
  } catch (error) {
    state.mutation = { status: 'error', tone: 'error', message: error.message || 'La operación fue rechazada por el servidor.' }
  }
  state.confirmation = ''
  state.confirmationError = ''
  state.selection.clear()
  await refreshAdminRecords(app, state)
  return state.mutation.status !== 'error'
}
