import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apiMessage, invalidBlocks, readBlocks } from '../src/utils/adminUserData.js'
import { resolveSelectedServiceId, setMutationFeedback } from '../src/utils/adminServiceState.js'
import { findDataAction } from '../src/utils/domActions.js'

function blockEntry(fields) {
  return {
    querySelector(selector) {
      return { value: fields[selector] || '' }
    },
  }
}

test('admin user utilities parse date and range blocks and validate required dates', () => {
  const entries = {
    querySelectorAll: () => [
      blockEntry({
        '[name="tipo"]': 'fecha',
        '[name="motivo"]': '   Consulta médica ',
        '[name="fecha"]': '2026-11-12',
      }),
      blockEntry({
        '[name="tipo"]': 'rango',
        '[name="motivo"]': 'Viaje',
        '[name="fecha_inicio"]': '2026-11-14',
        '[name="fecha_fin"]': '2026-11-16',
      }),
    ],
  }
  const blocks = readBlocks(entries)

  assert.deepEqual(blocks, [
    { tipo: 'fecha', motivo: 'Consulta médica', fecha: '2026-11-12' },
    { tipo: 'rango', motivo: 'Viaje', fecha_inicio: '2026-11-14', fecha_fin: '2026-11-16' },
  ])
  assert.equal(invalidBlocks(blocks), false)
  assert.equal(invalidBlocks([{ tipo: 'fecha', fecha: '' }]), true)
  assert.equal(invalidBlocks([{ tipo: 'rango', fecha_inicio: '2026-11-14' }]), true)
})

test('admin state and DOM action utilities resolve actions and feedback', () => {
  assert.equal(resolveSelectedServiceId([{ id: 2 }, { id: 3 }], '3'), '3')
  assert.equal(resolveSelectedServiceId([{ id: 2 }], '99'), '2')
  assert.equal(resolveSelectedServiceId([], ''), '')

  const state = {}
  setMutationFeedback(state, true, 'Servicio')
  assert.deepEqual(state, { feedback: 'Servicio actualizado correctamente.', feedbackTone: 'success' })
  setMutationFeedback(state, false, 'Horario')
  assert.equal(state.feedback, 'Horario creado correctamente.')

  assert.equal(findDataAction({ dataset: { editSchedule: '7' } }, {
    assignSchedule: 'assignSchedule',
    editSchedule: 'editSchedule',
  }), 'editSchedule')
  assert.equal(findDataAction({ dataset: {} }, { editSchedule: 'editSchedule' }), undefined)
})

test('admin API error utility selects status-specific and fallback messages', () => {
  assert.equal(apiMessage({ status: 409, message: 'duplicate' }), 'Conflicto: duplicate')
  assert.equal(apiMessage({ status: 422, message: 'invalid' }), 'Validación: invalid')
  assert.equal(apiMessage({ status: 500, message: '' }), 'No se pudo completar la operación.')
})
