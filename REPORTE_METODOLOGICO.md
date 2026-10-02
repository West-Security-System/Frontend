# Reporte metodológico - Issue F02

## Alcance

Se copió y extendió el cliente de F01 en `v02-issue-F02/`, dejando dentro únicamente la carpeta `west-security-frontend`.

## Implementación

- Se conservó la base Vite, el cliente HTTP y la separación pública/protegida de F01.
- Se creó `src/components/ui.js` con botones, campos etiquetados, tablas, modales, alertas y estados de carga, vacío y error con reintento.
- Se añadió un sistema visual global con variables de color, tipografía, espaciado, foco visible y adaptación responsive.
- Se incluyeron `aria-live`, `role="alert"`, `role="status"`, etiquetas asociadas, tabla semántica y estados con icono y texto, no solo color.

## Registro de commit sugerido

- `feat(front): establecer sistema visual accesible y estados UI F02`

## Pull Request

**Título:** `feat(front): establish accessible frontend visual system`

**Descripción:** Extensión de F01 con componentes reutilizables, sistema visual global, estados de carga/vacío/error, accesibilidad y responsive.

**Referencia:** `Fixes frontend#F02`