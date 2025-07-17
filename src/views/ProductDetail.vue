<script setup lang="ts">
import { MapPin, Clock, User, Star, MessageCircle, Heart, Share } from 'lucide-vue-next'
import ProductCard from '@/components/ProductCard.vue'
import { useProductDetail } from '@/composables/useProductDetail'

const {
  isFavorite,
  product,
  relatedProducts,
  loading,
  error,
  formatPrice,
  formatTimeAgo,
  getStatusBadgeClass,
  getStatusText,
  getCategoryName,
  toggleFavorite,
} = useProductDetail()

// Función para formatear ubicación
const formatLocation = (
  location: string | { city?: string; state?: string; country?: string } | null | undefined,
) => {
  if (!location) return 'Sin ubicación'

  if (typeof location === 'string') {
    return location
  }

  if (typeof location === 'object') {
    const parts = []
    if (location.city) parts.push(location.city)
    if (location.state) parts.push(location.state)
    if (location.country) parts.push(location.country)
    return parts.join(', ') || 'Sin ubicación'
  }

  return 'Sin ubicación'
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Estado de carga -->
      <div v-if="loading" class="text-center py-20">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"
        ></div>
        <p class="text-gray-600">Cargando producto...</p>
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
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Error al cargar producto</h3>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <router-link to="/" class="btn-primary">Volver al inicio</router-link>
      </div>

      <!-- Contenido del producto -->
      <div v-else-if="product">
        <!-- Breadcrumb -->
        <nav class="flex mb-6" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-2">
            <li>
              <router-link to="/" class="text-gray-500 hover:text-gray-700">Inicio</router-link>
            </li>
            <li class="text-gray-400">/</li>
            <li>
              <router-link
                :to="`/categoria/${product.category}`"
                class="text-gray-500 hover:text-gray-700"
              >
                {{ getCategoryName(product.category) }}
              </router-link>
            </li>
            <li class="text-gray-400">/</li>
            <li class="text-gray-900 font-medium">{{ product.title }}</li>
          </ol>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Galería de imágenes -->
          <div class="space-y-4">
            <div class="aspect-square bg-white rounded-lg overflow-hidden shadow-md">
              <img
                :src="(product as any).images?.[0]?.url || (product as any).image"
                :alt="product.title"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Thumbnails -->
            <div class="grid grid-cols-4 gap-2">
              <div
                v-for="i in 4"
                :key="i"
                class="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img
                  :src="(product as any).images?.[0]?.url || (product as any).image"
                  :alt="`${product.title} ${i}`"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <!-- Información del producto -->
          <div class="space-y-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ product.title }}</h1>
              <div class="flex items-center space-x-4 mb-4">
                <span class="text-3xl font-bold text-primary-600">{{
                  formatPrice(product.price)
                }}</span>
                <span
                  v-if="product.status"
                  class="px-3 py-1 rounded-full text-sm font-medium"
                  :class="getStatusBadgeClass(product.status)"
                >
                  {{ getStatusText(product.status) }}
                </span>
              </div>

              <div class="flex items-center space-x-4 text-sm text-gray-600">
                <div class="flex items-center space-x-1">
                  <MapPin class="w-4 h-4" />
                  <span>{{ formatLocation(product.location) }}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <Clock class="w-4 h-4" />
                  <span>{{
                    formatTimeAgo((product as any).createdAt?.toDate?.() || product.createdAt)
                  }}</span>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg p-6 shadow-md">
              <h3 class="text-lg font-semibold mb-3">Descripción</h3>
              <p class="text-gray-700 leading-relaxed">{{ product.description }}</p>
            </div>

            <!-- Vendedor -->
            <div class="bg-white rounded-lg p-6 shadow-md">
              <h3 class="text-lg font-semibold mb-4">Vendedor</h3>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User class="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div class="font-semibold text-gray-900">
                      {{
                        (product as any).seller?.name ||
                        (product as any).sellerInfo?.displayName ||
                        'Usuario'
                      }}
                    </div>
                    <div class="flex items-center space-x-1">
                      <Star class="w-4 h-4 text-yellow-400 fill-current" />
                      <span class="text-sm text-gray-600">{{
                        (product as any).seller?.rating ||
                        (product as any).sellerInfo?.rating ||
                        5.0
                      }}</span>
                    </div>
                  </div>
                </div>
                <button class="btn-secondary">Ver perfil</button>
              </div>
            </div>

            <!-- Acciones -->
            <div class="space-y-3">
              <button class="btn-primary w-full py-4 text-lg">
                <MessageCircle class="w-5 h-5 mr-2" />
                Contactar vendedor
              </button>
              <button
                @click="toggleFavorite"
                class="btn-secondary w-full py-4 text-lg"
                :class="{ 'text-red-500': isFavorite }"
              >
                <Heart class="w-5 h-5 mr-2" :fill="isFavorite ? 'currentColor' : 'none'" />
                {{ isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos' }}
              </button>
              <button class="btn-secondary w-full py-4 text-lg">
                <Share class="w-5 h-5 mr-2" />
                Compartir
              </button>
            </div>
          </div>
        </div>

        <!-- Productos relacionados -->
        <section class="mt-16">
          <h2 class="text-2xl font-bold mb-8">Productos similares</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductCard
              v-for="relatedProduct in relatedProducts"
              :key="relatedProduct.id"
              :product="relatedProduct as any"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
