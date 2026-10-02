import {
  alert,
  button,
  emptyState,
  errorState,
  formField,
  loadingState,
  modal,
  table,
} from '../../components/ui.js'

export function renderProtectedView() {
  return `
    <main class="page">
      <header class="masthead">
        <a class="brand" href="#/">WEST SECURITY</a>
        <span class="status"><span aria-hidden="true">●</span> Área protegida</span>
      </header>
      <section class="dashboard" aria-labelledby="protected-title">
        <div class="section-heading">
          <div><span class="eyebrow">Sesión privada</span><h1 id="protected-title">Centro de control.</h1></div>
          ${button('Nuevo registro', { variant: 'primary', type: 'button' })}
        </div>
        ${alert('La sesión está activa y todos los cambios se guardan de forma segura.', 'success')}
        <div class="state-grid" aria-label="Estados de interfaz">
          ${loadingState('Cargando actividad', 'Consulta en curso')}
          ${emptyState('Sin alertas nuevas', 'Todo está en orden por ahora.')}
          ${errorState('No se pudo cargar el resumen', 'Intenta consultar los datos nuevamente.')}
        </div>
        <section class="surface" aria-labelledby="records-title">
          <div class="surface-heading"><div><span class="eyebrow">Actividad reciente</span><h2 id="records-title">Registros de seguridad</h2></div>${button('Ver todos', { variant: 'secondary', type: 'button' })}</div>
          ${table([{ name: 'Auditoría de acceso', owner: 'Equipo SOC', status: 'Revisado' }, { name: 'Política de contraseñas', owner: 'Administración', status: 'Pendiente' }])}
        </section>
        <section class="surface form-surface" aria-labelledby="form-title">
          <div><span class="eyebrow">Componente de formulario</span><h2 id="form-title">Añadir un contacto</h2></div>
          <form class="form-grid">
            ${formField('contact-name', 'Nombre completo', 'Ej. Ana García')}
            ${formField('contact-email', 'Correo electrónico', 'nombre@empresa.com', 'email')}
            <div class="form-actions">${button('Guardar contacto', { variant: 'primary', type: 'submit' })}${button('Cancelar', { variant: 'secondary', type: 'button' })}</div>
          </form>
        </section>
      </section>
      ${modal('details-modal', 'Detalle del registro', 'El detalle de actividad aparecerá aquí cuando se seleccione un registro.')}
    </main>
  `
}