import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initializeThemeToggle, renderThemeToggle } from '../src/components/ThemeToggle.js'
import { installBrowser, createApp } from './helpers/browser.js'

test('theme toggle honors saved preference, follows system defaults, and persists changes', (context) => {
  const browser = installBrowser(context)
  browser.localStorage.setItem('west-security-theme', 'light')
  browser.matchMedia = (query) => ({ matches: query === '(prefers-color-scheme: dark)' })

  initializeThemeToggle()
  assert.equal(browser.document.documentElement.getAttribute('data-theme'), 'light')

  const app = createApp(browser)
  app.innerHTML = renderThemeToggle()
  const toggle = app.querySelector('[data-theme-toggle]')
  assert.equal(toggle.getAttribute('aria-label'), 'Cambiar a tema oscuro')
  toggle.click()

  assert.equal(browser.document.documentElement.getAttribute('data-theme'), 'dark')
  assert.equal(browser.localStorage.getItem('west-security-theme'), 'dark')
  assert.equal(toggle.getAttribute('aria-label'), 'Cambiar a tema claro')

  browser.localStorage.removeItem('west-security-theme')
  initializeThemeToggle()
  assert.equal(browser.document.documentElement.getAttribute('data-theme'), 'dark')
})
