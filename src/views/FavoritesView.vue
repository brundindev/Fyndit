<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Heart, Trash2 } from 'lucide-vue-next'
import { useFavoritesStore } from '@/stores/favorites'
import ProductCard from '@/components/ProductCard.vue'

const favoritesStore = useFavoritesStore()
const showConfirmModal = ref(false)

// Cargar favoritos cuando se monta la vista
onMounted(async () => {
  await favoritesStore.loadFavorites()
})

const confirmClearFavorites = () => {
  showConfirmModal.value = true
}

const clearAllFavorites = () => {
  favoritesStore.clearFavorites()
  showConfirmModal.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Mis favoritos</h1>
        <div class="text-sm text-gray-600">
          {{ favoritesStore.favoritesCount }} productos guardados
        </div>
      </div>

      <!-- Lista de favoritos -->
      <div v-if="favoritesStore.favoritesCount > 0">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ProductCard
            v-for="product in favoritesStore.favoriteProducts"
            :key="product.id"
            :product="product as any"
            class="animate-fade-in"
          />
        </div>

        <!-- Botón para limpiar favoritos -->
        <div class="text-center mt-12">
          <button
            @click="confirmClearFavorites"
            class="btn-secondary text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Limpiar todos los favoritos
          </button>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else class="text-center py-20">
        <Heart class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No tienes favoritos aún</h3>
        <p class="text-gray-600 mb-6">
          Guarda los productos que te interesen para encontrarlos fácilmente después
        </p>
        <router-link to="/" class="btn-primary"> Explorar productos </router-link>
      </div>
    </div>

    <!-- Modal de confirmación -->
    <div
      v-if="showConfirmModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showConfirmModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md mx-4" @click.stop>
        <h3 class="text-lg font-semibold mb-4">¿Limpiar todos los favoritos?</h3>
        <p class="text-gray-600 mb-6">
          Esta acción no se puede deshacer. Se eliminarán todos los productos de tu lista de
          favoritos.
        </p>
        <div class="flex space-x-3">
          <button @click="clearAllFavorites" class="btn-primary bg-red-600 hover:bg-red-700">
            Sí, limpiar todo
          </button>
          <button @click="showConfirmModal = false" class="btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>
