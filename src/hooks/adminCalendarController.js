import { adminCalendarApi } from '../services/adminCalendarApi.js'
import { parseMonthlyAmount } from '../utils/monthlyValueValidation.js'
import { shiftMonth } from '../utils/monthNavigation.js'
import { renderCalendarView } from '../views/admin/CalendarView.js'

let activeListeners

export function createAdminCalendarState(user, now = new Date()) {
  return {
    user,
    services: [],
    selectedServiceId: '',
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
    calendar: null,
    monthlyValue: null,
    draftValue: '',
    loading: true,
    saving: false,
    error: '',
    valueError: '',
    valueFeedback: '',
  }
}

function draw(app, state) {
  app.innerHTML = renderCalendarView(state)
}

async function loadCalendarData(app, state) {
  state.loading = true
  state.error = ''
  draw(app, state)
  try {
    if (!state.services.length) state.services = await adminCalendarApi.listServices()
    if (!state.services.some((service) => String(service.id) === String(state.selectedServiceId))) {
      state.selectedServiceId = String(state.services[0]?.id || '')
    }
    if (!state.selectedServiceId) {
      state.calendar = { dias: [] }
      state.monthlyValue = null
      state.draftValue = ''
      return
    }
    const [calendar, value] = await Promise.all([
      adminCalendarApi.getCalendar(state.selectedServiceId, state.month, state.year),
      adminCalendarApi.getMonthlyValue(state.selectedServiceId, state.month, state.year),
    ])
    state.calendar = calendar
    state.monthlyValue = value
    state.draftValue = value?.valor === null || value?.valor === undefined ? '' : String(value.valor)
  } catch (error) {
    state.error = error.message || 'No se pudo cargar el calendario.'
    state.calendar = null
    state.monthlyValue = null
    state.draftValue = ''
  } finally {
    state.loading = false
    draw(app, state)
  }
}

async function changeService(event, app, state) {
  if (!event.target.matches('#calendar-service')) return
  state.selectedServiceId = event.target.value
  state.valueError = ''
  state.valueFeedback = ''
  await loadCalendarData(app, state)
}

async function handleCalendarClick(event, app, state) {
  const control = event.target.closest('#calendar-previous, #calendar-next, #calendar-current, #retry-calendar')
  if (!control) return
  if (control.id === 'retry-calendar') return loadCalendarData(app, state)
  if (control.id === 'calendar-current') {
    const current = new Date()
    state.month = current.getUTCMonth() + 1
    state.year = current.getUTCFullYear()
  } else {
    const offset = control.id === 'calendar-previous' ? -1 : 1
    Object.assign(state, shiftMonth(state.month, state.year, offset))
  }
  state.valueError = ''
  state.valueFeedback = ''
  await loadCalendarData(app, state)
}

async function saveMonthlyValue(event, app, state) {
  if (!event.target.matches('#monthly-value-form')) return
  event.preventDefault()
  const form = event.target
  const amount = parseMonthlyAmount(form.elements.valor.value)
  state.draftValue = form.elements.valor.value
  if (amount.error) {
    state.valueError = amount.error
    state.valueFeedback = ''
    return draw(app, state)
  }
  state.saving = true
  state.valueError = ''
  state.valueFeedback = ''
  draw(app, state)
  try {
    const result = await adminCalendarApi.setMonthlyValue(state.selectedServiceId, {
      mes: state.month,
      anio: state.year,
      valor: amount.value,
    })
    state.monthlyValue = result?.valor_mensual || result
    state.draftValue = String(state.monthlyValue.valor)
    state.valueFeedback = 'Valor mensual guardado.'
  } catch (error) {
    state.valueError = error.message || 'No se pudo guardar el valor mensual.'
  } finally {
    state.saving = false
    draw(app, state)
  }
}

export async function mountAdminCalendar(app, user) {
  activeListeners?.abort()
  activeListeners = new AbortController()
  const state = createAdminCalendarState(user)
  const options = { signal: activeListeners.signal }
  app.addEventListener('change', (event) => changeService(event, app, state), options)
  app.addEventListener('click', (event) => handleCalendarClick(event, app, state), options)
  app.addEventListener('submit', (event) => saveMonthlyValue(event, app, state), options)
  await loadCalendarData(app, state)
}