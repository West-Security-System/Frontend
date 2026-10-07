# Reporte metodológico - Issue F04

## Alcance

Se copió y extendió el cliente de F03 en `v04-issue-F04/`, dejando dentro únicamente la carpeta `west-security-frontend`.

## Implementación

- Se conservó la autenticación, el cliente HTTP y el sistema visual accesible de F03.
- Se creó `src/components/Layout.js` con encabezado, navegación principal, sección activa, datos de usuario y cierre de sesión.
- La navegación se filtra por `user.rol`: las rutas y opciones administrativas no se renderizan para `guardia`, y el router redirige intentos directos a rutas no autorizadas.
- El layout usa navegación horizontal desplazable en móvil y panel lateral en escritorio.

## Registro de commit sugerido

- `feat(front): crear layout protegido y navegación por rol F04`

## Pull Request

**Título:** `feat(front): add responsive protected administration layout`

**Descripción:** Extensión de F03 con layout compartido, navegación contextual, identidad de usuario, logout y protección visual/routing para usuarios guardia.

**Referencia:** `Fixes frontend#F04`