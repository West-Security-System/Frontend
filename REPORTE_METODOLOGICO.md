# Reporte Metodológico: Frontend F08

## Alcance

- Issue: preparar servicios asignados y obtener geolocalización real para el guardia autenticado.
- Proyecto: `front/v08-issue-F08/west-security-frontend`.
- F08 ya contenía el snapshot de F07 más una primera implementación del flujo; se conservó y completó ese trabajo dentro de F08.
- Aplicación existente: JavaScript ESM y Vite, sin framework de componentes. El hook encapsula estado en una fábrica reutilizable compatible con el ciclo de renderizado actual.

## Arquitectura

- Componentes: `src/components/guard/ServiceScheduleSelector.js` y `LocationCapture.js` renderizan selectores y estados de ubicación.
- Vista: `src/views/guard/AssignedServicesView.js` compone el flujo sin llamadas HTTP.
- Servicios: `src/services/misServicios.js` consume servicios asignados y horarios mediante el `httpClient` compartido.
- Hooks: `src/hooks/useGeolocation.js` encapsula captura, estados, errores y prevención de solicitudes simultáneas; `guardServicesController.js` coordina la vista y las consultas.
- Utilidades y API: `src/utils/html.js` escapa texto de usuario; `src/api/httpClient.js` concentra `fetch`, credenciales de sesión y errores.
- Pruebas: `tests/misServicios.test.jsx`, `tests/useGeolocation.test.jsx` y `tests/guardViews.test.jsx`.

## Implementación

`listMisServicios()` llama `GET /mis-servicios` sin enviar un identificador de guardia; la sesión autenticada determina las asignaciones. `listHorariosServicio()` consulta horarios del servicio seleccionado y codifica el nombre en la ruta. Los estados de carga, error, horarios vacíos y ausencia de asignaciones se presentan en la vista. Las vistas y componentes no usan `fetch` ni `axios`.

`useGeolocation()` captura latitud, longitud y precisión con `navigator.geolocation.getCurrentPosition`, alta precisión, sin valores simulados. Expone espera, éxito y error; contempla permiso denegado con instrucciones, posición no disponible, timeout y navegador incompatible. Evita capturas concurrentes y descarta resultados tardíos después de reset. El control de captura se deshabilita durante la solicitud y continuar requiere horario y ubicación.

`.env` y `coverage/` se excluyen mediante `.gitignore`; no se añaden secretos al código fuente.

## Verificación

- [x] La consulta de servicios asignados utiliza el cliente HTTP común y preserva la sesión autenticada.
- [x] El servicio seleccionado determina los horarios; se cubren estados de carga, error y ausencia de resultados.
- [x] Latitud, longitud y precisión se obtienen del navegador; no se simulan coordenadas.
- [x] Denegación de permisos muestra instrucciones y permite reintentar; el navegador incompatible muestra un mensaje explícito.
- [x] La captura bloquea solicitudes simultáneas y el botón se deshabilita durante la espera.
- [x] Sin HTTP en `views/` o `components/`; sin `console.log`, `console.error` ni `debugger` en el código de aplicación.
- [x] `npm audit`: 0 vulnerabilidades.
- [x] `npm run test:coverage`: 3 archivos de prueba, 16 tests aprobados.
- [x] `npm run build`: build de producción completado.

## Cobertura

Vitest usa el proveedor V8 e incluye el servicio, hook, selector, vista y componente de captura. El resumen registra 100% en líneas, sentencias y funciones, y 92,77% en ramas, superando el umbral mínimo de 80%.

Comandos: `npm test`, `npm run test:coverage`, `npm run build`.
Artefacto: `coverage/coverage-summary.json`.
