export function renderProtectedView() {
  return `
    <main class="page">
      <header class="masthead">
        <a class="brand" href="#/">WEST SECURITY</a>
        <span class="status">Área protegida</span>
      </header>
      <section class="panel" aria-labelledby="protected-title">
        <span class="eyebrow">Sesión privada</span>
        <h1 id="protected-title">Tu espacio seguro.</h1>
        <p>Esta vista está separada de las rutas públicas y lista para conectarse con la sesión del usuario.</p>
        <div class="actions"><a class="button secondary" href="#/">Volver al inicio</a></div>
      </section>
    </main>
  `
}