import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Smartphone, Car, Home, Shirt, Dumbbell, Gamepad2 } from 'lucide-vue-next'
import type { Product as FirebaseProduct, SearchFilters, ProductCondition } from '@/types/firebase'
import { searchProducts } from '@/firebase/products'

export function useHome() {
  const router = useRouter()

  // Estado reactivo
  const heroSearchQuery = ref('')
  const filters = ref({
    category: '',
    priceRange: '',
    condition: '',
  })
  const sortBy = ref('recent')
  const currentPage = ref(1)
  const itemsPerPage = 12

  // Categorías
  const categories = ref([
    { id: '1', name: 'Electrónica', slug: 'electronica', count: 0, icon: Smartphone },
    { id: '2', name: 'Vehículos', slug: 'vehiculos', count: 0, icon: Car },
    { id: '3', name: 'Hogar', slug: 'hogar', count: 0, icon: Home },
    { id: '4', name: 'Moda', slug: 'moda', count: 0, icon: Shirt },
    { id: '5', name: 'Deportes', slug: 'deportes', count: 0, icon: Dumbbell },
    { id: '6', name: 'Otros', slug: 'otros', count: 0, icon: Gamepad2 },
  ])

  // Convertir filtros del UI a filtros de Firebase
  const convertToFirebaseFilters = (): SearchFilters => {
    const firebaseFilters: SearchFilters = {}

    if (filters.value.category) {
      firebaseFilters.category = filters.value.category as any
    }

    if (filters.value.priceRange) {
      const [min, max] = filters.value.priceRange.split('-').map((v) => v.replace('+', ''))
      firebaseFilters.priceRange = {
        min: parseInt(min) || 0,
        max: max ? parseInt(max) : 999999,
      }
    }

    if (filters.value.condition) {
      const conditionMap: Record<string, ProductCondition> = {
        new: 'nuevo',
        excellent: 'como-nuevo',
        good: 'bueno',
        fair: 'aceptable',
      }
      firebaseFilters.condition = [conditionMap[filters.value.condition] || 'bueno']
    }

    // Mapear sortBy
    const sortMap: Record<string, any> = {
      recent: 'recent',
      'price-asc': 'price-low',
      'price-desc': 'price-high',
      popular: 'popularity',
    }
    firebaseFilters.sortBy = sortMap[sortBy.value] || 'recent'

    return firebaseFilters
  }

  // Cargar productos desde Firebase
  const loadProducts = async () => {
    loading.value = true
    error.value = ''

    try {
      const firebaseFilters = convertToFirebaseFilters()
      const result = await searchProducts(firebaseFilters, 50) // Cargar más productos para paginación local

      if (result.success && result.data) {
        products.value = result.data.items
      } else {
        error.value = result.error || 'Error al cargar productos'
      }
    } catch (err) {
      error.value = 'Error inesperado al cargar productos'
      console.error('Error loading products:', err)
    } finally {
      loading.value = false
    }
  }

  const products = ref<FirebaseProduct[]>([])
  const loading = ref(false)
  const error = ref('')

  // Los productos ya vienen filtrados desde Firebase, solo devolvemos la referencia
  const filteredProducts = computed(() => products.value)

  const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage))

  const paginatedProducts = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredProducts.value.slice(start, end)
  })

  const visiblePages = computed(() => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages.value, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    return pages
  })

  // Métodos
  const handleHeroSearch = () => {
    if (heroSearchQuery.value.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(heroSearchQuery.value)}`)
    }
  }

  const goToCategory = async (slug: string) => {
    filters.value.category = slug
    currentPage.value = 1
    await loadProducts()
  }

  const clearFilters = async () => {
    filters.value = {
      category: '',
      priceRange: '',
      condition: '',
    }
    currentPage.value = 1
    await loadProducts()
  }

  // Recargar productos cuando cambien filtros o sortBy
  const applyFilters = async () => {
    currentPage.value = 1
    await loadProducts()
  }

  const goToPage = (page: number) => {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Cargar productos al montar el componente
  onMounted(() => {
    loadProducts()
  })

  return {
    heroSearchQuery,
    filters,
    sortBy,
    currentPage,
    categories,
    products,
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
    loadProducts,
  }
}
