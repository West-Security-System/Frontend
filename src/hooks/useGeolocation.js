const LOCATION_ERRORS = {
  1: 'Se denegó el permiso de ubicación. Habilítalo en los ajustes del navegador y vuelve a intentarlo.',
  2: 'No se pudo determinar tu ubicación. Comprueba la señal GPS o la conexión e inténtalo otra vez.',
  3: 'La ubicación tardó demasiado. Inténtalo de nuevo en un lugar con mejor señal.',
}

const LOCATION_OPTIONS = { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }

function initialState() {
  return { location: null, status: 'idle', error: '' }
}

function errorMessage(error) {
  return LOCATION_ERRORS[error?.code] || 'No se pudo obtener la ubicación. Revisa los permisos e inténtalo de nuevo.'
}

function readCurrentPosition(geolocation) {
  return new Promise((resolve, reject) => geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
    reject,
    LOCATION_OPTIONS,
  ))
}

export function useGeolocation(geolocation = globalThis.navigator?.geolocation) {
  let state = initialState()
  let requestId = 0

  function getState() {
    return { ...state }
  }

  function reset() {
    requestId += 1
    state = initialState()
    return getState()
  }

  async function capture() {
    if (state.status === 'loading') return getState()
    if (!geolocation?.getCurrentPosition) {
      state = { ...initialState(), status: 'error', error: 'Este navegador no ofrece geolocalización. Abre la aplicación en un navegador compatible.' }
      return getState()
    }

    const activeRequest = ++requestId
    state = { ...initialState(), status: 'loading' }
    try {
      const location = await readCurrentPosition(geolocation)
      if (activeRequest === requestId) state = { location, status: 'success', error: '' }
    } catch (error) {
      if (activeRequest === requestId) state = { ...initialState(), status: 'error', error: errorMessage(error) }
    }
    return getState()
  }

  return { capture, getState, reset }
}