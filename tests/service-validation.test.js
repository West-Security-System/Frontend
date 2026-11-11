import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  escapeHtml,
  isSameSchedule,
  uniqueSchedules,
  validateSchedule,
  validateService,
} from '../src/utils/serviceValidation.js'

test('service validation covers required, duplicate and geographic constraints', () => {
  const services = [{ id: 1, nombre: 'Central' }]
  assert.equal(validateService({ nombre: ' ', latitud: '0', longitud: '0' }, services), 'Ingresa el nombre del servicio.')
  assert.match(validateService({ nombre: 'central', latitud: '0', longitud: '0' }, services), /Ya existe/)
  assert.equal(validateService({ nombre: 'Nueva', latitud: '91', longitud: '0' }, services), 'La latitud debe estar entre -90 y 90.')
  assert.equal(validateService({ nombre: 'Nueva', latitud: '0', longitud: '' }, services), 'La longitud debe estar entre -180 y 180.')
  assert.equal(validateService({ nombre: ' CENTRAL ', latitud: '-90', longitud: '180' }, services, 1), '')
})

test('schedule validation rejects missing fields, invalid capacity and duplicates', () => {
  const existing = [{ id: 2, dias: '[1,2]', hora_inicio: '08:00', hora_fin: '16:00' }]
  assert.equal(validateSchedule({}, [], ''), 'Selecciona un servicio.')
  assert.equal(validateSchedule({ servicio_id: 1, dias: [] }, [], ''), 'Selecciona al menos un día.')
  assert.match(validateSchedule({
    servicio_id: 1, dias: [1], hora_inicio: '16:00', hora_fin: '08:00', capacidad: 1,
  }, [], ''), /posterior/)
  assert.match(validateSchedule({
    servicio_id: 1, dias: [1], hora_inicio: '08:00', hora_fin: '16:00', capacidad: 0,
  }, [], ''), /capacidad/)
  assert.match(validateSchedule({
    servicio_id: 1, dias: [2, 1], hora_inicio: '08:00', hora_fin: '16:00', capacidad: 1,
  }, existing, ''), /Ya existe/)
})

test('HTML escaping and schedule de-duplication preserve safe unique values', () => {
  assert.equal(escapeHtml(`<script a='b'>&"`), '&lt;script a=&#39;b&#39;&gt;&amp;&quot;')
  const schedules = [
    { id: 1, dias: [1, 2], hora_inicio: '08:00', hora_fin: '16:00' },
    { id: 2, dias: '[2,1]', hora_inicio: '08:00', hora_fin: '16:00' },
    { id: 3, dias: [3], hora_inicio: '08:00', hora_fin: '16:00' },
  ]
  assert.equal(isSameSchedule(schedules[0], { dias: [2, 1], hora_inicio: '08:00', hora_fin: '16:00' }), true)
  assert.deepEqual(uniqueSchedules(schedules).map(({ id }) => id), [1, 3])
})
