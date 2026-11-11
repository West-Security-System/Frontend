import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderScheduleForm } from '../src/components/admin/ScheduleForm.js'

test('schedule form renders an escaped service, existing values, and selected days', () => {
  const html = renderScheduleForm(
    { id: 4, nombre: '<Central>' },
    { id: 9, dias: ['1', 3], hora_inicio: '08:00', hora_fin: '16:00', capacidad: 2 },
  )

  assert.match(html, /&lt;Central&gt;/)
  assert.match(html, /Editar horario/)
  assert.match(html, /name="id" value="9"/)
  assert.match(html, /name="servicio_id" value="4"/)
  assert.match(html, /value="1" checked/)
  assert.match(html, /value="3" checked/)
  assert.match(html, /value="08:00"/)
})

test('schedule form renders safe empty defaults for new schedules', () => {
  const html = renderScheduleForm(null)
  assert.match(html, /Nuevo horario/)
  assert.match(html, /Servicio/)
  assert.match(html, /name="id" value=""/)
  assert.doesNotMatch(html, /checked/)
})
