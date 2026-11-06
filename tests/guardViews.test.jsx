import { describe, expect, it } from 'vitest'
import { renderLocationCapture } from '../src/components/guard/LocationCapture.js'
import { renderServiceScheduleSelector } from '../src/components/guard/ServiceScheduleSelector.js'
import { renderAssignedServicesView } from '../src/views/guard/AssignedServicesView.js'

const user = { rol: 'guardia', username: 'guardia-test' }

function viewState(overrides = {}) {
  return {
    services: [], schedules: [], selectedServiceId: '', selectedScheduleId: '',
    servicesLoading: false, servicesError: '', loadingSchedules: false, schedulesError: '',
    location: null, locationStatus: 'idle', locationError: '', submitting: false, prepared: false,
    ...overrides,
  }
}

describe('vista y selector de servicios de guardia', () => {
  it('presenta estado vacío y reintento de error de asignaciones', () => {
    const empty = renderAssignedServicesView(user, viewState())
    const failed = renderAssignedServicesView(user, viewState({ servicesError: '<sin conexión>' }))

    expect(empty).toContain('No tienes servicios asignados')
    expect(failed).toContain('id="retry-services"')
    expect(failed).toContain('&lt;sin conexión&gt;')
  })

  it('presenta carga, servicio asignado y preparación completada', () => {
    const loading = renderAssignedServicesView(user, viewState({ servicesLoading: true }))
    const assigned = renderAssignedServicesView(user, viewState({
      services: [{ id: 1, nombre: 'Patrulla' }], selectedServiceId: 1,
      selectedScheduleId: 7, location: { latitude: 1, longitude: 2, accuracy: 3 },
    }))
    const prepared = renderAssignedServicesView(user, viewState({ prepared: true }))

    expect(loading).toContain('Cargando tus servicios asignados')
    expect(assigned).toContain('Servicio asignado')
    expect(assigned).toContain('>Continuar</button>')
    expect(prepared).toContain('Preparación completada')
  })

  it('muestra la carga del horario solicitado para el servicio seleccionado', () => {
    const markup = renderServiceScheduleSelector({
      services: [{ id: 1, nombre: 'Patrulla' }], selectedServiceId: 1,
      schedules: [], selectedScheduleId: '', loadingSchedules: true, schedulesError: '',
    })

    expect(markup).toContain('Cargando horarios…')
    expect(markup).toContain('disabled')
  })

  it('renderiza los horarios disponibles y el seleccionado', () => {
    const markup = renderServiceScheduleSelector({
      services: [{ id: 1, nombre: 'Patrulla' }, { id: 2, nombre: 'Cobertura' }], selectedServiceId: 1,
      schedules: [
        { horario_id: 7, dias: [1, 3], hora_inicio: '08:00', hora_fin: '16:00' },
        { id: 8, dias: 'viernes', hora_inicio: '08:00' },
        { id: 9 },
      ],
      selectedScheduleId: 7, loadingSchedules: false, schedulesError: '',
    })

    expect(markup).toContain('selected')
    expect(markup).toContain('Días 1, 3')
    expect(markup).toContain('Días viernes · 08:00')
    expect(markup).toContain('Turno 9')
  })

  it('muestra errores y ausencia de horarios para el servicio elegido', () => {
    const empty = renderServiceScheduleSelector({
      services: [{ id: 1, nombre: 'Patrulla' }], selectedServiceId: 1,
      schedules: [], selectedScheduleId: '', loadingSchedules: false, schedulesError: '',
    })
    const failed = renderServiceScheduleSelector({
      services: [{ id: 1, nombre: 'Patrulla' }], selectedServiceId: 1,
      schedules: [], selectedScheduleId: '', loadingSchedules: false, schedulesError: 'No disponible',
    })

    expect(empty).toContain('no tiene horarios asignados')
    expect(failed).toContain('role="alert"')
    expect(failed).toContain('No disponible')
  })
})

describe('captura de ubicación', () => {
  it('deshabilita la captura mientras espera la geolocalización', () => {
    const markup = renderLocationCapture({
      location: null, locationStatus: 'loading', locationError: '', selectedScheduleId: '7',
    })

    expect(markup).toContain('Obteniendo ubicación…')
    expect(markup).toContain('disabled')
  })

  it('expone el error de permiso como alerta y permite reintentar', () => {
    const markup = renderLocationCapture({
      location: null, locationStatus: 'error',
      locationError: 'Habilita el permiso de ubicación.', selectedScheduleId: '7',
    })

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Habilita el permiso de ubicación.')
    expect(markup).not.toContain('disabled')
  })

  it('muestra la ubicación capturada con precisión y bloquea sin horario', () => {
    const captured = renderLocationCapture({
      location: { latitude: -32.9, longitude: -68.8, accuracy: 7.6 },
      locationStatus: 'success', locationError: '', selectedScheduleId: '7',
    })
    const noSchedule = renderLocationCapture({
      location: null, locationStatus: 'idle', locationError: '', selectedScheduleId: '',
    })

    expect(captured).toContain('±8 m')
    expect(captured).toContain('Actualizar ubicación')
    expect(noSchedule).toContain('disabled')
  })
})