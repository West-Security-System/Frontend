export function resolveSelectedServiceId(services, selectedId) {
  if (services.some((service) => String(service.id) === String(selectedId))) return String(selectedId)
  return String(services[0]?.id || '')
}

export function setMutationFeedback(state, isUpdate, entity) {
  const action = isUpdate ? 'actualizado' : 'creado'
  state.feedback = `${entity} ${action} correctamente.`
  state.feedbackTone = 'success'
}
