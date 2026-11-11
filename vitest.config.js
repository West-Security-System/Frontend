import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.jsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/services/misServicios.js',
        'src/hooks/useGeolocation.js',
        'src/components/guard/ServiceScheduleSelector.js',
        'src/components/guard/LocationCapture.js',
        'src/views/guard/AssignedServicesView.js',
      ],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 80 },
    },
  },
})