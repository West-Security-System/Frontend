export function buildDashboardData({ users, services, schedules, assignments }) {
  const activeGuards = users.filter((user) => user.rol === 'guardia' && !user.bloqueado)
  const serviceNames = new Map(services.map((service) => [Number(service.id), service.nombre]))
  const scheduleAssignments = new Map(assignments.map(({ schedule, items }) => [Number(schedule.id), items]))
  const records = assignments.flatMap(({ schedule, items }) => items.map((item) => ({
    id: item.id,
    guardia: item.username,
    servicio: serviceNames.get(Number(schedule.servicio_id)) || 'Servicio sin nombre',
    fecha: item.created_at,
    estado: 'Asignado',
  }))).sort((first, second) => new Date(second.fecha) - new Date(first.fecha)).slice(0, 8)
  const alerts = schedules.flatMap((schedule) => getScheduleAlerts(schedule, scheduleAssignments.get(Number(schedule.id)) || [], serviceNames))
  return { activeGuards, records, alerts, scheduleCount: schedules.length, serviceCount: services.length }
}

function getScheduleAlerts(schedule, assignments, serviceNames) {
  const service = serviceNames.get(Number(schedule.servicio_id)) || 'Servicio'
  const label = `${service} · ${schedule.hora_inicio}–${schedule.hora_fin}`
  if (!assignments.length) return [{ type: 'warning', title: 'Horario sin guardias', detail: label }]
  if (assignments.length >= Number(schedule.capacidad)) return [{ type: 'notice', title: 'Capacidad completa', detail: label }]
  return []
}
