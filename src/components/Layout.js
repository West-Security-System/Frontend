const navigationByRole = {
  admin: [
    { href: '#/admin', label: 'Resumen', key: 'admin' },
    { href: '#/admin/usuarios', label: 'Usuarios', key: 'usuarios' },
    { href: '#/admin/locales', label: 'Locales y servicios', key: 'locales' },
  ],
  guardia: [
    { href: '#/guardia', label: 'Mi actividad', key: 'guardia' },
    { href: '#/guardia/horarios', label: 'Mis horarios', key: 'horarios' },
  ],
}

export function renderLayout({ user, activeSection, content }) {
  const links = navigationByRole[user.rol] || navigationByRole.guardia
  const roleLabel = user.rol === 'admin' ? 'Administración' : 'Operaciones de guardia'
  return `
    <main class="app-shell">
      <header class="app-header">
        <a class="brand" href="#/${user.rol}">WEST SECURITY</a>
        <div class="user-menu">
          <div class="user-details"><span class="user-name">${user.username}</span><span class="user-role">${roleLabel}</span></div>
          <button class="button text" id="logout-button" type="button">Cerrar sesión</button>
        </div>
      </header>
      <div class="shell-body">
        <nav class="main-nav" aria-label="Navegación principal">
          <span class="nav-label">Secciones</span>
          <div class="nav-links">${links.map((link) => `<a class="nav-link ${activeSection === link.key ? 'active' : ''}" href="${link.href}" ${activeSection === link.key ? 'aria-current="page"' : ''}>${link.label}</a>`).join('')}</div>
        </nav>
        <section class="shell-content" aria-label="Contenido principal">${content}</section>
      </div>
    </main>
  `
}