export function readFormValues(form) {
  return Object.fromEntries(new FormData(form).entries())
}

export function readSelectedDays(form) {
  return [...new Set(new FormData(form).getAll('dias').map(Number))].sort((a, b) => a - b)
}

export function mutationAction(id, actions) {
  return id ? actions.update : actions.create
}
