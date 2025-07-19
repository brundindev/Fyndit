<template>
  <div
    class="card overflow-hidden cursor-pointer group"
    @click="goToProduct"
    v-motion-slide-visible-once-bottom
  >
    <!-- Imagen del producto -->
    <div class="relative overflow-hidden">
      <img
        :src="product.images?.[0]?.url || '/placeholder-image.jpg'"
        :alt="product.title"
        class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />

      <!-- Overlay con gradiente -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      ></div>

      <!-- Botón de favorito -->
      <button
        @click.stop="toggleFavorite"
        class="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200 transform hover:scale-110"
        :class="{ 'text-red-500': isFavorite, 'text-gray-600': !isFavorite }"
      >
        <Heart class="w-5 h-5" :fill="isFavorite ? 'currentColor' : 'none'" />
      </button>

      <!-- Badge de estado -->
      <div
        v-if="product.condition"
        class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium"
        :class="getStatusBadgeClass(product.condition)"
      >
        {{ getStatusText(product.condition) }}
      </div>

      <!-- Precio destacado -->
      <div
        class="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg shadow-md"
      >
        <span class="text-lg font-bold text-gray-900">{{ formatPrice(product.price) }}</span>
      </div>
    </div>

    <!-- Contenido de la tarjeta -->
    <div class="p-4">
      <div class="flex items-start justify-between mb-2">
        <h3
          class="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200"
        >
          {{ product.title }}
        </h3>
      </div>

      <p class="text-sm text-gray-600 line-clamp-2 mb-3">
        {{ product.description }}
      </p>

      <!-- Información adicional -->
      <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
        <div class="flex items-center space-x-1">
          <MapPin class="w-4 h-4" />
          <span>{{ product.location?.city || 'Sin ubicación' }}</span>
        </div>
        <div class="flex items-center space-x-1">
          <Clock class="w-4 h-4" />
          <span>{{ formatTimeAgo(product.createdAt) }}</span>
        </div>
      </div>

      <!-- Contadores de visitas y favoritos -->
      <div class="flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-1">
            <Eye class="w-3.5 h-3.5" />
            <span>{{ formatNumber(currentProduct.views || 0) }} vistas</span>
          </div>
          <div class="flex items-center space-x-1">
            <Heart class="w-3.5 h-3.5" />
            <span>{{ formatNumber(currentProduct.favorites || 0) }} favoritos</span>
          </div>
        </div>
      </div>

      <!-- Vendedor -->
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div class="flex items-center space-x-2">
          <div class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
            <User class="w-4 h-4 text-gray-600" />
          </div>
          <span class="text-sm text-gray-600">{{
            product.sellerInfo?.displayName || 'Vendedor'
          }}</span>
        </div>

        <!-- Rating del vendedor -->
        <div class="flex items-center space-x-1">
          <Star class="w-4 h-4 text-yellow-400 fill-current" />
          <span class="text-sm text-gray-600">{{ product.sellerInfo?.rating || 'N/A' }}</span>
        </div>
      </div>
    </div>

    <!-- Efecto hover -->
    <div
      class="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Heart, MapPin, Clock, User, Star, Eye } from 'lucide-vue-next'
import { Timestamp } from 'firebase/firestore'
import { useFavoritesStore } from '@/stores/favorites'
import { useProductsStore } from '@/stores/products'
import type { Product } from '@/types/firebase'

interface Props {
  product: Product
}

const props = defineProps<Props>()
const router = useRouter()
const favoritesStore = useFavoritesStore()
const productsStore = useProductsStore()

// Producto actualizado desde el store (con contadores reactivos)
const currentProduct = computed(() => {
  return productsStore.getProduct(props.product.id) || props.product
})

// Estado reactivo del store
const isFavorite = computed(() => favoritesStore.isFavorite(props.product.id))

// Guardar producto en el store al montar
onMounted(() => {
  productsStore.setProduct(props.product)
})

// Métodos
const goToProduct = () => {
  router.push(`/producto/${props.product.id}`)
}

const toggleFavorite = () => {
  favoritesStore.toggleFavorite(props.product.id)
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

const formatTimeAgo = (timestamp: Timestamp | Date | string) => {
  let date: Date
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate()
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else {
    date = new Date(timestamp)
  }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
  return `Hace ${Math.floor(diffDays / 30)} meses`
}

const getStatusBadgeClass = (condition: string) => {
  const classes = {
    nuevo: 'bg-green-100 text-green-800',
    'como-nuevo': 'bg-blue-100 text-blue-800',
    bueno: 'bg-yellow-100 text-yellow-800',
    aceptable: 'bg-orange-100 text-orange-800',
    'para-reparar': 'bg-red-100 text-red-800',
  }
  return classes[condition as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (condition: string) => {
  const texts = {
    nuevo: 'Nuevo',
    'como-nuevo': 'Como nuevo',
    bueno: 'Bueno',
    aceptable: 'Aceptable',
    'para-reparar': 'Para reparar',
  }
  return texts[condition as keyof typeof texts] || condition
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
