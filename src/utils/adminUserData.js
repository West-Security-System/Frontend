const apiMessages = {
  409: (error) => `Conflicto: ${error.message}`,
  422: (error) => `Validación: ${error.message}`,
  default: (error) => error.message || 'No se pudo completar la operación.',
}

const blockReaders = {
  fecha: (block, entry) => ({ ...block, fecha: entry.querySelector('[name="fecha"]').value }),
  rango: (block, entry) => ({
    ...block,
    fecha_inicio: entry.querySelector('[name="fecha_inicio"]').value,
    fecha_fin: entry.querySelector('[name="fecha_fin"]').value,
  }),
}

export function apiMessage(error) {
  return (apiMessages[error.status] || apiMessages.default)(error)
}

export function readBlocks(entries) {
  return [...entries.querySelectorAll('.block-entry')].map((entry) => {
    const tipo = entry.querySelector('[name="tipo"]').value
    const base = { tipo, motivo: entry.querySelector('[name="motivo"]').value.trim() }
    return (blockReaders[tipo] || ((block) => block))(base, entry)
  })
}

function hasMissingDate(block) {
  const requiredDates = block.tipo === 'fecha' ? [block.fecha] : [block.fecha_inicio, block.fecha_fin]
  return requiredDates.some((date) => !date)
}

export function invalidBlocks(blocks) {
  return blocks.some(hasMissingDate)
}
