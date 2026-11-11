const activeRoutes = {
  admin: [
    { prefix: 'admin/usuarios', section: 'usuarios' },
    { prefix: 'admin/locales', section: 'locales' },
  ],
  guardia: [
    { prefix: 'guardia/horarios', section: 'horarios' },
    { prefix: 'guardia', section: 'horarios' },
  ],
}

export function routeName(hash) {
  return hash.replace(/^#\/?/, '') || 'home'
}

export function roleRoute(user) {
  return user?.rol === 'admin' ? 'admin' : 'guardia/horarios'
}

export function activeSection(route, user) {
  const match = (activeRoutes[user.rol] || []).find(({ prefix }) => route.startsWith(prefix))
  return match?.section || user.rol
}

export function isPrivateRoute(route) {
  return ['admin', 'guardia', 'app'].includes(route)
    || route.startsWith('admin/')
    || route.startsWith('guardia/')
}

export function routeCorrection(route, user) {
  if (!user && isPrivateRoute(route)) return 'login'
  if (user && ['login', 'home', 'app'].includes(route)) return roleRoute(user)
  const deniedPrefix = { admin: 'guardia', guardia: 'admin' }[user?.rol]
  if (deniedPrefix && route.startsWith(deniedPrefix)) return roleRoute(user)
  return ''
}
