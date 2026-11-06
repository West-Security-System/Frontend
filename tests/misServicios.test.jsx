import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpClient } from '../src/api/httpClient.js'
import { listHorariosServicio, listMisServicios } from '../src/services/misServicios.js'

vi.mock('../src/api/httpClient.js', () => ({ httpClient: { get: vi.fn() } }))

describe('servicio de servicios asignados', () => {
  beforeEach(() => vi.clearAllMocks())

  it('consulta los servicios de la sesión autenticada', async () => {
    const assigned = [{ id: 8, nombre: 'Patrulla' }]
    httpClient.get.mockResolvedValue({ servicios: assigned })

    await expect(listMisServicios()).resolves.toEqual(assigned)
    expect(httpClient.get).toHaveBeenCalledWith('/mis-servicios')
  })

  it('normaliza una respuesta sin lista de servicios', async () => {
    httpClient.get.mockResolvedValue({ servicios: null })
    await expect(listMisServicios()).resolves.toEqual([])
  })

  it('consulta horarios para el servicio elegido con nombre codificado', async () => {
    const schedules = [{ id: 4, hora_inicio: '08:00', hora_fin: '16:00' }]
    httpClient.get.mockResolvedValue({ horarios: schedules })

    await expect(listHorariosServicio('Patrulla & Norte')).resolves.toEqual(schedules)
    expect(httpClient.get).toHaveBeenCalledWith('/servicio/Patrulla%20%26%20Norte/horarios')
  })

  it('normaliza una respuesta de horarios vacía', async () => {
    httpClient.get.mockResolvedValue({})
    await expect(listHorariosServicio('Patrulla')).resolves.toEqual([])
  })
})