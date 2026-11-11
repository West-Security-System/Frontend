import { renderDashboardView } from '../views/admin/DashboardView.js'
import { buildDashboardData } from '../utils/dashboardData.js'
import { loadOperationalDashboard } from '../services/adminDashboardApi.js'

function draw(app, state) {
  app.innerHTML = renderDashboardView(state)
  app.querySelector('#refresh-dashboard, #refresh-dashboard-error')?.addEventListener('click', () => refreshDashboard(app, state))
}

async function refreshDashboard(app, state) {
  state.loading = true
  state.error = ''
  state.data = null
  draw(app, state)
  try {
    state.data = buildDashboardData(await loadOperationalDashboard())
  } catch (error) {
    state.error = error.message || 'No se pudieron cargar los datos operativos.'
  }
  state.loading = false
  draw(app, state)
}

export async function mountAdminDashboard(app, user) {
  await refreshDashboard(app, { user, data: null, loading: true, error: '' })
}
