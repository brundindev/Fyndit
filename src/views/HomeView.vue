<script setup lang="ts">
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import ProductCard from '@/components/ProductCard.vue'
import { useHome } from '@/composables/useHome'

const {
  heroSearchQuery,
  filters,
  sortBy,
  currentPage,
  categories,
  filteredProducts,
  totalPages,
  paginatedProducts,
  visiblePages,
  loading,
  error,
  handleHeroSearch,
  goToCategory,
  clearFilters,
  goToPage,
  applyFilters,
} = useHome()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-primary-600 to-secondary-600 text-white py-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
          Encuentra todo lo que buscas
        </h1>
        <p class="text-xl md:text-2xl mb-8 opacity-90 animate-slide-up">
          El marketplace de segunda mano más grande de España
        </p>
        <div class="max-w-2xl mx-auto">
          <div class="relative">
            <input
              v-model="heroSearchQuery"
              type="text"
              placeholder="¿Qué estás buscando?"
              class="w-full px-6 py-4 text-lg rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30"
              @keyup.enter="handleHeroSearch"
            />
            <button
              @click="handleHeroSearch"
              class="absolute right-2 top-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-full transition-colors duration-200"
            >
              <Search class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Categorías destacadas -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Explora por categorías</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 stagger-animation">
          <div
            v-for="category in categories"
            :key="category.id"
            class="group cursor-pointer"
            @click="goToCategory(category.slug)"
          >
            <div
              class="bg-gray-100 rounded-xl p-6 text-center group-hover:bg-primary-50 transition-colors duration-300"
            >
              <div
                class="w-12 h-12 mx-auto mb-3 text-primary-600 group-hover:scale-110 transition-transform duration-300"
              >
                <component :is="category.icon" class="w-full h-full" />
              </div>
              <h3 class="font-semibold text-gray-900">{{ category.name }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ category.count }} productos</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Filtros y ordenación -->
    <section class="py-8 bg-gray-50 border-b border-gray-200">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex items-center space-x-2">
              <Filter class="w-5 h-5 text-gray-600" />
              <span class="font-medium text-gray-900">Filtros:</span>
            </div>
            <select
              v-model="filters.category"
              @change="applyFilters"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              <option v-for="category in categories" :key="category.id" :value="category.slug">
                {{ category.name }}
              </option>
            </select>
            <select
              v-model="filters.priceRange"
              @change="applyFilters"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Cualquier precio</option>
              <option value="0-50">Hasta 50€</option>
              <option value="50-100">50€ - 100€</option>
              <option value="100-500">100€ - 500€</option>
              <option value="500+">Más de 500€</option>
            </select>
            <select
              v-model="filters.condition"
              @change="applyFilters"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Cualquier estado</option>
              <option value="new">Nuevo</option>
              <option value="excellent">Excelente</option>
              <option value="good">Bueno</option>
              <option value="fair">Regular</option>
            </select>
          </div>

          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">{{ filteredProducts.length }} productos</span>
            <select
              v-model="sortBy"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="recent">Más recientes</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="popular">Más populares</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <!-- Grid de productos -->
    <section class="py-12">
      <div class="container mx-auto px-4">
        <div
          v-if="filteredProducts.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <ProductCard
            v-for="product in paginatedProducts"
            :key="product.id"
            :product="product as any"
            class="fade-in-up"
          />
        </div>

        <!-- Estado de carga -->
        <div v-else-if="loading" class="text-center py-20">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"
          ></div>
          <p class="text-gray-600">Cargando productos...</p>
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
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Error al cargar productos</h3>
          <p class="text-gray-600 mb-6">{{ error }}</p>
          <button @click="applyFilters" class="btn-primary">Intentar de nuevo</button>
        </div>

        <!-- Estado vacío -->
        <div v-else class="text-center py-20">
          <Search class="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No encontramos productos</h3>
          <p class="text-gray-600 mb-6">Intenta ajustar los filtros o busca algo diferente</p>
          <button @click="clearFilters" class="btn-primary">Limpiar filtros</button>
        </div>

        <!-- Paginación -->
        <div v-if="totalPages > 1" class="flex justify-center items-center space-x-2 mt-12">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>

          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-4 py-2 rounded-lg transition-colors duration-200',
              currentPage === page
                ? 'bg-primary-600 text-white'
                : 'border border-gray-300 hover:bg-gray-50',
            ]"
          >
            {{ page }}
          </button>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
