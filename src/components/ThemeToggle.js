const THEME_STORAGE_KEY = 'west-security-theme'
let isInitialized = false

function currentTheme() {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

function updateToggleButtons(theme) {
  const nextTheme = theme === 'dark' ? 'claro' : 'oscuro'
  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-label', `Cambiar a tema ${nextTheme}`)
    button.setAttribute('title', `Cambiar a tema ${nextTheme}`)
    button.classList.toggle('is-dark', theme === 'dark')
  })
}

function setTheme(theme, persist = false) {
  const selectedTheme = theme === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', selectedTheme)
  updateToggleButtons(selectedTheme)
  if (persist) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme)
    } catch {
      // The selected theme remains active for this page even if storage is unavailable.
    }
  }
}

function initialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  } catch {
    // Fall back to the operating system preference.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function renderThemeToggle() {
  const nextTheme = currentTheme() === 'dark' ? 'claro' : 'oscuro'
  return `<button class="theme-toggle" type="button" data-theme-toggle aria-label="Cambiar a tema ${nextTheme}" title="Cambiar a tema ${nextTheme}">
    <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
    <span class="sr-only">Alternar tema claro y oscuro</span>
  </button>`
}

export function initializeThemeToggle() {
  setTheme(initialTheme())
  if (isInitialized) return
  isInitialized = true
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-theme-toggle]')) return
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark', true)
  })
}
