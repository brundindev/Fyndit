import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  loginWithEmail,
  loginWithEmailOrUsername,
  loginWithGoogle,
  registerWithEmail,
  logout,
  resetPassword,
  updateUserProfile,
  onAuthStateChange,
  type LoginCredentials,
  type RegisterData,
} from '@/firebase/auth'
import type { User } from '@/types/firebase'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isGuest = computed(() => !user.value)
  const userDisplayName = computed(
    () => user.value?.displayName || user.value?.username || 'Usuario',
  )

  // Acciones
    async function login(credentials: LoginCredentials) {
    loading.value = true
    error.value = null

    try {
      const result = await loginWithEmailOrUsername(credentials)

      if (result.success) {
        user.value = result.data!
        return { success: true, message: result.message }
      } else {
        error.value = result.error!
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      error.value = err.message || 'Error al iniciar sesión'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function loginGoogle() {
    loading.value = true
    error.value = null

    try {
      const result = await loginWithGoogle()

      if (result.success) {
        user.value = result.data!
        return { success: true, message: result.message }
      } else {
        error.value = result.error!
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      error.value = err.message || 'Error al iniciar sesión con Google'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterData) {
    loading.value = true
    error.value = null

    try {
      const result = await registerWithEmail(data)

      if (result.success) {
        user.value = result.data!
        return { success: true, message: result.message }
      } else {
        error.value = result.error!
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      error.value = err.message || 'Error al registrarse'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    loading.value = true
    error.value = null

    try {
      const result = await logout()

      if (result.success) {
        user.value = null
        return { success: true, message: result.message }
      } else {
        error.value = result.error!
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cerrar sesión'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function sendPasswordReset(email: string) {
    loading.value = true
    error.value = null

    try {
      const result = await resetPassword(email)

      if (result.success) {
        return { success: true, message: result.message }
      } else {
        error.value = result.error!
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      error.value = err.message || 'Error al enviar email de restablecimiento'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(updates: Partial<User>) {
    loading.value = true
    error.value = null

    try {
      const result = await updateUserProfile(updates)

      if (result.success) {
        user.value = result.data!
        return { success: true, message: 'Perfil actualizado exitosamente' }
      } else {
        error.value = result.error!
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar perfil'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Inicializar el observador de autenticación
  function initializeAuth() {
    if (isInitialized.value) return

    return onAuthStateChange((firebaseUser) => {
      user.value = firebaseUser
      isInitialized.value = true
    })
  }

  // Limpiar errores
  function clearError() {
    error.value = null
  }

  // Verificar si el usuario actual es el propietario de un recurso
  function isOwner(ownerId: string): boolean {
    return user.value?.uid === ownerId
  }

  return {
    // Estado
    user,
    loading,
    error,
    isInitialized,

    // Getters
    isAuthenticated,
    isGuest,
    userDisplayName,

    // Acciones
    login,
    loginGoogle,
    register,
    signOut,
    sendPasswordReset,
    updateProfile,
    initializeAuth,
    clearError,
    isOwner,
  }
})
