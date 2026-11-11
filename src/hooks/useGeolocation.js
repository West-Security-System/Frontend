const geolocationMessages = {
  1: {
    status: 'permission-denied',
    message: 'Permite el acceso a tu ubicación en el navegador para registrar el ingreso.',
  },
  2: {
    status: 'unavailable',
    message: 'No se pudo determinar tu ubicación. Comprueba la señal y vuelve a intentarlo.',
  },
  3: {
    status: 'unavailable',
    message: 'La solicitud de ubicación tardó demasiado. Inténtalo nuevamente.',
  },
  default: {
    status: 'unavailable',
    message: 'No se pudo obtener la ubicación. Inténtalo nuevamente.',
  },
}

function normalizePosition(position) {
  return {
    latitud: position.coords.latitude,
    longitud: position.coords.longitude,
    precision: position.coords.accuracy,
  }
}

function updateFailure(state, error) {
  const failure = geolocationMessages[error?.code] || geolocationMessages.default
  state.status = failure.status
  state.error = failure.message
}

export function useGeolocation(geolocation = globalThis.navigator?.geolocation) {
  const state = { status: 'idle', position: null, error: '' }

  function getCurrentPosition(options = {}) {
    if (!geolocation?.getCurrentPosition) {
      state.status = 'unsupported'
      state.position = null
      state.error = 'Este navegador no es compatible con la geolocalización.'
      return Promise.resolve(null)
    }

    state.status = 'loading'
    state.position = null
    state.error = ''

    return new Promise((resolve) => {
      try {
        geolocation.getCurrentPosition(
          (position) => {
            state.status = 'ready'
            state.position = normalizePosition(position)
            resolve(state.position)
          },
          (error) => {
            updateFailure(state, error)
            resolve(null)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...options },
        )
      } catch (error) {
        updateFailure(state, error)
        resolve(null)
      }
    })
  }

  return { state, getCurrentPosition }
}
