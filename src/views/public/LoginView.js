import { alert, button, formField } from '../../components/ui.js'

export function renderLoginView({ errorMessage = '', isSubmitting = false } = {}) {
  return `
    <main class="page auth-page">
      <header class="masthead">
        <a class="brand" href="#/login">WEST SECURITY</a>
        <span class="eyebrow">Inicio de sesión</span>
      </header>
      <section class="auth-panel" aria-labelledby="login-title">
        <span class="eyebrow">Acceso privado</span>
        <h1 id="login-title">Entra a tu espacio seguro.</h1>
        <p>Usa tus credenciales de West Security para continuar.</p>
        ${errorMessage ? alert(errorMessage, 'error') : ''}
        <form id="login-form" class="login-form" novalidate>
          ${formField('username', 'Usuario', 'Tu nombre de usuario')}
          ${formField('password', 'Contraseña', 'Tu contraseña', 'password')}
          <p id="login-form-error" class="form-error" role="alert" aria-live="polite"></p>
          ${button(isSubmitting ? 'Comprobando acceso...' : 'Iniciar sesión', { variant: 'primary', type: 'submit' })}
        </form>
      </section>
    </main>
  `
}