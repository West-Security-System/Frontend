import { httpClient } from '../api/httpClient.js'

export const adminUserApi = {
  list: () => httpClient.get('/admin/usuarios'),
  create: (user) => httpClient.post('/admin/usuarios', user),
  update: (user) => httpClient.put('/admin/usuarios', user),
  remove: (id) => httpClient.delete(`/admin/usuarios?id=${encodeURIComponent(id)}`),
  updateBlocks: (id, blocks) => httpClient.put(`/admin/usuarios/${encodeURIComponent(id)}/bloqueos`, { bloqueos: blocks }),
}
