function roleLabel(role) {
  return role === 'admin' ? 'Administrador' : 'Guardia'
}

function statusLabel(user) {
  return user.bloqueado ? 'Bloqueado' : 'Activo'
}

export function renderUsersView({ users = [], currentUser }) {
  const rows = users.map((user) => {
    const isCurrentUser = Number(user.id) === Number(currentUser.id)
    return `
      <tr>
        <th scope="row">${user.username}</th>
        <td><span class="role-badge ${user.rol}">${roleLabel(user.rol)}</span></td>
        <td><span class="tag ${user.bloqueado ? 'warning' : 'success'}"><span aria-hidden="true">●</span> ${statusLabel(user)}</span></td>
        <td class="row-actions">
          <button class="button text" type="button" data-edit-user="${user.id}">Editar</button>
          ${user.rol === 'guardia' ? `<button class="button text" type="button" data-block-user="${user.id}">Bloqueos</button>` : ''}
          <button class="button text danger-text" type="button" data-delete-user="${user.id}" ${isCurrentUser ? 'disabled title="No puedes eliminar tu propia cuenta"' : ''}>${isCurrentUser ? 'Cuenta actual' : 'Eliminar'}</button>
        </td>
      </tr>
    `
  }).join('')

  return `
    <section class="dashboard users-page" aria-labelledby="users-title">
      <div class="section-heading">
        <div><span class="eyebrow">Administración</span><h1 id="users-title">Usuarios.</h1><p>Gestiona accesos, roles y disponibilidad del equipo.</p></div>
        <button class="button primary" id="new-user-button" type="button">Añadir usuario</button>
      </div>
      <div id="users-alert" class="users-alert" role="status" aria-live="polite"></div>
      <section class="surface" aria-labelledby="users-table-title">
        <div class="surface-heading"><div><span class="eyebrow">Directorio</span><h2 id="users-table-title">Cuentas registradas</h2></div><span class="record-count">${users.length} ${users.length === 1 ? 'cuenta' : 'cuentas'}</span></div>
        ${users.length ? `<div class="table-wrap"><table><caption class="sr-only">Usuarios registrados</caption><thead><tr><th scope="col">Usuario</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col"><span class="sr-only">Acciones</span></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty-users"><span class="state-icon" aria-hidden="true">○</span><h3>No hay usuarios registrados</h3><p>Crea la primera cuenta desde el botón Añadir usuario.</p></div>'}
      </section>
    </section>
    ${renderUserModal()}
    ${renderBlocksModal()}
  `
}

function renderUserModal() {
  return `
    <div class="modal-backdrop" id="user-modal" hidden>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <button class="modal-close" type="button" data-close-modal="user-modal" aria-label="Cerrar formulario">×</button>
        <span class="eyebrow">Cuenta</span><h2 id="user-modal-title">Añadir usuario</h2>
        <form id="user-form" class="admin-form" novalidate>
          <input type="hidden" name="id" />
          <div class="field"><label for="user-username">Nombre de usuario</label><input id="user-username" name="username" required autocomplete="username" /></div>
          <div class="field"><label for="user-password">Contraseña <span class="field-hint">(obligatoria al crear)</span></label><input id="user-password" name="password" type="password" autocomplete="new-password" /></div>
          <div class="field"><label for="user-role">Rol</label><select id="user-role" name="rol" required><option value="guardia">Guardia</option><option value="admin">Administrador</option></select></div>
          <label class="checkbox-field"><input name="bloqueado" type="checkbox" /> <span>Cuenta bloqueada</span></label>
          <p id="user-form-error" class="form-error" role="alert" aria-live="polite"></p>
          <div class="form-actions"><button class="button primary" type="submit">Guardar usuario</button><button class="button" type="button" data-close-modal="user-modal">Cancelar</button></div>
        </form>
      </section>
    </div>
  `
}

function renderBlocksModal() {
  return `
    <div class="modal-backdrop" id="blocks-modal" hidden>
      <section class="modal blocks-modal" role="dialog" aria-modal="true" aria-labelledby="blocks-modal-title">
        <button class="modal-close" type="button" data-close-modal="blocks-modal" aria-label="Cerrar bloqueos">×</button>
        <span class="eyebrow">Disponibilidad</span><h2 id="blocks-modal-title">Días no disponibles</h2><p id="blocks-user-label"></p>
        <form id="blocks-form" class="admin-form" novalidate>
          <input type="hidden" name="userId" />
          <div id="block-entries" class="block-entries"></div>
          <button class="button" id="add-block-button" type="button">Añadir día o rango</button>
          <p id="blocks-form-error" class="form-error" role="alert" aria-live="polite"></p>
          <div class="form-actions"><button class="button primary" type="submit">Guardar disponibilidad</button><button class="button" type="button" data-close-modal="blocks-modal">Cancelar</button></div>
        </form>
      </section>
    </div>
  `
}

export function renderBlockEntry(index, entry = { tipo: 'fecha', fecha: '', fecha_inicio: '', fecha_fin: '', motivo: '' }) {
  return `<fieldset class="block-entry" data-block-index="${index}"><legend>Bloqueo ${index + 1}</legend><button class="button text danger-text remove-block" type="button" aria-label="Eliminar bloqueo ${index + 1}">Quitar</button><div class="field"><label for="block-type-${index}">Tipo</label><select id="block-type-${index}" name="tipo" class="block-type"><option value="fecha" ${entry.tipo === 'fecha' ? 'selected' : ''}>Día concreto</option><option value="rango" ${entry.tipo === 'rango' ? 'selected' : ''}>Rango de días</option></select></div><div class="field block-date-single" ${entry.tipo === 'rango' ? 'hidden' : ''}><label for="block-date-${index}">Fecha</label><input id="block-date-${index}" name="fecha" type="date" value="${entry.fecha || ''}" /></div><div class="block-range" ${entry.tipo !== 'rango' ? 'hidden' : ''}><div class="field"><label for="block-start-${index}">Desde</label><input id="block-start-${index}" name="fecha_inicio" type="date" value="${entry.fecha_inicio || ''}" /></div><div class="field"><label for="block-end-${index}">Hasta</label><input id="block-end-${index}" name="fecha_fin" type="date" value="${entry.fecha_fin || ''}" /></div></div><div class="field"><label for="block-reason-${index}">Motivo</label><input id="block-reason-${index}" name="motivo" value="${entry.motivo || ''}" placeholder="Indisponibilidad" /></div></fieldset>`
}