import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adminServiceApi } from '../src/services/adminServiceApi.js'
import {
  createAdminServicesState,
  refreshAdminServices,
  requestMessage,
  saveSchedule,
  saveService,
  selectedService,
} from '../src/hooks/useAdminServices.js'

function installFormData(context) {
  const original = globalThis.FormData
  globalThis.FormData = class {
    constructor(form) {
      this.values = form.values
    }

    entries() {
      return Object.entries(this.values).filter(([key]) => key !== 'dias')
    }

    getAll(name) {
      return name === 'dias' ? this.values.dias || [] : []
    }
  }
  context.after(() => { globalThis.FormData = original })
}

test('admin services refreshes selected service and matching schedules', async (context) => {
  context.mock.method(adminServiceApi, 'listServices', async () => ({
    locales: [{ id: 2, nombre: 'Central' }, { id: 3, nombre: 'Norte' }],
  }))
  context.mock.method(adminServiceApi, 'listSchedules', async (id) => ({
    horarios: [{ id: 7, servicio_id: Number(id) }],
  }))
  const state = createAdminServicesState({ rol: 'admin' })
  state.selectedId = '99'

  await refreshAdminServices(state)

  assert.equal(state.selectedId, '2')
  assert.equal(selectedService(state).nombre, 'Central')
  assert.deepEqual(state.schedules, [{ id: 7, servicio_id: 2 }])
})

test('admin services saves validated service and schedule forms using the API', async (context) => {
  installFormData(context)
  let createdService
  let createdSchedule
  context.mock.method(adminServiceApi, 'createService', async (payload) => { createdService = payload })
  context.mock.method(adminServiceApi, 'createSchedule', async (payload) => { createdSchedule = payload })
  const state = createAdminServicesState({ rol: 'admin' })
  state.services = []
  state.schedules = []

  await saveService(state, { values: { nombre: ' Central ', latitud: '0', longitud: '0' } })
  assert.deepEqual(createdService, { nombre: 'Central', latitud: 0, longitud: 0 })
  assert.equal(state.feedback, 'Servicio creado correctamente.')

  await saveSchedule(state, {
    values: {
      servicio_id: '2',
      dias: ['3', '1', '3'],
      hora_inicio: '08:00',
      hora_fin: '16:00',
      capacidad: '4',
    },
  })
  assert.deepEqual(createdSchedule, {
    servicio_id: 2,
    dias: [1, 3],
    hora_inicio: '08:00',
    hora_fin: '16:00',
    capacidad: 4,
  })
  assert.equal(state.feedback, 'Horario creado correctamente.')
})

test('admin services rejects invalid forms and maps API status messages', async (context) => {
  installFormData(context)
  const state = createAdminServicesState({ rol: 'admin' })
  await assert.rejects(saveService(state, { values: { nombre: '', latitud: '0', longitud: '0' } }), /Ingresa el nombre/)
  await assert.rejects(saveSchedule(state, { values: { dias: [] } }), /Selecciona un servicio/)
  assert.equal(requestMessage({ status: 409, message: 'duplicate' }), 'Duplicado o conflicto: duplicate')
  assert.equal(requestMessage({ status: 422, message: 'invalid' }), 'Dato inválido: invalid')
  assert.equal(requestMessage({ status: 500, message: 'failed' }), 'failed')
})
