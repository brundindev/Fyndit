<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Upload, Camera, MapPin, DollarSign, Package, FileText, Tag } from 'lucide-vue-next'
import { createProduct, type CreateProductData } from '@/firebase/products'
import { useAuthStore } from '@/stores/auth'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()

// Estado del formulario
const form = ref({
  title: '',
  description: '',
  price: 0,
  category: '' as any, // Temporal para permitir string vacío en UI
  condition: 'bueno' as const,
  location: {
    city: '',
    state: '',
    country: '',
    zipCode: '',
  },
  images: [] as File[],
  tags: [] as string[],
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const imageFiles = ref<File[]>([])
const imagePreviews = ref<string[]>([])
const tagInput = ref('')

// Opciones para selects
const categories = [
  { value: 'electronica', label: 'Electrónica' },
  { value: 'moda', label: 'Moda y complementos' },
  { value: 'hogar', label: 'Hogar y jardín' },
  { value: 'deportes', label: 'Deportes y ocio' },
  { value: 'motor', label: 'Motor' },
  { value: 'libros', label: 'Libros y música' },
  { value: 'juguetes', label: 'Juguetes y bebés' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'otros', label: 'Otros' },
]

const conditions = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'excelente', label: 'Excelente' },
  { value: 'bueno', label: 'Bueno' },
  { value: 'regular', label: 'Regular' },
]

// Computed
const isFormValid = computed(() => {
  return (
    form.value.title.trim() !== '' &&
    form.value.description.trim() !== '' &&
    form.value.price > 0 &&
    form.value.category !== '' &&
    form.value.location.city.trim() !== '' &&
    imageFiles.value.length > 0
  )
})

const modalClass = computed(() => ({
  'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300':
    true,
  'opacity-100': props.show,
  'opacity-0 pointer-events-none': !props.show,
}))

// Métodos
const closeModal = () => {
  emit('update:show', false)
  resetForm()
}

const resetForm = () => {
  form.value = {
    title: '',
    description: '',
    price: 0,
    category: '' as any,
    condition: 'bueno' as const,
    location: {
      city: '',
      state: '',
      country: '',
      zipCode: '',
    },
    images: [] as File[],
    tags: [] as string[],
  }
  imageFiles.value = []
  imagePreviews.value = []
  tagInput.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])

  if (imageFiles.value.length + files.length > 5) {
    errorMessage.value = 'Máximo 5 imágenes permitidas'
    return
  }

  files.forEach((file) => {
    if (file.type.startsWith('image/')) {
      imageFiles.value.push(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        imagePreviews.value.push(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  })

  // Limpiar el input
  target.value = ''
}

const removeImage = (index: number) => {
  imageFiles.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

const addTag = () => {
  const tag = tagInput.value.trim().toLowerCase()
  if (tag && !form.value.tags?.includes(tag) && (form.value.tags?.length || 0) < 10) {
    if (!form.value.tags) form.value.tags = []
    form.value.tags.push(tag)
    tagInput.value = ''
  }
}

const removeTag = (index: number) => {
  if (form.value.tags) {
    form.value.tags.splice(index, 1)
  }
}

const handleTagInput = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTag()
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Por favor completa todos los campos obligatorios'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Convertir formulario al tipo CreateProductData
    const productData: CreateProductData = {
      title: form.value.title,
      description: form.value.description,
      price: form.value.price,
      currency: 'EUR',
      category: form.value.category as any, // Se valida que no esté vacío en isFormValid
      condition: form.value.condition,
      location: form.value.location,
      images: imageFiles.value,
      tags: form.value.tags || [],
    }

    const result = await createProduct(productData)

    if (result.success) {
      successMessage.value = 'Producto subido exitosamente'
      setTimeout(() => {
        closeModal()
      }, 2000)
    } else {
      errorMessage.value = result.error || 'Error al subir el producto'
    }
  } catch (error) {
    console.error('Error:', error)
    errorMessage.value = 'Error inesperado al subir el producto'
  } finally {
    loading.value = false
  }
}

// Watchers
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div :class="modalClass" @click="closeModal">
      <div
        class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-transform duration-300"
        :class="{ 'scale-100': show, 'scale-95': !show }"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b">
          <h2 class="text-2xl font-bold text-gray-900">Subir producto</h2>
          <button
            @click="closeModal"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Contenido -->
        <div class="p-6">
          <!-- Mensajes -->
          <div
            v-if="errorMessage"
            class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
          >
            {{ errorMessage }}
          </div>

          <div
            v-if="successMessage"
            class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded"
          >
            {{ successMessage }}
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Título -->
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                <Package class="w-4 h-4 inline mr-1" />
                Título del producto <span class="text-red-500">*</span>
              </label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                required
                maxlength="100"
                class="input-field w-full"
                placeholder="ej: iPhone 13 Pro Max 256GB"
                :disabled="loading"
              />
              <div class="text-xs text-gray-500 mt-1">{{ form.title.length }}/100 caracteres</div>
            </div>

            <!-- Descripción -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                <FileText class="w-4 h-4 inline mr-1" />
                Descripción <span class="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                v-model="form.description"
                required
                rows="4"
                maxlength="500"
                class="input-field w-full resize-none"
                placeholder="Describe tu producto en detalle..."
                :disabled="loading"
              />
              <div class="text-xs text-gray-500 mt-1">
                {{ form.description.length }}/500 caracteres
              </div>
            </div>

            <!-- Precio y categoría -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="price" class="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign class="w-4 h-4 inline mr-1" />
                  Precio (€) <span class="text-red-500">*</span>
                </label>
                <input
                  id="price"
                  v-model.number="form.price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  class="input-field w-full"
                  placeholder="0.00"
                  :disabled="loading"
                />
              </div>

              <div>
                <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                  <Tag class="w-4 h-4 inline mr-1" />
                  Categoría <span class="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  v-model="form.category"
                  required
                  class="input-field w-full"
                  :disabled="loading"
                >
                  <option value="">Selecciona una categoría</option>
                  <option
                    v-for="category in categories"
                    :key="category.value"
                    :value="category.value"
                  >
                    {{ category.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Estado y ubicación -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="condition" class="block text-sm font-medium text-gray-700 mb-2">
                  Estado del producto <span class="text-red-500">*</span>
                </label>
                <select
                  id="condition"
                  v-model="form.condition"
                  required
                  class="input-field w-full"
                  :disabled="loading"
                >
                  <option
                    v-for="condition in conditions"
                    :key="condition.value"
                    :value="condition.value"
                  >
                    {{ condition.label }}
                  </option>
                </select>
              </div>

              <div>
                <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin class="w-4 h-4 inline mr-1" />
                  Ubicación <span class="text-red-500">*</span>
                </label>
                <input
                  id="location"
                  v-model="form.location"
                  type="text"
                  required
                  class="input-field w-full"
                  placeholder="ej: Madrid, España"
                  :disabled="loading"
                />
              </div>
            </div>

            <!-- Imágenes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <Camera class="w-4 h-4 inline mr-1" />
                Imágenes <span class="text-red-500">*</span>
              </label>

              <!-- Upload area -->
              <div
                class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200"
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  class="hidden"
                  id="image-upload"
                  @change="handleImageUpload"
                  :disabled="loading"
                />
                <label for="image-upload" class="cursor-pointer flex flex-col items-center">
                  <Upload class="w-8 h-8 text-gray-400 mb-2" />
                  <span class="text-sm text-gray-600">Haz clic para subir imágenes</span>
                  <span class="text-xs text-gray-500 mt-1">Máximo 5 imágenes (JPG, PNG)</span>
                </label>
              </div>

              <!-- Image previews -->
              <div
                v-if="imagePreviews.length > 0"
                class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4"
              >
                <div
                  v-for="(preview, index) in imagePreviews"
                  :key="index"
                  class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    :src="preview"
                    :alt="`Preview ${index + 1}`"
                    class="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    @click="removeImage(index)"
                    class="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                    :disabled="loading"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div>
              <label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas (opcional)
              </label>
              <div class="flex flex-wrap gap-2 mb-2">
                <span
                  v-for="(tag, index) in form.tags"
                  :key="index"
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                >
                  {{ tag }}
                  <button
                    type="button"
                    @click="removeTag(index)"
                    class="ml-2 text-primary-600 hover:text-primary-800"
                    :disabled="loading"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </span>
              </div>
              <input
                id="tags"
                v-model="tagInput"
                type="text"
                class="input-field w-full"
                placeholder="Escribe una etiqueta y presiona Enter"
                @keydown="handleTagInput"
                :disabled="loading"
              />
              <div class="text-xs text-gray-500 mt-1">Máximo 10 etiquetas</div>
            </div>

            <!-- Botones -->
            <div class="flex justify-end space-x-4 pt-6 border-t">
              <button type="button" @click="closeModal" class="btn-secondary" :disabled="loading">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary"
                :disabled="loading || !isFormValid"
                :class="{ 'opacity-50 cursor-not-allowed': loading || !isFormValid }"
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
                  Subiendo...
                </span>
                <span v-else>Subir producto</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Teleport styles are handled by Tailwind classes */
</style>
