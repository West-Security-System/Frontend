import { adminRecordsApi } from '../services/adminRecordsApi.js'
import { renderAdminRecordsView } from '../views/admin/RecordsView.js'

let activeListeners

function draw(app, state) {
  app.innerHTML = renderAdminRecordsView(state)
}

function readFilters(form) {
  return { desde: form.elements.desde.value, hasta: form.elements.hasta.value }
}

export async function refreshAdminRecords(state) {
  state.loading = true
  state.error = ''
  draw(state.app, state)
  try {
    state.records = state.active
      ? await adminRecordsApi.listActive(state.filters)
      : await adminRecordsApi.listHistory(state.filters)
    state.selectedIds = []
  } catch (error) {
    state.error = error.message || 'No se pudieron cargar los registros.'
    state.records = []
  } finally {
    state.loading = false
    draw(state.app, state)
  }
}

function bindEvents(app, state) {
  activeListeners?.abort()
  activeListeners = new AbortController()
  const options = { signal: activeListeners.signal }
  app.addEventListener('change', (event) => {
    if (event.target.matches('#records-state')) {
      state.active = event.target.value === 'active'
      refreshAdminRecords(state)
    } else if (event.target.matches('input[name="ids"]')) {
      const id = event.target.value
      state.selectedIds = event.target.checked
        ? [...new Set([...state.selectedIds, id])]
        : state.selectedIds.filter((selected) => selected !== id)
      draw(app, state)
    }
  }, options)
  app.addEventListener('submit', (event) => {
    if (!event.target.matches('#admin-records-filters')) return
    event.preventDefault()
    state.filters = readFilters(event.target)
    refreshAdminRecords(state)
  }, options)
  app.addEventListener('click', async (event) => {
    const closeButton = event.target.closest('[data-close-record]')
    if (closeButton) {
      state.loading = true
      try {
        await adminRecordsApi.close(closeButton.dataset.closeRecord)
        state.feedback = 'Registro cerrado correctamente.'
        await refreshAdminRecords(state)
      } catch (error) {
        state.error = error.message || 'No se pudo cerrar el registro.'
        state.loading = false
        draw(app, state)
      }
      return
    }
    if (event.target.closest('#delete-selected-records')) {
      state.loading = true
      try {
        await adminRecordsApi.remove(state.selectedIds.map(Number))
        state.feedback = 'Registros seleccionados eliminados.'
        await refreshAdminRecords(state)
      } catch (error) {
        state.error = error.message || 'No se pudieron eliminar los registros.'
        state.loading = false
        draw(app, state)
      }
    }
  }, options)
}

export async function mountAdminRecords(app, user) {
  const state = { app, user, records: [], active: true, filters: {}, selectedIds: [], loading: false, error: '', feedback: '' }
  bindEvents(app, state)
  await refreshAdminRecords(state)
}
