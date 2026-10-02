export function button(label, { variant = 'secondary', type = 'button' } = {}) {
  return `<button class="button ${variant}" type="${type}">${label}</button>`
}

export function formField(id, label, placeholder, type = 'text') {
  return `<div class="field"><label for="${id}">${label}</label><input id="${id}" name="${id}" type="${type}" placeholder="${placeholder}" required /></div>`
}

export function table(rows) {
  return `<div class="table-wrap"><table><caption class="sr-only">Registros de seguridad recientes</caption><thead><tr><th scope="col">Registro</th><th scope="col">Responsable</th><th scope="col">Estado</th></tr></thead><tbody>${rows.map((row) => `<tr><th scope="row">${row.name}</th><td>${row.owner}</td><td><span class="tag ${row.status === 'Pendiente' ? 'warning' : 'success'}"><span aria-hidden="true">●</span> ${row.status}</span></td></tr>`).join('')}</tbody></table></div>`
}

export function modal(id, title, message) {
  return `<div class="modal-backdrop" hidden><section class="modal" id="${id}" role="dialog" aria-modal="true" aria-labelledby="${id}-title"><button class="modal-close" type="button" aria-label="Cerrar ventana">×</button><h2 id="${id}-title">${title}</h2><p>${message}</p>${button('Cerrar', { variant: 'secondary' })}</section></div>`
}

export function alert(message, tone = 'info') {
  return `<div class="alert ${tone}" role="status"><span class="alert-icon" aria-hidden="true">${tone === 'success' ? '✓' : 'i'}</span><span>${message}</span></div>`
}

export function loadingState(title, message) {
  return `<article class="state-card" aria-live="polite"><span class="loader" aria-hidden="true"></span><div><h3>${title}</h3><p>${message}</p></div></article>`
}

export function emptyState(title, message) {
  return `<article class="state-card"><span class="state-icon" aria-hidden="true">○</span><div><h3>${title}</h3><p>${message}</p></div></article>`
}

export function errorState(title, message) {
  return `<article class="state-card error-card" role="alert"><span class="state-icon" aria-hidden="true">!</span><div><h3>${title}</h3><p>${message}</p>${button('Reintentar', { variant: 'text', type: 'button' })}</div></article>`
}