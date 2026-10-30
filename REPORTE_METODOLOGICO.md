## Información de la Issue

- ID y nombre: Frontend F07 — Asignar guardias y mostrar el dashboard operativo.
- Repositorio/carpeta: west-security-frontend, front/v07-issue-F07.
- Commit Git: HEAD consultado antes de editar: 7337ac0 (base, no atribuible a F07).
- Commit sugerido: docs(front): documentar asignaciones y dashboard F07. Para publicar: git rev-parse --short HEAD y git push origin feature/frontend-issue-F07-dashboard-asignaciones.

## Registro Metodológico y Cambios Realizados

F07 amplía F06 con asignación/desasignación de guardias en horarios y un resumen operativo. Servicios encapsulan API; hooks gestionan estado; vistas/componentes muestran asignaciones, actividad y alertas. El selector filtra por rol guardia. Tras mutaciones se actualiza la lista. Dashboard contempla carga, error con reintento y vacío. Comparación F06→F07: nuevos DashboardContent.js, GuardAssignmentsModal.js, adminAssignmentsController.js, adminDashboardController.js, adminAssignmentApi.js, adminDashboardApi.js, dashboardData.js y DashboardView.js; cambios en ScheduleList.js, adminServicesController.js, main.js y style.css; nuevo adminUsersController.js.

- Components: src/components/admin/DashboardContent.js, GuardAssignmentsModal.js; cambio en ScheduleList.js.
- Views: src/views/admin/DashboardView.js; integración src/main.js.
- Services/API: src/services/adminAssignmentApi.js, adminDashboardApi.js.
- Hooks: src/hooks/adminAssignmentsController.js, adminDashboardController.js, adminUsersController.js; cambio en adminServicesController.js.
- Utils: src/utils/dashboardData.js.
- Estilos: src/style.css.
- Pruebas: package.json no declara script de test.

## Verificación de Criterios de Aceptación

- [x] Candidatos de asignación filtrados a guardias.
- [x] Asignación/desasignación integra API y actualiza el estado.
- [x] Errores pasan al estado de UI.
- [x] Dashboard contempla carga, error/reintento, vacío, actividad y alertas.
- [ ] No se documentó prueba manual de navegador ni se ejecutaron pruebas en esta actualización.
- [ ] No se verificó contra API activa; depende de endpoints backend compatibles.

## Evidencia de Funcionamiento y Pruebas

Flujos visibles en código: cargar guardias por horario, asignar/quitar y refrescar; cargar dashboard y presentar actividad, alertas, vacío o error con reintento. Integración mediante adminAssignmentApi.js y adminDashboardApi.js a través de hooks. package.json ofrece npm run build; no ejecutado aquí. No se registran payloads ni códigos HTTP observados en ejecución.
