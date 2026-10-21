# Reporte metodológico - Issue F06

## Alcance

Se extiende el cliente de F05 dentro de `v06-issue-F06/west-security-frontend` para administrar servicios, coordenadas y horarios.

## Implementación

- Se implementó el CRUD de servicios con validación de nombre único y rangos de latitud y longitud.
- Se muestran las coordenadas registradas y se solicitan confirmaciones para eliminar servicios y horarios.
- Se agregó la selección de servicio y la consulta de horarios filtrada por `servicio_id`.
- Se implementó el CRUD de horarios con días de semana, hora inicial, hora final, capacidad y detección de duplicados.
- Se centralizaron las llamadas HTTP en `src/services`, validaciones y utilidades en `src/utils`, estado y controladores en `src/hooks`, y UI en `src/components` y `src/views`.
- La interfaz contempla listas vacías y errores de carga, validación y conflictos del servidor.

## Commit correspondiente

`feat(front): gestionar servicios y horarios F06`

## Pull Request

**Título:** `feat(front): manage services coordinates and schedules`

**Descripción:** Extensión de F05 con CRUD de servicios, coordenadas y horarios, selector de servicio, validaciones y estados de error/vacío.

**Referencia:** `Fixes frontend#F06`
