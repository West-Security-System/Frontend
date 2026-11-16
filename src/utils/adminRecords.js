export function recordTimestamp(record) {
  const value = record.hora_ingreso || record.created_at || ''
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function newestRecords(records = []) {
  return [...records].sort((first, second) => recordTimestamp(second) - recordTimestamp(first)
    || Number(second.id) - Number(first.id))
}

export function recordList(data) {
  if (Array.isArray(data)) return data
  return Array.isArray(data?.registros) ? data.registros : []
}

export function currentLocalDateTime() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function localDateTimeToIso(value) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : ''
}

export function selectedIds(selection) {
  return [...selection].map(Number).filter((id) => Number.isSafeInteger(id) && id > 0)
}
