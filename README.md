<!-- calidad:inicio -->
![Calidad](https://img.shields.io/badge/Calidad-100%2F100-green) ![Aprobado](https://img.shields.io/badge/Aprobado-SI-green) ![Cumple](https://img.shields.io/badge/Cumple-15%2F15-green) ![Duplicación](https://img.shields.io/badge/Duplicaci%C3%B3n-0.9%25-green) ![SEC](https://img.shields.io/badge/SEC-0-green) ![SQL](https://img.shields.io/badge/SQL-0-green) ![DBG](https://img.shields.io/badge/DBG-0-green) ![Capas](https://img.shields.io/badge/Capas-3-green) ![Tests](https://img.shields.io/badge/Tests-22-green) ![Cob](https://img.shields.io/badge/Cob-98.9%25-green) ![Vistas](https://img.shields.io/badge/Vistas-23-green)

**Calidad de servicios (heurístico):** índice **100/100** · cumple **15/15** · aprobado **SI** · capas **3**
Detalle completo en [`docs/EVALUACION.md`](docs/EVALUACION.md).
<!-- calidad:fin -->

# West Security Frontend

Frontend web para gestión operativa de guardias, desarrollado con JavaScript y Vite.

## Requisitos

- Node.js LTS y npm compatibles con la versión de Vite declarada en `package.json`.
- El backend de West Security en ejecución y configurado por separado.

## Configuración local

Desde este directorio, crea el archivo de entorno local a partir de la plantilla:

```sh
cp .env.example .env
```

La configuración de desarrollo predeterminada es:

```dotenv
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT_MS=10000
```

El cliente agrega `/api` a la URL de origen. También acepta una URL que ya termine en `/api`. El backend usa cookies de sesión; el cliente envía las solicitudes con credenciales incluidas. No se versionan archivos `.env` ni se incluyen credenciales en esta guía.

## Comandos

```sh
npm install
npm run dev
npm run build
npm test
```

Vite muestra la dirección local al iniciar `npm run dev`. `npm test` ejecuta las pruebas unitarias y de interfaz con el runner nativo de Node.js. `npm run build` genera la versión de producción en `dist/`.

## Estructura

```text
src/
  api/                 Cliente HTTP y manejo de errores
  auth/                Sesión y autenticación
  components/          Layout y componentes de interfaz
  hooks/               Controladores de vistas y flujos
  services/            Adaptadores de endpoints del backend
  utils/               Validaciones, formato y estado derivado
  views/               Vistas públicas, administrativas y de guardia
tests/                 Pruebas unitarias, de integración y helpers de navegador
docs/                  Evaluación y documentación complementaria
public/                Recursos estáticos
```

## Uso por rol

### Administrador

Inicia sesión con una cuenta administrativa provisionada por el backend. El panel permite consultar el dashboard, administrar usuarios y bloqueos, gestionar locales, horarios y asignaciones, supervisar registros activos e históricos, cerrar ingresos abiertos, eliminar registros seleccionados y consultar el calendario y valores mensuales.

### Guardia

Inicia sesión con una cuenta de guardia. Consulta servicios y horarios asignados, captura la ubicación para registrar un ingreso, registra el egreso del turno y consulta su historial y notificaciones. El backend valida permisos, conflictos y el radio de 100 metros para las operaciones geográficas.

## Contrato de API

El cliente usa el prefijo `/api` y respuestas JSON envueltas en `data`. Entre las rutas cubiertas están `/login`, `/me`, `/logout`, `/mis-servicios`, `/servicio/:nombre/horarios`, `/guardias`, `/guardias/egreso`, `/mis-registros`, `/notificaciones`, `/notificaciones/leidas` y las rutas `/admin/*` de usuarios, locales, horarios, asignaciones, registros, calendario y valores mensuales. Los filtros de historial del guardia se aplican en el navegador, porque `/mis-registros` solo define paginación; la supervisión administrativa envía los filtros admitidos por el backend.

Las pruebas comprueban métodos, rutas y payloads clave frente al contrato documentado en el backend. Para probar autenticación y persistencia reales, configura y ejecuta el backend siguiendo su propia guía; su secreto de sesión debe permanecer en el entorno local del backend.
