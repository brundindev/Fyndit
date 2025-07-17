<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Save, ArrowLeft, MapPin, Mail, Phone, FileText } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import type { User as FirebaseUser } from '@/types/firebase'

const router = useRouter()
const authStore = useAuthStore()

// Estado del formulario
const form = ref<Partial<FirebaseUser>>({
  displayName: '',
  username: '',
  location: undefined,
  phoneNumber: '',
  bio: '',
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const checkingUsername = ref(false)
const usernameError = ref('')
const usernameValid = ref(false)

// Validación
const isFormValid = computed(() => {
  return (
    form.value.displayName?.trim() !== '' &&
    form.value.username?.trim() !== '' &&
    !usernameError.value &&
    !checkingUsername.value
  )
})

// Métodos
const loadUserData = () => {
  if (authStore.user) {
    form.value = {
      displayName: authStore.user.displayName,
      username: authStore.user.username,
      location: authStore.user.location,
      phoneNumber: authStore.user.phoneNumber || '',
      bio: authStore.user.bio || '',
    }
  }
}

const validateUsername = async () => {
  const username = form.value.username?.trim()

  if (!username) {
    usernameError.value = 'Username es requerido'
    usernameValid.value = false
    return
  }

  if (username.length < 3) {
    usernameError.value = 'Username debe tener al menos 3 caracteres'
    usernameValid.value = false
    return
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    usernameError.value = 'Solo letras, números y guiones bajos'
    usernameValid.value = false
    return
  }

  // Si es el mismo username actual, es válido
  if (username === authStore.user?.username) {
    usernameError.value = ''
    usernameValid.value = true
    return
  }

  // Aquí iría la validación con Firebase para verificar disponibilidad
  // Por ahora simulamos que está disponible
  usernameError.value = ''
  usernameValid.value = true
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Por favor completa todos los campos correctamente'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Preparar datos para actualizar
    const updateData: Partial<FirebaseUser> = {
      displayName: form.value.displayName,
      username: form.value.username,
      phoneNumber: form.value.phoneNumber || undefined,
      bio: form.value.bio || undefined,
    }

    // Si hay location, incluirla
    if (form.value.location) {
      updateData.location = form.value.location
    }

    const result = await authStore.updateProfile(updateData)

    if (result.success) {
      successMessage.value = 'Perfil actualizado exitosamente'
      setTimeout(() => {
        router.push('/perfil')
      }, 2000)
    } else {
      errorMessage.value = result.error || 'Error al actualizar perfil'
    }
  } catch (error) {
    console.error('Error:', error)
    errorMessage.value = 'Error inesperado al actualizar perfil'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/perfil')
}

const formatCreatedDate = () => {
  const timestamp = authStore.user?.createdAt
  if (!timestamp) return 'No disponible'

  try {
    let date: Date

    // Verificar si tiene método toDate (es un Timestamp de Firebase)
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      date = (timestamp as { toDate(): Date }).toDate()
    } else {
      // Si es string o Date, convertir directamente
      date = new Date(timestamp as string | Date)
    }

    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'No disponible'
  }
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadUserData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <button
            @click="goBack"
            class="p-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <h1 class="text-3xl font-bold text-gray-900">Editar perfil</h1>
        </div>
      </div>

      <!-- Formulario -->
      <div class="max-w-2xl mx-auto">
        <div class="bg-white rounded-lg shadow-md p-6">
          <!-- Mensajes -->
          <div
            v-if="errorMessage"
            class="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
          >
            {{ errorMessage }}
          </div>

          <div
            v-if="successMessage"
            class="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
          >
            {{ successMessage }}
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Avatar placeholder -->
            <div class="flex justify-center mb-6">
              <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <User class="w-12 h-12 text-gray-600" />
              </div>
            </div>

            <!-- Nombre completo -->
            <div>
              <label for="displayName" class="block text-sm font-medium text-gray-700 mb-2">
                <User class="w-4 h-4 inline mr-1" />
                Nombre completo <span class="text-red-500">*</span>
              </label>
              <input
                id="displayName"
                v-model="form.displayName"
                type="text"
                required
                class="input-field w-full"
                placeholder="ej: Juan Pérez"
                :disabled="loading"
              />
            </div>

            <!-- Username -->
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                Username <span class="text-red-500">*</span>
              </label>
              <input
                id="username"
                v-model="form.username"
                type="text"
                required
                class="input-field w-full"
                :class="{
                  'border-red-500': usernameError,
                  'border-green-500': usernameValid && form.username !== authStore.user?.username,
                }"
                placeholder="ej: juan_perez123"
                :disabled="loading"
                @blur="validateUsername"
              />
              <div v-if="usernameError" class="mt-1 text-sm text-red-600">
                {{ usernameError }}
              </div>
              <div
                v-if="usernameValid && form.username !== authStore.user?.username"
                class="mt-1 text-sm text-green-600"
              >
                ✓ Username disponible
              </div>
              <div class="mt-1 text-xs text-gray-500">
                Solo letras, números y guiones bajos. Mínimo 3 caracteres.
              </div>
            </div>

            <!-- Email (readonly) -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                <Mail class="w-4 h-4 inline mr-1" />
                Correo electrónico
              </label>
              <input
                id="email"
                :value="authStore.user?.email"
                type="email"
                disabled
                class="input-field w-full bg-gray-100 cursor-not-allowed"
              />
              <div class="mt-1 text-xs text-gray-500">
                El correo electrónico no se puede cambiar.
              </div>
            </div>

            <!-- Teléfono -->
            <div>
              <label for="phoneNumber" class="block text-sm font-medium text-gray-700 mb-2">
                <Phone class="w-4 h-4 inline mr-1" />
                Teléfono
              </label>
              <input
                id="phoneNumber"
                v-model="form.phoneNumber"
                type="tel"
                class="input-field w-full"
                placeholder="ej: +34 123 456 789"
                :disabled="loading"
              />
            </div>

            <!-- Ubicación -->
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
                <MapPin class="w-4 h-4 inline mr-1" />
                Ubicación
              </label>
              <input
                id="location"
                v-model="form.location"
                type="text"
                class="input-field w-full"
                placeholder="ej: Madrid, España"
                :disabled="loading"
              />
            </div>

            <!-- Biografía -->
            <div>
              <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">
                <FileText class="w-4 h-4 inline mr-1" />
                Biografía
              </label>
              <textarea
                id="bio"
                v-model="form.bio"
                rows="4"
                maxlength="500"
                class="input-field w-full resize-none"
                placeholder="Cuéntanos algo sobre ti..."
                :disabled="loading"
              />
              <div class="text-xs text-gray-500 mt-1">
                {{ (form.bio || '').length }}/500 caracteres
              </div>
            </div>

            <!-- Información adicional -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 class="text-sm font-medium text-blue-900 mb-2">Información de la cuenta</h3>
              <div class="text-sm text-blue-700 space-y-1">
                <p><strong>UID:</strong> {{ authStore.user?.uid }}</p>
                <p>
                  <strong>Miembro desde:</strong>
                  {{ formatCreatedDate() }}
                </p>
                <p><strong>Estado:</strong> <span class="text-green-600">Activo</span></p>
              </div>
            </div>

            <!-- Botones -->
            <div class="flex justify-end space-x-4 pt-6 border-t">
              <button type="button" @click="goBack" class="btn-secondary" :disabled="loading">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary flex items-center space-x-2"
                :disabled="loading || !isFormValid"
                :class="{ 'opacity-50 cursor-not-allowed': loading || !isFormValid }"
              >
                <Save class="w-4 h-4" />
                <span v-if="loading">Guardando...</span>
                <span v-else>Guardar cambios</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
