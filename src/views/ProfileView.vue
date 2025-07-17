<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { User, Star, Package, Calendar, MapPin, MessageCircle, Shield, Edit } from 'lucide-vue-next'
import { Timestamp } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import { getUserProducts, getUserById } from '@/firebase/products'
import ProductCard from '@/components/ProductCard.vue'
import type { Product, User as FirebaseUser, Review } from '@/types/firebase'

const route = useRoute()
const authStore = useAuthStore()

// Estado
const profileUser = ref<FirebaseUser | null>(null)
const userProducts = ref<Product[]>([])
const loading = ref(true)
const error = ref('')
const activeTab = ref<'productos' | 'valoraciones' | 'info'>('productos')

// Computed
const isOwnProfile = computed(() => {
  return authStore.user?.uid === profileUser.value?.uid
})

const userId = computed(() => {
  // Si no hay parámetro en la ruta, mostrar perfil propio
  return (route.params.id as string) || authStore.user?.uid
})

const totalRating = computed(() => {
  if (!profileUser.value?.ratings?.length) return 0
  return (
    profileUser.value.ratings.reduce((sum: number, rating: Review) => sum + rating.rating, 0) /
    profileUser.value.ratings.length
  )
})

const productStats = computed(() => {
  const active = userProducts.value.filter((p) => p.status === 'activo').length
  const sold = userProducts.value.filter((p) => p.saleStatus === 'vendido').length
  const total = userProducts.value.length

  return { active, sold, total }
})

// Métodos
const loadProfileData = async () => {
  if (!userId.value) {
    error.value = 'Usuario no encontrado'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = ''

    // Si es perfil propio, usar datos del auth store
    if (isOwnProfile.value && authStore.user) {
      profileUser.value = authStore.user
    } else {
      // Cargar datos del usuario por ID
      const userResult = await getUserById(userId.value)
      if (userResult.success) {
        profileUser.value = userResult.data!
      } else {
        error.value = 'Usuario no encontrado'
        return
      }
    }

    // Cargar productos del usuario
    const productsResult = await getUserProducts(userId.value)
    if (productsResult.success && productsResult.data) {
      userProducts.value = productsResult.data
    }
  } catch (err) {
    console.error('Error loading profile:', err)
    error.value = 'Error al cargar el perfil'
  } finally {
    loading.value = false
  }
}

const formatDate = (timestamp: Timestamp | Date | string | null | undefined) => {
  if (!timestamp) return 'No disponible'
  const date =
    timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp as string | Date)
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

const getRatingStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => i < Math.floor(rating))
}

onMounted(() => {
  loadProfileData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Estado de carga -->
      <div v-if="loading" class="text-center py-20">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"
        ></div>
        <p class="text-gray-600">Cargando perfil...</p>
      </div>

      <!-- Estado de error -->
      <div v-else-if="error" class="text-center py-20">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Error al cargar perfil</h3>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <router-link to="/" class="btn-primary">Volver al inicio</router-link>
      </div>

      <!-- Contenido del perfil -->
      <div v-else-if="profileUser">
        <!-- Header del perfil -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <div
            class="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6"
          >
            <!-- Avatar -->
            <div
              class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <User class="w-12 h-12 text-gray-600" />
            </div>

            <!-- Información principal -->
            <div class="flex-1 text-center md:text-left">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 mb-2">
                    {{ profileUser.displayName }}
                  </h1>
                  <p class="text-gray-600 mb-2">@{{ profileUser.username }}</p>

                  <!-- Rating -->
                  <div class="flex items-center justify-center md:justify-start space-x-2 mb-3">
                    <div class="flex">
                      <Star
                        v-for="(filled, index) in getRatingStars(totalRating)"
                        :key="index"
                        class="w-5 h-5"
                        :class="filled ? 'text-yellow-400 fill-current' : 'text-gray-300'"
                      />
                    </div>
                    <span class="text-sm font-medium text-gray-700">
                      {{ totalRating.toFixed(1) }} ({{ profileUser.ratings?.length || 0 }}
                      valoraciones)
                    </span>
                  </div>

                  <!-- Información adicional -->
                  <div
                    class="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-600"
                  >
                    <div class="flex items-center space-x-1">
                      <Calendar class="w-4 h-4" />
                      <span>Miembro desde {{ formatDate(profileUser.createdAt) }}</span>
                    </div>
                    <div v-if="profileUser.location" class="flex items-center space-x-1">
                      <MapPin class="w-4 h-4" />
                      <span>{{ profileUser.location }}</span>
                    </div>
                  </div>
                </div>

                <!-- Botones de acción -->
                <div class="flex space-x-3 mt-4 md:mt-0">
                  <router-link
                    v-if="isOwnProfile"
                    to="/editar-perfil"
                    class="btn-secondary flex items-center space-x-2"
                  >
                    <Edit class="w-4 h-4" />
                    <span>Editar perfil</span>
                  </router-link>
                  <button v-else class="btn-primary flex items-center space-x-2">
                    <MessageCircle class="w-4 h-4" />
                    <span>Enviar mensaje</span>
                  </button>
                </div>
              </div>

              <!-- Estadísticas -->
              <div class="grid grid-cols-3 gap-4 text-center">
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-2xl font-bold text-primary-600">{{ productStats.total }}</div>
                  <div class="text-sm text-gray-600">Productos totales</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-2xl font-bold text-green-600">{{ productStats.active }}</div>
                  <div class="text-sm text-gray-600">En venta</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-2xl font-bold text-blue-600">{{ productStats.sold }}</div>
                  <div class="text-sm text-gray-600">Vendidos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow-md">
          <!-- Tab headers -->
          <div class="border-b border-gray-200">
            <nav class="flex space-x-8 px-6">
              <button
                @click="activeTab = 'productos'"
                class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
                :class="
                  activeTab === 'productos'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                "
              >
                <Package class="w-4 h-4 inline mr-2" />
                Productos ({{ productStats.total }})
              </button>
              <button
                @click="activeTab = 'valoraciones'"
                class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
                :class="
                  activeTab === 'valoraciones'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                "
              >
                <Star class="w-4 h-4 inline mr-2" />
                Valoraciones ({{ profileUser.ratings?.length || 0 }})
              </button>
              <button
                @click="activeTab = 'info'"
                class="py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
                :class="
                  activeTab === 'info'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                "
              >
                <Shield class="w-4 h-4 inline mr-2" />
                Información
              </button>
            </nav>
          </div>

          <!-- Tab content -->
          <div class="p-6">
            <!-- Tab: Productos -->
            <div v-if="activeTab === 'productos'">
              <div
                v-if="userProducts.length > 0"
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <ProductCard
                  v-for="product in userProducts"
                  :key="product.id"
                  :product="product as any"
                  class="animate-fade-in"
                />
              </div>
              <div v-else class="text-center py-16">
                <Package class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 class="text-xl font-semibold text-gray-900 mb-2">
                  {{
                    isOwnProfile ? 'No has subido productos aún' : 'Este usuario no tiene productos'
                  }}
                </h3>
                <p class="text-gray-600 mb-6">
                  {{
                    isOwnProfile
                      ? 'Sube tu primer producto y comienza a vender'
                      : 'Explora otros productos en nuestra plataforma'
                  }}
                </p>
                <router-link v-if="isOwnProfile" to="/" class="btn-primary">
                  Subir producto
                </router-link>
                <router-link v-else to="/" class="btn-primary"> Explorar productos </router-link>
              </div>
            </div>

            <!-- Tab: Valoraciones -->
            <div v-else-if="activeTab === 'valoraciones'">
              <div v-if="profileUser.ratings && profileUser.ratings.length > 0" class="space-y-4">
                <div
                  v-for="rating in profileUser.ratings"
                  :key="rating.id"
                  class="bg-gray-50 rounded-lg p-4"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                      <div
                        class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"
                      >
                        <User class="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <div class="font-medium text-gray-900">Usuario</div>
                        <div class="flex">
                          <Star
                            v-for="(filled, index) in getRatingStars(rating.rating)"
                            :key="index"
                            class="w-4 h-4"
                            :class="filled ? 'text-yellow-400 fill-current' : 'text-gray-300'"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="text-sm text-gray-500">{{ formatDate(rating.createdAt) }}</div>
                  </div>
                  <p class="text-gray-700">{{ rating.comment }}</p>
                </div>
              </div>
              <div v-else class="text-center py-16">
                <Star class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Sin valoraciones</h3>
                <p class="text-gray-600">
                  {{
                    isOwnProfile
                      ? 'Aún no tienes valoraciones'
                      : 'Este usuario aún no tiene valoraciones'
                  }}
                </p>
              </div>
            </div>

            <!-- Tab: Información -->
            <div v-else-if="activeTab === 'info'">
              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Información de la cuenta</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                      <div class="text-sm text-gray-600 mb-1">Nombre</div>
                      <div class="font-medium text-gray-900">{{ profileUser.displayName }}</div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4">
                      <div class="text-sm text-gray-600 mb-1">Username</div>
                      <div class="font-medium text-gray-900">@{{ profileUser.username }}</div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4">
                      <div class="text-sm text-gray-600 mb-1">Ubicación</div>
                      <div class="font-medium text-gray-900">
                        {{ profileUser.location || 'No especificada' }}
                      </div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4">
                      <div class="text-sm text-gray-600 mb-1">Miembro desde</div>
                      <div class="font-medium text-gray-900">
                        {{ formatDate(profileUser.createdAt) }}
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="profileUser.bio">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Biografía</h3>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-gray-700 leading-relaxed">{{ profileUser.bio }}</p>
                  </div>
                </div>

                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Actividad reciente</h3>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-center text-gray-600">
                      <Calendar class="w-8 h-8 mx-auto mb-2" />
                      <p>Información de actividad disponible próximamente</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
