import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getProduct, searchProducts } from '@/firebase/products'
import type { Product as FirebaseProduct } from '@/types/firebase'

export function useProductDetail() {
  const route = useRoute()
  const productId = route.params.id as string

  // Estado reactivo
  const isFavorite = ref(false)
  const loading = ref(false)
  const error = ref('')
  const product = ref<FirebaseProduct | null>(null)
  const relatedProducts = ref<FirebaseProduct[]>([])

  // Cargar producto desde Firebase
  const loadProduct = async () => {
    loading.value = true
    error.value = ''

    try {
      const result = await getProduct(productId)

      if (result.success && result.data) {
        product.value = result.data
        // Cargar productos relacionados de la misma categoría
        await loadRelatedProducts(result.data.category)
      } else {
        error.value = result.error || 'Producto no encontrado'
      }
    } catch (err) {
      error.value = 'Error al cargar el producto'
      console.error('Error loading product:', err)
    } finally {
      loading.value = false
    }
  }

  // Cargar productos relacionados
  const loadRelatedProducts = async (category: string) => {
    try {
      const result = await searchProducts(
        {
          category: category as any,
          sortBy: 'recent',
        },
        4, // Solo 4 productos relacionados
      )

      if (result.success && result.data) {
        // Filtrar el producto actual de los relacionados
        relatedProducts.value = result.data.items.filter((p) => p.id !== productId)
      }
    } catch (err) {
      console.error('Error loading related products:', err)
    }
  }

  // Métodos
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`
    return `Hace ${Math.floor(diffDays / 30)} meses`
  }

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      new: 'bg-green-100 text-green-800',
      excellent: 'bg-blue-100 text-blue-800',
      good: 'bg-yellow-100 text-yellow-800',
      fair: 'bg-orange-100 text-orange-800',
    }
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (status: string) => {
    const texts = {
      new: 'Nuevo',
      excellent: 'Excelente',
      good: 'Bueno',
      fair: 'Regular',
    }
    return texts[status as keyof typeof texts] || status
  }

  const getCategoryName = (slug: string) => {
    const categories = {
      electronica: 'Electrónica',
      motor: 'Motor',
      hogar: 'Hogar',
      moda: 'Moda',
      deportes: 'Deportes',
      ocio: 'Ocio',
    }
    return categories[slug as keyof typeof categories] || slug
  }

  const toggleFavorite = () => {
    isFavorite.value = !isFavorite.value
    // Aquí se haría la llamada a la API
  }

  onMounted(() => {
    loadProduct()
  })

  return {
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
    loadProduct,
  }
}
