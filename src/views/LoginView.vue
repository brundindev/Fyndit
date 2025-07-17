<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { resetPassword } from '@/firebase/auth'

const router = useRouter()
const authStore = useAuthStore()

// Estado del formulario
const form = ref({
  emailOrUsername: '',
  password: '',
})

// Estado de la UI
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Estado del modal de recuperar contraseña
const showForgotPassword = ref(false)
const forgotPasswordEmail = ref('')
const sendingReset = ref(false)
const resetMessage = ref('')
const resetSuccess = ref(false)

// Computed para validar formulario
const formValid = computed(() => {
  return form.value.emailOrUsername.trim().length > 0 && form.value.password.length > 0
})

// Manejar login
const handleLogin = async () => {
  if (!formValid.value) return

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await authStore.login({
      emailOrUsername: form.value.emailOrUsername.trim(),
      password: form.value.password,
    })

    if (result.success) {
      successMessage.value = 'Sesión iniciada exitosamente. Redirigiendo...'
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } else {
      errorMessage.value = result.error || 'Error al iniciar sesión'
    }
  } catch (error) {
    errorMessage.value = 'Error inesperado. Inténtalo de nuevo.'
    console.error('Error en login:', error)
  } finally {
    loading.value = false
  }
}

// Manejar login con Google
const handleGoogleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await authStore.loginGoogle()

    if (result.success) {
      successMessage.value = 'Sesión iniciada exitosamente. Redirigiendo...'
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } else {
      errorMessage.value = result.error || 'Error al iniciar sesión con Google'
    }
  } catch (error) {
    errorMessage.value = 'Error inesperado. Inténtalo de nuevo.'
    console.error('Error en login con Google:', error)
  } finally {
    loading.value = false
  }
}

// Enviar reset de contraseña
const sendPasswordReset = async () => {
  if (!forgotPasswordEmail.value.trim()) return

  sendingReset.value = true
  resetMessage.value = ''

  try {
    const result = await resetPassword(forgotPasswordEmail.value.trim())

    if (result.success) {
      resetMessage.value = 'Enlace de restablecimiento enviado al email registrado'
      resetSuccess.value = true
      setTimeout(() => {
        showForgotPassword.value = false
        forgotPasswordEmail.value = ''
        resetMessage.value = ''
      }, 3000)
    } else {
      resetMessage.value = result.error || 'Error al enviar enlace de restablecimiento'
      resetSuccess.value = false
    }
  } catch (error) {
    resetMessage.value = 'Error inesperado. Inténtalo de nuevo.'
    resetSuccess.value = false
    console.error('Error en reset password:', error)
  } finally {
    sendingReset.value = false
  }
}

// Limpiar errores cuando el usuario empiece a tipear
watch(
  () => form.value,
  () => {
    if (errorMessage.value) {
      errorMessage.value = ''
    }
  },
  { deep: true },
)

// Limpiar modal al cerrar
watch(showForgotPassword, (newVal) => {
  if (!newVal) {
    forgotPasswordEmail.value = ''
    resetMessage.value = ''
    sendingReset.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <router-link to="/" class="flex items-center space-x-2">
          <div
            class="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center"
          >
            <span class="text-white font-bold text-xl">F</span>
          </div>
          <span class="text-2xl font-bold text-gray-900">Fyndit</span>
        </router-link>
      </div>
      <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">Inicia sesión</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        ¿No tienes cuenta?
        <router-link to="/register" class="font-medium text-primary-600 hover:text-primary-500">
          Regístrate aquí
        </router-link>
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="card py-8 px-4 sm:px-10">
        <!-- Mostrar errores -->
        <div
          v-if="errorMessage"
          class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
        >
          {{ errorMessage }}
        </div>

        <!-- Mostrar success -->
        <div
          v-if="successMessage"
          class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
        >
          {{ successMessage }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="emailOrUsername" class="block text-sm font-medium text-gray-700">
              Email o Username
            </label>
            <input
              id="emailOrUsername"
              v-model="form.emailOrUsername"
              type="text"
              required
              class="input-field mt-1"
              :disabled="loading"
              placeholder="tu@email.com o tu_username"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input-field mt-1"
              :disabled="loading"
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900"> Recordarme </label>
            </div>

            <div class="text-sm">
              <button
                type="button"
                @click="showForgotPassword = true"
                class="font-medium text-primary-600 hover:text-primary-500"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              class="btn-primary w-full justify-center py-3"
              :disabled="loading || !formValid"
              :class="{ 'opacity-50 cursor-not-allowed': loading || !formValid }"
            >
              <span v-if="loading" class="flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Iniciando sesión...
              </span>
              <span v-else>Iniciar sesión</span>
            </button>
          </div>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>

          <!-- Google Sign In -->
          <div>
            <button
              type="button"
              @click="handleGoogleLogin"
              :disabled="loading"
              class="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors duration-200"
              :class="{ 'opacity-50 cursor-not-allowed': loading }"
            >
              <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Iniciar sesión con Google
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de recuperar contraseña -->
    <div
      v-if="showForgotPassword"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="showForgotPassword = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" @click.stop>
        <h3 class="text-lg font-semibold mb-4">Recuperar contraseña</h3>
        <p class="text-sm text-gray-600 mb-4">
          Ingresa tu email o username y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <div class="mb-4">
          <input
            v-model="forgotPasswordEmail"
            type="text"
            placeholder="Email o username"
            class="input-field w-full"
            :disabled="sendingReset"
          />
        </div>

        <div class="flex space-x-3">
          <button
            @click="sendPasswordReset"
            :disabled="sendingReset || !forgotPasswordEmail.trim()"
            class="btn-primary flex-1"
            :class="{
              'opacity-50 cursor-not-allowed': sendingReset || !forgotPasswordEmail.trim(),
            }"
          >
            <span v-if="sendingReset">Enviando...</span>
            <span v-else>Enviar enlace</span>
          </button>
          <button
            @click="showForgotPassword = false"
            class="btn-secondary flex-1"
            :disabled="sendingReset"
          >
            Cancelar
          </button>
        </div>

        <div
          v-if="resetMessage"
          class="mt-3 text-sm"
          :class="resetSuccess ? 'text-green-600' : 'text-red-600'"
        >
          {{ resetMessage }}
        </div>
      </div>
    </div>
  </div>
</template>
