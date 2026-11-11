import { describe, expect, it, vi } from 'vitest'
import { useGeolocation } from '../src/hooks/useGeolocation.js'

function geolocationWith(callback) {
  return { getCurrentPosition: vi.fn(callback) }
}

describe('hook de geolocalización', () => {
  it('captura coordenadas y precisión reales con alta precisión', async () => {
    const geolocation = geolocationWith((success) => success({ coords: { latitude: -32.9, longitude: -68.8, accuracy: 7.6 } }))
    const hook = useGeolocation(geolocation)

    const result = await hook.capture()
    expect(result).toEqual({ location: { latitude: -32.9, longitude: -68.8, accuracy: 7.6 }, status: 'success', error: '' })
    expect(geolocation.getCurrentPosition.mock.calls[0][2].enableHighAccuracy).toBe(true)
  })

  it('explica cómo habilitar el permiso denegado', async () => {
    const geolocation = geolocationWith((success, fail) => fail({ code: 1 }))
    const result = await useGeolocation(geolocation).capture()

    expect(result.status).toBe('error')
    expect(result.error).toContain('Habilítalo en los ajustes del navegador')
  })

  it('informa si el navegador no ofrece geolocalización', async () => {
    const result = await useGeolocation(null).capture()
    expect(result.error).toContain('Este navegador no ofrece geolocalización')
  })

  it('evita capturas simultáneas y descarta resultados tras resetear', async () => {
    let succeed
    const geolocation = geolocationWith((success) => { succeed = success })
    const hook = useGeolocation(geolocation)
    const pending = hook.capture()

    expect((await hook.capture()).status).toBe('loading')
    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(1)
    hook.reset()
    succeed({ coords: { latitude: 1, longitude: 2, accuracy: 3 } })
    expect((await pending).status).toBe('idle')
  })
})