# Reporte metodológico - Issue F03

## Alcance

Se copió y extendió el cliente de F02 en `v03-issue-F03/`, dejando dentro únicamente la carpeta `west-security-frontend`.

## Implementación

- Se conservó la base Vite, el cliente HTTP y el sistema visual accesible de F02.
- Se implementó `src/auth/session.js` para login, carga de sesión mediante `GET /api/me` y logout mediante `POST /api/logout`.
- Se creó el formulario de login con validación previa, estado de envío y mensajes de error.
- Se protegieron las rutas y se añadió redirección dinámica a `admin` o `guardia`, invalidando el historial al detectar una sesión 401 inválida.

## Registro de commit sugerido

- `feat(front): implementar autenticación y rutas protegidas F03`

## Pull Request

**Título:** `feat(front): add role-based authentication flow`

**Descripción:** Extensión de F02 con login, persistencia de sesión, logout y navegación protegida por rol.

**Referencia:** `Fixes frontend#F03`