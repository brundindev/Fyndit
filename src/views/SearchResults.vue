<script setup lang="ts">
import { Search, Filter, ChevronDown, Loader2 } from 'lucide-vue-next'
import ProductCard from '@/components/ProductCard.vue'
import { useSearch } from '@/composables/useSearch'

const {
  searchQuery,
  loading,
  error,
  products,
  filters,
  totalResults,
  hasMore,
  updateFilters,
  updateSearchQuery,
  clearFilters,
  loadMore,
} = useSearch()

// Categorías para el filtro
const categories = [
  { value: '', label: 'Todas las categorías' },
  { value: 'electronica', label: 'Electrónica' },
  { value: 'moda', label: 'Moda' },
  { value: 'hogar', label: 'Hogar' },
  { value: 'deportes', label: 'Deportes' },
  { value: 'vehiculos', label: 'Vehículos' },
  { value: 'inmuebles', label: 'Inmuebles' },
  { value: 'libros', label: 'Libros' },
  { value: 'musica', label: 'Música' },
  { value: 'arte', label: 'Arte' },
  { value: 'otros', label: 'Otros' },
]

// Estados para el filtro
const conditions = [
  { value: '', label: 'Cualquier estado' },
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'como-nuevo', label: 'Como nuevo' },
  { value: 'bueno', label: 'Bueno' },
  { value: 'aceptable', label: 'Aceptable' },
  { value: 'para-reparar', label: 'Para reparar' },
]

// Opciones de ordenamiento
const sortOptions = [
  { value: 'recent', label: 'Más recientes' },
  { value: 'price-low', label: 'Precio: menor a mayor' },
  { value: 'price-high', label: 'Precio: mayor a menor' },
  { value: 'popularity', label: 'Más populares' },
]

const handleSearchChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  updateSearchQuery(target.value)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Header de búsqueda -->
      <div class="mb-8">
        <div class="flex flex-col md:flex-row gap-4 mb-6">
          <!-- Barra de búsqueda -->
          <div class="flex-1">
            <div class="relative">
              <input
                :value="searchQuery"
                @input="handleSearchChange"
                type="text"
                placeholder="Buscar productos..."
                class="input-field w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-primary-500"
              />
              <Search
                class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              />
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex items-center gap-4 mb-4">
            <Filter class="w-5 h-5 text-gray-600" />
            <h3 class="font-semibold text-gray-900">Filtros</h3>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Categoría -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
              <select
                :value="filters.category"
                @change="updateFilters({ category: ($event.target as HTMLSelectElement).value })"
                class="input-field"
              >
                <option
                  v-for="category in categories"
                  :key="category.value"
                  :value="category.value"
                >
                  {{ category.label }}
                </option>
              </select>
            </div>

            <!-- Estado -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                :value="filters.condition"
                @change="updateFilters({ condition: ($event.target as HTMLSelectElement).value })"
                class="input-field"
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

            <!-- Precio mínimo -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Precio mínimo</label>
              <input
                :value="filters.priceMin || ''"
                @input="
                  updateFilters({
                    priceMin: parseInt(($event.target as HTMLInputElement).value) || 0,
                  })
                "
                type="number"
                placeholder="0"
                min="0"
                class="input-field"
              />
            </div>

            <!-- Precio máximo -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Precio máximo</label>
              <input
                :value="filters.priceMax || ''"
                @input="
                  updateFilters({
                    priceMax: parseInt(($event.target as HTMLInputElement).value) || 0,
                  })
                "
                type="number"
                placeholder="Sin límite"
                min="0"
                class="input-field"
              />
            </div>
          </div>

          <!-- Botón limpiar filtros -->
          <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <button
              @click="clearFilters"
              class="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpiar filtros
            </button>

            <!-- Ordenamiento -->
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">Ordenar por:</span>
              <select
                :value="filters.sortBy"
                @change="updateFilters({ sortBy: ($event.target as HTMLSelectElement).value })"
                class="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Resultados info -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 mb-2">
              {{ searchQuery ? `Resultados para "${searchQuery}"` : 'Todos los productos' }}
            </h1>
            <p class="text-gray-600">
              {{ loading ? 'Buscando...' : `${totalResults} productos encontrados` }}
            </p>
          </div>
        </div>
      </div>

      <!-- Estado de carga -->
      <div v-if="loading && products.length === 0" class="text-center py-20">
        <Loader2 class="animate-spin w-12 h-12 text-primary-600 mx-auto mb-4" />
        <p class="text-gray-600">Buscando productos...</p>
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
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Error al buscar</h3>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <button @click="() => updateSearchQuery(searchQuery)" class="btn-primary">
          Intentar de nuevo
        </button>
      </div>

      <!-- Resultados -->
      <div v-else-if="products.length > 0">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product as any"
            class="animate-fade-in"
          />
        </div>

        <!-- Botón cargar más -->
        <div v-if="hasMore" class="text-center">
          <button
            @click="loadMore"
            :disabled="loading"
            class="btn-secondary flex items-center space-x-2 mx-auto"
          >
            <Loader2 v-if="loading" class="animate-spin w-4 h-4" />
            <span>{{ loading ? 'Cargando...' : 'Cargar más productos' }}</span>
          </button>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else class="text-center py-20">
        <Search class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 mb-2">
          {{ searchQuery ? 'No se encontraron productos' : 'Realiza una búsqueda' }}
        </h3>
        <p class="text-gray-600 mb-6">
          {{
            searchQuery
              ? 'Intenta con otros términos de búsqueda o ajusta los filtros'
              : 'Escribe algo en la barra de búsqueda para encontrar productos'
          }}
        </p>
        <router-link to="/" class="btn-primary">Explorar productos</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
