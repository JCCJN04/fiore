import { supabase } from './lib/supabase.js'

/**
 * Iniciar sesión con email y contraseña
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }
  return data
}

/**
 * Cerrar sesión
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  }
  window.location.href = '/login'
}

/**
 * Obtener la sesión actual
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Verificar que el usuario esté autenticado, redirigir si no
 */
export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    window.location.href = '/login'
    return null
  }
  return session
}

/**
 * Listener de cambios de autenticación
 */
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}
