export function shiftMonth(month, year, offset) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1 + Number(offset), 1))
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() }
}

export function formatMonth(month, year) {
  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(year), Number(month) - 1, 1)))
}

export function orderedCalendarDays(days = []) {
  return [...days]
    .sort((left, right) => left.fecha.localeCompare(right.fecha))
    .map((day) => ({
      ...day,
      registros: [...(day.registros || [])].sort((left, right) => (
        Date.parse(left.hora_ingreso) - Date.parse(right.hora_ingreso)
      )),
    }))
}
