<script setup lang="ts">
import { ref } from 'vue'
import { User, Camera, Upload, Loader2, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

interface Props {
  currentPhotoURL?: string | null
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
}

interface Emits {
  (e: 'photoUpdated', photoURL: string): void
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  editable: true,
})

const emit = defineEmits<Emits>()

const authStore = useAuthStore()

// Estado local
const uploading = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement>()
const previewURL = ref<string | null>(null)

// Tamaños del avatar
const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

const iconSizes = {
  sm: 'w-6 h-6',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}

const cameraIconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

// Métodos
const triggerFileInput = () => {
  if (!props.editable || uploading.value) return
  fileInput.value?.click()
}

const validateFile = (file: File): string | null => {
  // Validar tipo de archivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return 'Solo se permiten archivos JPG, PNG, GIF o WebP'
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return 'La imagen no puede superar los 5MB'
  }

  return null
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Limpiar errores previos
  error.value = ''

  // Validar archivo
  const validationError = validateFile(file)
  if (validationError) {
    error.value = validationError
    target.value = '' // Limpiar input
    return
  }

  // Crear preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewURL.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Subir archivo
  uploading.value = true

  try {
    const result = await authStore.updatePhoto(file)

    if (result.success) {
      emit('photoUpdated', authStore.user?.photoURL || '')
      previewURL.value = null // Limpiar preview
    } else {
      error.value = result.error || 'Error al subir imagen'
      previewURL.value = null
    }
  } catch (err) {
    console.error('Error uploading photo:', err)
    error.value = 'Error inesperado al subir imagen'
    previewURL.value = null
  } finally {
    uploading.value = false
    target.value = '' // Limpiar input
  }
}

const clearPreview = () => {
  previewURL.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Obtener URL de la imagen a mostrar
const getImageURL = () => {
  return previewURL.value || props.currentPhotoURL || authStore.user?.photoURL
}
</script>

<template>
  <div class="flex flex-col items-center space-y-4">
    <!-- Avatar -->
    <div class="relative">
      <div
        class="rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
        :class="sizeClasses[size]"
      >
        <!-- Imagen del usuario -->
        <img
          v-if="getImageURL()"
          :src="getImageURL()!"
          :alt="authStore.user?.displayName || 'Avatar'"
          class="w-full h-full object-cover"
        />
        <!-- Placeholder -->
        <User v-else class="text-gray-600" :class="iconSizes[size]" />

        <!-- Overlay de loading -->
        <div
          v-if="uploading"
          class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full"
        >
          <Loader2 class="text-white animate-spin" :class="cameraIconSizes[size]" />
        </div>
      </div>

      <!-- Botón de editar -->
      <button
        v-if="editable && !uploading"
        @click="triggerFileInput"
        class="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 shadow-lg transition-colors duration-200"
        title="Cambiar foto de perfil"
      >
        <Camera :class="cameraIconSizes[size]" />
      </button>

      <!-- Botón de limpiar preview -->
      <button
        v-if="previewURL && !uploading"
        @click="clearPreview"
        class="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors duration-200"
        title="Cancelar"
      >
        <X class="w-3 h-3" />
      </button>
    </div>

    <!-- Input de archivo (oculto) -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- Botón de subir (alternativo) -->
    <button
      v-if="editable && !uploading && !getImageURL()"
      @click="triggerFileInput"
      class="btn-secondary flex items-center space-x-2"
    >
      <Upload class="w-4 h-4" />
      <span>Subir foto</span>
    </button>

    <!-- Estado de loading -->
    <div v-if="uploading" class="text-center">
      <p class="text-sm text-gray-600">Subiendo imagen...</p>
    </div>

    <!-- Error -->
    <div v-if="error" class="text-center">
      <p class="text-sm text-red-600">{{ error }}</p>
    </div>

    <!-- Ayuda -->
    <div v-if="editable && !uploading" class="text-center">
      <p class="text-xs text-gray-500">JPG, PNG, GIF o WebP. Máximo 5MB.</p>
    </div>
  </div>
</template>
