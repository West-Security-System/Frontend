# Reporte metodológico - Issue F05

## Alcance

Se extiende el cliente de F04 con administración de cuentas y disponibilidad de guardias dentro de `v05-issue-F05/west-security-frontend`.

## Implementación

- Se incorporó el directorio de usuarios con roles y estado de bloqueo.
- Se permite crear, editar y eliminar usuarios; la cuenta actualmente autenticada no se puede eliminar desde la interfaz.
- Se añadieron formularios para definir y quitar bloqueos por fecha o rango para guardias.
- La vista informa estados vacíos y errores de carga, y vuelve a cargar los datos después de guardar cambios.

## Commit correspondiente

`feat(front): administrar usuarios y disponibilidad F05`

## Pull Request

**Título:** `feat(front): manage users and guard availability`

**Descripción:** Extensión de F04 con CRUD de usuarios, asignación de roles, bloqueo de cuentas y gestión de días/rangos no disponibles para guardias.

**Referencia:** `Fixes frontend#F05`