import { Window } from 'happy-dom'

export function installBrowser(context, url = 'http://localhost/') {
  const browser = new Window({ url })
  const previous = new Map()
  for (const key of ['window', 'document', 'navigator', 'FormData', 'Event', 'MouseEvent', 'AbortController', 'AbortSignal']) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: key === 'window' ? browser : key === 'document' ? browser.document : browser[key],
    })
  }
  context.after(() => {
    browser.happyDOM.abort()
    browser.close()
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  })
  return browser
}

export function createApp(browser) {
  const app = browser.document.createElement('div')
  app.id = 'app'
  browser.document.body.append(app)
  return app
}

export function submitForm(browser, form) {
  form.dispatchEvent(new browser.Event('submit', { bubbles: true, cancelable: true }))
}

export async function settle(browser) {
  await browser.happyDOM.whenAsyncComplete()
  await new Promise((resolve) => setTimeout(resolve, 0))
}
