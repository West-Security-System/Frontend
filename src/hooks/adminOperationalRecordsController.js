import { renderOperationalRecordsView } from '../views/admin/OperationalRecordsView.js'
import { beginRecordAction, confirmRecordAction, createAdminRecordsState, loadRecordFilters, refreshAdminRecords, showRecordDetail } from './useAdminRecords.js'

let activeListeners

function draw(app, state) {
  app.innerHTML = renderOperationalRecordsView(state)
}

function closeDetail(app, state) {
  state.detail = { status: 'idle', record: null, error: '', notFound: false }
  draw(app, state)
}

function cancelConfirmation(app, state) {
  state.confirmation = ''
  state.confirmationError = ''
  draw(app, state)
}

function syncSelectionView(app, state) {
  const records = state.lists[state.tab].records
  app.querySelectorAll('[data-record-select]').forEach((input) => {
    input.checked = state.selection.has(String(input.dataset.recordSelect))
  })
  const selectAll = app.querySelector('#select-all-records')
  if (selectAll) selectAll.checked = Boolean(records.length) && records.every((record) => state.selection.has(String(record.id)))
  app.querySelector('.records-actions span').textContent = `${state.selection.size} seleccionados`
  app.querySelectorAll('[data-record-action]').forEach((button) => {
    button.disabled = !state.selection.size || state.mutation.status === 'loading'
  })
}

function updateSelection(app, state, checkbox) {
  const id = String(checkbox.dataset.recordSelect)
  if (checkbox.checked) state.selection.add(id)
  else state.selection.delete(id)
  syncSelectionView(app, state)
}

function toggleAll(app, state, checkbox) {
  state.selection.clear()
  if (checkbox.checked) state.lists[state.tab].records.forEach((record) => state.selection.add(String(record.id)))
  syncSelectionView(app, state)
}

function clickActions(event, app, state) {
  return [
    ['[data-record-detail]', (target) => showRecordDetail(app, state, target.dataset.recordDetail)],
    ['[data-record-action]', (target) => beginRecordAction(app, state, target.dataset.recordAction)],
    ['[data-confirm-record-action]', () => confirmRecordAction(app, state)],
    ['[data-cancel-record-action]', () => cancelConfirmation(app, state)],
    ['[data-close-record-detail]', () => closeDetail(app, state)],
    ['[data-refresh-records]', () => refreshAdminRecords(app, state)],
  ].find(([selector]) => event.target.closest(selector))
}

async function handleRecordClick(event, app, state) {
  const action = clickActions(event, app, state)
  if (!action) return changeTab(event, app, state)
  return action[1](event.target.closest(action[0]))
}

async function changeTab(event, app, state) {
  const tab = event.target.closest('[data-record-tab]')?.dataset.recordTab
  if (!tab || tab === state.tab) return undefined
  state.tab = tab
  state.detail = { status: 'idle', record: null, error: '', notFound: false }
  return refreshAdminRecords(app, state, tab)
}

function onChange(event, app, state) {
  const target = event.target
  if (target.matches('[data-record-select]')) return updateSelection(app, state, target)
  if (target.matches('#select-all-records')) return toggleAll(app, state, target)
  return undefined
}

function onSubmit(event, app, state) {
  if (!event.target.matches('#records-filters')) return undefined
  event.preventDefault()
  state.filters[state.tab] = Object.fromEntries(new FormData(event.target).entries())
  state.selection.clear()
  return refreshAdminRecords(app, state)
}

async function onClick(event, app, state) {
  await handleRecordClick(event, app, state)
}

async function mountData(app, state) {
  try {
    await loadRecordFilters(state)
  } catch (error) {
    state.mutation = { status: 'error', tone: 'error', message: error.message || 'No se pudieron cargar los filtros.' }
  }
  await refreshAdminRecords(app, state)
}

export async function mountAdminOperationalRecords(app, user) {
  const state = createAdminRecordsState(user)
  state.render = renderOperationalRecordsView
  activeListeners?.abort()
  activeListeners = new AbortController()
  app.addEventListener('click', (event) => onClick(event, app, state), { signal: activeListeners.signal })
  app.addEventListener('change', (event) => onChange(event, app, state), { signal: activeListeners.signal })
  app.addEventListener('submit', (event) => onSubmit(event, app, state), { signal: activeListeners.signal })
  state.lists.active = { status: 'loading', records: [], error: '' }
  draw(app, state)
  await mountData(app, state)
  return state
}
