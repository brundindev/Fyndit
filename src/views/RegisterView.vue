<script setup lang="ts">
import { useRegister } from '@/composables/useRegister'

const {
  form,
  loading,
  errorMessage,
  successMessage,
  checkingUsername,
  usernameError,
  usernameValid,
  formValid,
  checkUsername,
  validateUsername,
  handleRegister,
  handleGoogleSignup,
} = useRegister()
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
      <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">Crea tu cuenta</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?
        <router-link to="/login" class="font-medium text-primary-600 hover:text-primary-500">
          Inicia sesión aquí
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

        <form @submit.prevent="handleRegister" class="space-y-6">
          <div>
            <label for="displayName" class="block text-sm font-medium text-gray-700">
              Nombre completo <span class="text-red-500">*</span>
            </label>
            <input
              id="displayName"
              v-model="form.displayName"
              type="text"
              required
              class="input-field mt-1"
              :disabled="loading"
              placeholder="ej: Brundin Dev"
            />
          </div>

          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              Username <span class="text-red-500">*</span>
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              class="input-field mt-1"
              :class="{
                'border-red-500': usernameError,
                'border-green-500': usernameValid && form.username.length > 0,
              }"
              :disabled="loading"
              @input="checkUsername"
              @blur="validateUsername"
              placeholder="ej: brundindev"
            />
            <div v-if="checkingUsername" class="mt-1 text-sm text-blue-600">
              Verificando disponibilidad...
            </div>
            <div v-if="usernameError" class="mt-1 text-sm text-red-600">
              {{ usernameError }}
            </div>
            <div
              v-if="usernameValid && form.username.length > 0"
              class="mt-1 text-sm text-green-600"
            >
              ✓ Username disponible
            </div>
            <div class="mt-1 text-xs text-gray-500">
              Solo letras, números y guiones bajos. Mínimo 3 caracteres.
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Correo electrónico <span class="text-red-500">*</span>
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-field mt-1"
              :disabled="loading"
              placeholder="ej: brundindev@fyndit.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Contraseña <span class="text-red-500">*</span>
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input-field mt-1"
              :disabled="loading"
              minlength="6"
              placeholder="Mínimo 6 caracteres"
            />
            <div class="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</div>
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
                Creando cuenta...
              </span>
              <span v-else>Crear cuenta</span>
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
              @click="handleGoogleSignup"
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
              Registrarse con Google
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
