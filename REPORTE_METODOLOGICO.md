# Reporte metodológico — Issue 8 / Frontend F08

## Alcance

- Se copió la base de F07 a `front/v08-issue-F08/west-security-frontend/`.
- Los cambios de aplicación, pruebas, configuración y reporte se limitaron a F08.
- Se conservó el proyecto en JavaScript modular y sus capas `components/`, `views/`, `services/`, `hooks/`, `utils/` y `tests/`. El proyecto base usa JavaScript nativo con Vite, no React; por eso `useGeolocation` sigue el patrón de hooks/controladores existente en vez de introducir una dependencia de framework ajena a la arquitectura.
- No se copió el `.env` local de F07. Se conserva únicamente `.env.example`.

## Implementación de Issue 8

- `services/guardScheduleApi.js` encapsula `GET /api/mis-servicios`, la consulta de horarios asignados por servicio y el envío del ingreso a `POST /api/guardias`.
- `hooks/guardScheduleController.js` carga los servicios del guardia, actualiza el selector de horarios al cambiar de servicio, conserva estados de carga/error y prepara el payload de ingreso.
- `hooks/useGeolocation.js` usa `navigator.geolocation` y normaliza latitud, longitud y precisión. Expone estados `idle`, `loading`, `ready`, `permission-denied`, `unavailable` y `unsupported`, con mensajes explicativos y manejo de errores de permiso, timeout e incompatibilidad.
- `views/protected/GuardSchedulesView.js` presenta los selectores dinámicos, un estado vacío accesible para guardias sin asignaciones, los datos de precisión y los estados de ubicación.
- Los botones de captura e ingreso se deshabilitan mientras se obtiene la posición o no hay datos suficientes. La precisión se muestra al guardia y el ingreso envía las coordenadas requeridas por el backend.

## Refactorizaciones de complejidad

Se trabajaron los seis archivos indicados en el anexo de la evaluación:

- `src/components/admin/ScheduleForm.js`: trasladé la preparación de días, título, opciones y campos a `src/utils/scheduleForm.js`; el render del componente queda centrado en el marcado.
- `src/hooks/adminServicesController.js`: separé la selección de acciones por `data-*`, usé mapas para acciones de servicios/horarios y formularios, y aislé el cierre de modales.
- `src/hooks/adminUsersController.js`: extraje el parseo/validación de bloqueos a `src/utils/adminUserData.js`, separé la construcción y persistencia de usuarios, y mantuve retornos tempranos para formularios y acciones delegadas.
- `src/hooks/useAdminServices.js`: moví la lectura del formulario a `src/utils/formData.js` y la selección/feedback a `src/utils/adminServiceState.js`; el alta y edición se despachan mediante mapas de acciones.
- `src/main.js`: extraje normalización, sección activa y corrección de rutas a `src/utils/routes.js`; las rutas privadas y públicas se resuelven mediante mapas en lugar de cadenas largas de condicionales.
- `src/utils/serviceValidation.js`: distribuí las reglas de validación en funciones pequeñas y una lista ordenada de validadores; separé comprobaciones geográficas, duplicados y normalización de horarios.

Los auxiliares extraídos se mantienen en `utils/`. Las funciones de los seis archivos revisados quedaron con responsabilidades y ramas locales acotadas; el cálculo final del criterio Compl y del índice 100/100 depende del evaluador de cátedra, que no está disponible en este workspace.

## Pruebas y evidencias

- [x] 9 archivos de pruebas automatizadas bajo `tests/`.
- [x] 25 pruebas aprobadas con `npm test` y `npm run test:coverage`.
- [x] API: rutas, parámetros codificados, payload de ingreso y respuesta.
- [x] Geolocalización: captura y precisión, espera, permiso denegado, timeout, ubicación no disponible e incompatibilidad.
- [x] Vista: ausencia de asignaciones, selectores dinámicos, escape HTML, precisión visible y botones deshabilitados durante carga.
- [x] Utilidades: rutas/permisos, validaciones de servicios y horarios, duplicados, bloques de disponibilidad y construcción de formularios.
- [x] `npm run build` finalizó correctamente.
- [x] Inspección de `components/` y `views/`: sin llamadas `fetch`/`axios`.
- [x] Inspección de `src/`: sin `console.log`, `console.error` ni `debugger`.

`npm run test:coverage` genera `west-security-frontend/coverage/coverage-summary.json`. La cobertura global de `src/**/*.js` es **35.26% de líneas**, **81.13% de ramas** y **60% de funciones**; el alcance global incluye módulos heredados de F07 y el punto de arranque del navegador. En los módulos de la funcionalidad nueva o auxiliares cubiertos directamente por las pruebas, `guardScheduleApi.js`, `routes.js`, `serviceValidation.js`, `adminUserData.js`, `adminServiceState.js` y `scheduleForm.js` tienen 100% de líneas; `useGeolocation.js`, 95.77%; y `GuardSchedulesView.js`, 98.76%. Estos porcentajes se ofrecen como evidencia del estado medido, no como una cobertura global superior al valor reportado.
