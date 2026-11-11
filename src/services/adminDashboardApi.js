import { httpClient } from '../api/httpClient.js'
import { adminAssignmentApi } from './adminAssignmentApi.js'
import { adminServiceApi } from './adminServiceApi.js'
import { adminUserApi } from './adminUserApi.js'

export async function loadOperationalDashboard() {
  const [usersResult, servicesResult, schedulesResult] = await Promise.all([
    adminUserApi.list(), adminServiceApi.listServices(), httpClient.get('/admin/horarios'),
  ])
  const schedules = schedulesResult?.horarios || []
  const assignments = await Promise.all(schedules.map(async (schedule) => ({
    schedule, items: await adminAssignmentApi.listForSchedule(schedule.id),
  })))
  return { users: usersResult?.usuarios || [], services: servicesResult?.locales || [], schedules, assignments }
}
