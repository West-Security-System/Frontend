export function parseMonthlyAmount(value) {
  const text = String(value ?? '').trim()
  if (!text) return { value: null, error: 'Ingresa un valor para este mes.' }
  const amount = Number(text)
  if (!Number.isFinite(amount) || amount < 0) {
    return { value: null, error: 'El valor debe ser un número válido mayor o igual a cero.' }
  }
  return { value: amount, error: '' }
}
