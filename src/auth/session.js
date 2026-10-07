import { ApiError, httpClient } from '../api/httpClient.js'

let currentUser = null

export function getCurrentUser() {
  return currentUser
}

export async function loadSession() {
  try {
    const response = await httpClient.get('/me')
    currentUser = response?.user || null
    return currentUser
  } catch (error) {
    currentUser = null
    throw error
  }
}

export async function login(username, password) {
  const response = await httpClient.post('/login', { username, password })
  currentUser = response?.user || null
  return currentUser
}

export async function logout() {
  try {
    await httpClient.post('/logout', {})
  } finally {
    currentUser = null
  }
}

export function isUnauthorized(error) {
  return error instanceof ApiError && error.status === 401
}