export function renderPublicView() {
  return `
    <main class="page">
      <header class="masthead">
        <a class="brand" href="#/">WEST SECURITY</a>
        <span class="eyebrow">Acceso protegido</span>
      </header>
      <section class="content" aria-labelledby="public-title">
        <span class="eyebrow">Portal de seguridad</span>
        <h1 id="public-title">Claridad para proteger lo importante.</h1>
        <p>La puerta de entrada al espacio seguro de West Security. La autenticación y las operaciones privadas viven en el área protegida.</p>
        <div class="actions">
          <a class="button" href="#/app">Entrar al área protegida</a>
          <a class="button secondary" href="mailto:soporte@west-security.local">Contactar soporte</a>
        </div>
      </section>
    </main>
  `
}