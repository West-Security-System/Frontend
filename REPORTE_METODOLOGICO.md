# Reporte metodológico - Issue F01

## Alcance

Se creó la base del cliente web `west-security-frontend` con Vite, dejando dentro de `v01-issue-F01/` únicamente esta carpeta.

## Implementación

- Se configuró `package.json` con los scripts `dev`, `build` y `preview`.
- Se centralizó el acceso HTTP en `src/api/httpClient.js`, usando `fetch`, `credentials: 'include'` y `VITE_API_BASE_URL`.
- Se unificó el timeout, el error de red y los mensajes para los estados 401, 403, 404, 409, 422 y 500 mediante `ApiError`.
- Se separaron las vistas públicas y protegidas en `src/views/public/` y `src/views/protected/`.
- Se agregó `.env.example` para documentar la configuración de API y timeout.

## Registro de commit sugerido

- `feat(front): agregar cliente HTTP y separación de vistas F01`

## Pull Request

**Título:** `feat(front): initialize protected client foundation`

**Descripción:** Base inicial del frontend con transporte HTTP centralizado, manejo consistente de errores y separación de superficies públicas/protegidas.

**Referencia:** `Fixes frontend#F01`