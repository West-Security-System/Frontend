import { adminAssignmentApi } from '../services/adminAssignmentApi.js'
import { renderAssignmentsModal } from '../components/admin/GuardAssignmentsModal.js'

function drawModal(app, data, error = '', loading = false) {
  app.querySelector('#assignments-modal')?.remove()
  app.insertAdjacentHTML('beforeend', renderAssignmentsModal({ ...data, error, loading }))
  const modal = app.querySelector('#assignments-modal')
  modal.querySelectorAll('[data-close-assignments]').forEach((button) => button.addEventListener('click', () => modal.remove()))
}

async function loadAssignments(schedule, service) {
  const [guards, assignments] = await Promise.all([
    adminAssignmentApi.listGuards(), adminAssignmentApi.listForSchedule(schedule.id),
  ])
  return { schedule, service, guards, assignments }
}

export async function openAssignmentsModal(app, schedule, service) {
  const initial = { schedule, service, guards: [], assignments: [] }
  drawModal(app, initial, '', true)
  try {
    const loaded = await loadAssignments(schedule, service)
    drawModal(app, loaded)
    bindChangeRefresh(app, loaded)
  } catch (error) {
    drawModal(app, initial, error.message)
  }
}

function bindChangeRefresh(app, data) {
  const modal = app.querySelector('#assignments-modal')
  modal.querySelector('#assignment-form')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const guardId = new FormData(event.currentTarget).get('usuario_id')
    if (!guardId) return modal.querySelector('#assignment-error').textContent = 'Selecciona una guardia para continuar.'
    await changeAssignment(app, data, () => adminAssignmentApi.assign(data.schedule.id, guardId))
  })
  modal.querySelectorAll('[data-unassign-guard]').forEach((button) => button.addEventListener('click', () => changeAssignment(app, data, () => adminAssignmentApi.unassign(data.schedule.id, button.dataset.unassignGuard))))
}

async function changeAssignment(app, data, action) {
  try {
    await action()
    const latest = await loadAssignments(data.schedule, data.service)
    drawModal(app, latest)
    bindChangeRefresh(app, latest)
  } catch (error) {
    app.querySelector('#assignment-error').textContent = error.message
  }
}
