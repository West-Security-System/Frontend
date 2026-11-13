import { guardActivityApi } from '../services/guardActivityApi.js'
import { belongsToUser, filterActivity } from '../utils/activityHistory.js'
import { renderGuardHistoryView } from '../views/protected/GuardHistoryView.js'

let activeListeners

function visibleItems(items, userId) {
  return items.filter((item) => belongsToUser(item, userId))
}

function draw(app, state) {
  const records = filterActivity(state.records, state.filters)
  app.innerHTML = renderGuardHistoryView({ ...state, records })
}

export async function refreshGuardHistory(state, filters = state.filters) {
  state.filters = filters
  state.loading = true
  state.error = ''
  try {
    const [records, notifications] = await Promise.all([
      guardActivityApi.listRecords(filters),
      guardActivityApi.listNotifications(),
    ])
    state.records = visibleItems(records, state.user.id)
    state.notifications = visibleItems(notifications, state.user.id)
  } catch (error) {
    state.error = error.message || 'No se pudo cargar tu historial.'
    state.records = []
    state.notifications = []
  } finally {
    state.loading = false
  }
}

function readFilters(form) {
  return {
    desde: form.elements.desde.value,
    hasta: form.elements.hasta.value,
    estado: form.elements.estado.value,
  }
}

async function submitFilters(event, app, state) {
  event.preventDefault()
  state.filters = readFilters(event.target)
  draw(app, { ...state, loading: true })
  await refreshGuardHistory(state, state.filters)
  draw(app, state)
}

async function markRead(app, state) {
  try {
    await guardActivityApi.markNotificationsRead()
    state.notifications = state.notifications.map((item) => ({ ...item, leido: true }))
    state.error = ''
  } catch (error) {
    state.error = error.message || 'No se pudieron marcar los avisos como leídos.'
  }
  draw(app, state)
}

function bindEvents(app, state) {
  activeListeners?.abort()
  activeListeners = new AbortController()
  const options = { signal: activeListeners.signal }
  app.addEventListener('submit', (event) => submitFilters(event, app, state), options)
  app.addEventListener('click', (event) => {
    if (event.target.closest('#mark-notifications-read')) markRead(app, state)
    if (event.target.closest('#refresh-activity, #retry-activity')) mountGuardHistory(app, state.user)
  }, options)
}

export async function mountGuardHistory(app, user) {
  const state = { user, records: [], notifications: [], filters: {}, loading: true, error: '' }
  bindEvents(app, state)
  draw(app, state)
  await refreshGuardHistory(state)
  draw(app, state)
}
