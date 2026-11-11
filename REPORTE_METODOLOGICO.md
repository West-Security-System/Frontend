# Reporte metodológico — Issue 9 / Frontend F09

## Alcance y arquitectura

- Se copió F08 a `front/v09-issue-F09/west-security-frontend/` y se limitaron a F09 todos los cambios de código, pruebas y documentación.
- Se excluyeron del copiado el `.env` local, `node_modules`, `coverage/` y `dist/`; solo se conserva `.env.example`.
- Se mantuvo la arquitectura existente de JavaScript modular con Vite: `components/`, `views/`, `services/`, `hooks/`, `utils/` y `tests/`. No se incorporó un framework nuevo.
- Las vistas y componentes no hacen solicitudes HTTP. `services/guardScheduleApi.js` delega el acceso al cliente HTTP compartido.

## Implementación de Issue 9

- Se creó la ruta privada de guardia `#/guardia/egreso`, con enlace visible en la navegación.
- `views/protected/GuardExitView.js` integra el formulario de salida dentro del layout y marca activa la sección de egreso.
- `components/guard/ShiftExitForm.js` presenta el campo opcional de observaciones/novedades (máximo 2.000 caracteres), el estado de geolocalización y la confirmación.
- `hooks/guardExitController.js` solicita una ubicación GPS nueva al confirmar, prepara las coordenadas y observaciones, y delega el cierre a `guardScheduleApi.registerExit`.
- El formulario evita reenvíos durante la espera de GPS y mientras procesa la respuesta; luego de éxito impide un segundo cierre.
- Los errores del servidor se presentan con mensajes específicos para salida fuera de radio (403), ausencia de turno activo (404), cierre concurrente (409) y sesión vencida (401). Los errores de permiso GPS e incompatibilidad se muestran mediante el hook existente `useGeolocation.js`.
- El servicio envía `latitud`, `longitud` y `observaciones` a `POST /api/guardias/egreso`. La validación del turno activo y del radio de 100 metros corresponde al backend.

## Pruebas y evidencias

- [x] 35 pruebas aprobadas en 11 archivos de pruebas.
- [x] `npm run test:coverage` genera `west-security-frontend/coverage/coverage-summary.json`.
- [x] Cobertura global de `src/**/*.js`: **40,64% de líneas/sentencias**, **82,92% de ramas** y **63,77% de funciones**. Incluye módulos heredados de F08.
- [x] Cobertura de los módulos nuevos: `guardExitController.js` 100% de líneas; `GuardExitView.js` 100%; `ShiftExitForm.js` 100%; `guardScheduleApi.js` 100%.
- [x] Se probaron éxito, geolocalización pendiente, permiso denegado, doble envío, radio excedido, turno inexistente y cierre concurrente.
- [x] `npm run build` finalizó correctamente.
- [x] `node --check` pasó en los archivos JavaScript de `src/` y `tests/`.
- [x] Inspección estática: sin `fetch`/`axios` en `views/` o `components/`, y sin `console.log`, `console.error` ni `debugger` en `src/`.
- [x] El componente del formulario tiene 40 líneas, por debajo del límite de 120.

## Contrato de observaciones

El cliente recoge y envía `observaciones` junto con las coordenadas. El backend de la versión disponible para esta entrega debe aceptar y persistir ese campo para que las novedades queden almacenadas junto al registro; no se modificó el backend porque el alcance solicitado prohíbe cambios fuera de F09.

## Checklist de aceptación

- [x] Flujo de egreso accesible desde la navegación privada de guardia.
- [x] Coordenadas capturadas al confirmar mediante el hook de geolocalización existente.
- [x] Observaciones editables y enviadas junto con la solicitud de egreso.
- [x] Mensaje de espera GPS, bloqueo de doble clic, confirmación exitosa y errores de egreso.
- [x] Lógica HTTP confinada a `services/`.
- [x] Suite automatizada activa y artefacto de cobertura generado.

El build, las pruebas y las métricas indicadas se verificaron localmente. La certificación de Calidad 100/100 o de complejidad por una herramienta externa no está disponible en este entorno y no se declara como resultado certificado.
