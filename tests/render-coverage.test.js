import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderLayout } from '../src/components/Layout.js'
import { alert, button, emptyState, errorState, formField, loadingState, modal, table } from '../src/components/ui.js'
import { renderDashboardContent } from '../src/components/admin/DashboardContent.js'
import { renderAssignmentsModal } from '../src/components/admin/GuardAssignmentsModal.js'
import { renderScheduleForm } from '../src/components/admin/ScheduleForm.js'
import { renderScheduleList } from '../src/components/admin/ScheduleList.js'
import { renderServiceForm } from '../src/components/admin/ServiceForm.js'
import { renderServiceList } from '../src/components/admin/ServiceList.js'
import { renderDashboardView } from '../src/views/admin/DashboardView.js'
import { renderServicesView } from '../src/views/admin/ServicesView.js'
import { renderUsersView } from '../src/views/admin/UsersView.js'
import { renderGuardExitView } from '../src/views/protected/GuardExitView.js'
import { renderProtectedView } from '../src/views/protected/ProtectedView.js'
import { renderLoginView } from '../src/views/public/LoginView.js'
import { renderPublicView } from '../src/views/public/PublicView.js'
import { buildDashboardData } from '../src/utils/dashboardData.js'
import { setupCounter } from '../src/counter.js'

const admin = { id: 1, rol: 'admin', username: 'Admin' }
const service = { id: 1, nombre: 'Central', latitud: 0, longitud: 0 }

test('shared components render accessible content and optional states', () => {
  assert.match(renderLayout({ user: admin, activeSection: 'locales', content: '<p>Contenido</p>' }), /aria-current="page"/)
  assert.match(renderLayout({ user: { rol: 'other', username: 'A' }, activeSection: '', content: '' }), /Operaciones de guardia/)
  assert.match(button('Guardar', { variant: 'primary', type: 'submit' }), /type="submit"/)
  assert.match(formField('name', 'Nombre', 'Ingrese'), /required/)
  assert.match(table([{ name: 'A', owner: 'B', status: 'Pendiente' }]), /warning/)
  assert.match(table([{ name: 'A', owner: 'B', status: 'Revisado' }]), /success/)
  assert.match(modal('dialog', 'Detalle', 'Texto'), /aria-modal="true"/)
  assert.match(alert('Listo', 'success'), />✓</)
  assert.match(alert('Info'), />i</)
  assert.match(loadingState('Cargando', 'Espera'), /aria-live/)
  assert.match(emptyState('Vacío', 'Sin datos'), /Sin datos/)
  assert.match(errorState('Error', 'Falló'), /Reintentar/)
})

test('dashboard data filters, sorts, caps records and derives operational alerts', () => {
  const data = buildDashboardData({
    users: [{ rol: 'guardia', bloqueado: 0 }, { rol: 'admin', bloqueado: 0 }, { rol: 'guardia', bloqueado: 1 }],
    services: [{ id: 1, nombre: 'Central' }],
    schedules: [
      { id: 1, servicio_id: 1, hora_inicio: '08:00', hora_fin: '12:00', capacidad: 1 },
      { id: 2, servicio_id: 8, hora_inicio: '12:00', hora_fin: '20:00', capacidad: 2 },
      { id: 3, servicio_id: 1, hora_inicio: '20:00', hora_fin: '22:00', capacidad: 2 },
      { id: 4, servicio_id: 8, hora_inicio: '22:00', hora_fin: '23:00', capacidad: 1 },
    ],
    assignments: [
      { schedule: { id: 1, servicio_id: 1, hora_inicio: '08:00', hora_fin: '12:00', capacidad: 1 }, items: [{ id: 1, username: 'Ana', created_at: '2026-03-01' }] },
      { schedule: { id: 2, servicio_id: 8, hora_inicio: '12:00', hora_fin: '20:00', capacidad: 2 }, items: [{ id: 2, username: 'Beto', created_at: '2026-03-02' }, { id: 3, username: 'Ceci', created_at: '2026-03-03' }] },
      { schedule: { id: 3, servicio_id: 1, hora_inicio: '20:00', hora_fin: '22:00', capacidad: 2 }, items: [{ id: 4, username: 'Dani', created_at: '2026-03-04' }] },
    ],
  })
  assert.equal(data.activeGuards.length, 1)
  assert.equal(data.records[0].guardia, 'Dani')
  assert.equal(data.records[0].servicio, 'Central')
  assert.ok(data.records.some((record) => record.servicio === 'Servicio sin nombre'))
  assert.equal(data.alerts.length, 3)
  assert.equal(data.alerts[0].title, 'Capacidad completa')
  assert.equal(data.alerts.at(-1).title, 'Horario sin guardias')
})

test('admin and public views render data, errors, empty states and escaping', () => {
  assert.match(renderDashboardView({ user: admin, loading: true }), /Cargando información/)
  assert.match(renderDashboardView({ user: admin, loading: false, error: '<offline>' }), /&lt;offline&gt;/)
  assert.match(renderDashboardView({ user: admin, data: { activeGuards: [], alerts: [], records: [] } }), /dashboard-grid/)
  assert.match(renderServicesView({ user: admin, services: [], schedules: [], selectedService: null, error: '<fail>' }), /&lt;fail&gt;/)
  assert.match(renderServicesView({ user: admin, services: [service], schedules: [], selectedService: service }), /Añadir horario/)
  assert.match(renderUsersView({ currentUser: admin, users: [] }), /No hay usuarios registrados/)
  assert.match(renderUsersView({ currentUser: admin, users: [{ id: 1, username: '<A>', rol: 'admin', bloqueado: 0 }] }), /&lt;A&gt;/)
  assert.match(renderGuardExitView({ user: { rol: 'guardia' }, locationState: { status: 'idle' } }), /registrar egreso/i)
  assert.match(renderProtectedView(admin), /Registros de seguridad/)
  assert.match(renderLoginView({ errorMessage: 'Denegado', isSubmitting: true }), /Comprobando acceso/)
  assert.match(renderPublicView(), /Claridad para proteger/)
})

test('administrative form, list and assignment components render both populated and empty variants', () => {
  assert.match(renderServiceForm(), /Nuevo servicio/)
  assert.match(renderServiceForm({ ...service, id: 2 }), /Editar servicio/)
  assert.match(renderServiceList([], ''), /No hay servicios registrados/)
  assert.match(renderServiceList([service], 1), /aria-pressed="true"/)
  assert.match(renderScheduleForm(service), /Nuevo horario/)
  assert.match(renderScheduleForm(service, { id: 2, dias: [1], hora_inicio: '08:00', hora_fin: '16:00', capacidad: 2 }), /Editar horario/)
  assert.match(renderScheduleList([]), /aún no tiene horarios/)
  assert.match(renderScheduleList([{ id: 2, dias: '[1,2]', hora_inicio: '08:00', hora_fin: '16:00', capacidad: 4 }]), /Lunes, Martes/)
  const base = { schedule: { dias: [1], hora_inicio: '08:00', hora_fin: '16:00' }, service, guards: [], assignments: [] }
  assert.match(renderAssignmentsModal({ ...base, loading: true }), /Cargando guardias/)
  assert.match(renderAssignmentsModal(base), /No hay guardias disponibles/)
  assert.match(renderAssignmentsModal({ ...base, error: '<error>', guards: [{ id: 3, username: 'Guardia' }], assignments: [{ usuario_id: 3, username: 'Guardia' }] }), /&lt;error&gt;/)
})

test('dashboard content covers non-empty rows and invalid dates', () => {
  const html = renderDashboardContent({
    activeGuards: [{ username: '<Ana>' }],
    records: [{ guardia: 'Beto', servicio: 'Central', fecha: 'bad-date', estado: 'Asignado' }],
    alerts: [{ type: 'warning', title: '<Alerta>', detail: 'Detalle' }],
  })
  assert.match(html, /&lt;Ana&gt;/)
  assert.match(html, /bad-date/)
  assert.match(html, /&lt;Alerta&gt;/)
})

test('starter counter updates the DOM for every click', () => {
  let handler
  const element = {
    innerHTML: '',
    addEventListener: (_type, callback) => { handler = callback },
  }
  setupCounter(element)
  assert.equal(element.innerHTML, 'Count is 0')
  handler()
  handler()
  assert.equal(element.innerHTML, 'Count is 2')
})
