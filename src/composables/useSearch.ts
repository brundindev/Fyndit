import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Product, SearchFilters, ProductCondition, ProductCategory } from '@/types/firebase'
import { searchProducts } from '@/firebase/products'

export function useSearch() {
  const route = useRoute()
  const router = useRouter()

  // Estado reactivo
  const searchQuery = ref((route.query.q as string) || '')
  const loading = ref(false)
  const error = ref('')
  const products = ref<Product[]>([])

  // Filtros
  const filters = ref({
    category: (route.query.category as string) || '',
    condition: (route.query.condition as string) || '',
    priceMin: parseInt(route.query.priceMin as string) || 0,
    priceMax: parseInt(route.query.priceMax as string) || 0,
    sortBy: (route.query.sortBy as string) || 'recent',
  })

  // Paginación
  const currentPage = ref(1)
  const itemsPerPage = ref(20)
  const lastDoc = ref()
  const hasMore = ref(true)

  // Computadas
  const totalResults = computed(() => products.value.length)

  const paginatedProducts = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return products.value.slice(start, end)
  })

  // Métodos
  const buildSearchFilters = (): SearchFilters => {
    const searchFilters: SearchFilters = {}

    // Añadir texto de búsqueda
    if (searchQuery.value.trim()) {
      searchFilters.searchText = searchQuery.value.trim()
    }

    if (filters.value.category) {
      searchFilters.category = filters.value.category as ProductCategory
    }

    if (filters.value.condition) {
      const conditionMap: Record<string, ProductCondition> = {
        nuevo: 'nuevo',
        'como-nuevo': 'como-nuevo',
        bueno: 'bueno',
        aceptable: 'aceptable',
        'para-reparar': 'para-reparar',
      }
      searchFilters.condition = [conditionMap[filters.value.condition] || 'bueno']
    }

    if (filters.value.priceMin > 0 || filters.value.priceMax > 0) {
      searchFilters.priceRange = {
        min: filters.value.priceMin,
        max: filters.value.priceMax || 999999,
      }
    }

    const sortMap: Record<string, any> = {
      recent: 'recent',
      'price-low': 'price-low',
      'price-high': 'price-high',
      popularity: 'popularity',
    }
    searchFilters.sortBy = sortMap[filters.value.sortBy] || 'recent'

    return searchFilters
  }

  const performSearch = async (resetPagination = true) => {
    if (!searchQuery.value.trim()) {
      products.value = []
      return
    }

    try {
      loading.value = true
      error.value = ''

      if (resetPagination) {
        currentPage.value = 1
        lastDoc.value = undefined
        products.value = []
      }

      const searchFilters = buildSearchFilters()
      const result = await searchProducts(searchFilters, itemsPerPage.value, lastDoc.value)

      if (result.success && result.data) {
        if (resetPagination) {
          products.value = result.data.items
        } else {
          products.value.push(...result.data.items)
        }

        hasMore.value = result.data.hasMore
        lastDoc.value = result.data.lastDoc
      } else {
        error.value = result.error || 'Error al buscar productos'
      }
    } catch (err) {
      console.error('Error en búsqueda:', err)
      error.value = 'Error inesperado en la búsqueda'
    } finally {
      loading.value = false
    }
  }

  const loadMore = async () => {
    if (!hasMore.value || loading.value) return
    await performSearch(false)
  }

  const updateFilters = (newFilters: Partial<typeof filters.value>) => {
    Object.assign(filters.value, newFilters)
    updateURLParams()
    performSearch(true)
  }

  const updateSearchQuery = (query: string) => {
    searchQuery.value = query
    updateURLParams()
    performSearch(true)
  }

  const updateURLParams = () => {
    const query: Record<string, string> = {}

    if (searchQuery.value) query.q = searchQuery.value
    if (filters.value.category) query.category = filters.value.category
    if (filters.value.condition) query.condition = filters.value.condition
    if (filters.value.priceMin > 0) query.priceMin = filters.value.priceMin.toString()
    if (filters.value.priceMax > 0) query.priceMax = filters.value.priceMax.toString()
    if (filters.value.sortBy !== 'recent') query.sortBy = filters.value.sortBy

    router.replace({
      path: '/buscar',
      query,
    })
  }

  const clearFilters = () => {
    filters.value = {
      category: '',
      condition: '',
      priceMin: 0,
      priceMax: 0,
      sortBy: 'recent',
    }
    updateURLParams()
    performSearch(true)
  }

  // Observar cambios en la query de la URL
  watch(
    () => route.query,
    (newQuery) => {
      const newSearchQuery = (newQuery.q as string) || ''
      if (newSearchQuery !== searchQuery.value) {
        searchQuery.value = newSearchQuery
        performSearch(true)
      }
    },
  )

  // Buscar al montar si hay query
  onMounted(() => {
    if (searchQuery.value.trim()) {
      performSearch(true)
    }
  })

  return {
    // Estado
    searchQuery,
    loading,
    error,
    products,
    filters,
    currentPage,
    totalResults,
    paginatedProducts,
    hasMore,

    // Métodos
    performSearch,
    loadMore,
    updateFilters,
    updateSearchQuery,
    clearFilters,
  }
}
