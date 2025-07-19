import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/firebase/config'
import { toggleProductFavorite } from '@/firebase/products'
import { useAuthStore } from './auth'
import { useProductsStore } from './products'
import type { Product } from '@/types/firebase'

export const useFavoritesStore = defineStore('favorites', () => {
  // Estado
  const favoriteProductIds = ref<Set<string>>(new Set())
  const favoriteProducts = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const favoritesCount = computed(() => favoriteProductIds.value.size)
  const hasFavorites = computed(() => favoritesCount.value > 0)

  // Verificar si un producto está en favoritos
  const isFavorite = computed(() => (productId: string) => {
    return favoriteProductIds.value.has(productId)
  })

  // Acciones
  async function loadFavorites() {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated || !authStore.user) {
      favoriteProductIds.value.clear()
      favoriteProducts.value = []
      return
    }

    // Verificación adicional del estado de autenticación de Firebase
    if (!auth.currentUser) {
      favoriteProductIds.value.clear()
      favoriteProducts.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      // Obtener IDs de productos favoritos
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', authStore.user.uid),
      )

      const favoritesSnapshot = await getDocs(favoritesQuery)
      const productIds = new Set<string>()

      favoritesSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        productIds.add(data.productId)
      })

      favoriteProductIds.value = productIds

      // Cargar detalles de productos favoritos
      await loadFavoriteProducts()
    } catch (err) {
      console.error('Error loading favorites:', err)

      // Si es un error de permisos, simplemente limpiar favoritos en lugar de mostrar error
      if (
        (err instanceof Error && err.message.includes('permission')) ||
        (err instanceof Error && err.message.includes('insufficient'))
      ) {
        favoriteProductIds.value.clear()
        favoriteProducts.value = []
        error.value = null
      } else {
        error.value = err instanceof Error ? err.message : 'Error al cargar favoritos'
      }
    } finally {
      loading.value = false
    }
  }

  async function loadFavoriteProducts() {
    if (favoriteProductIds.value.size === 0) {
      favoriteProducts.value = []
      return
    }

    try {
      const products: Product[] = []

      // Cargar cada producto individualmente
      for (const productId of favoriteProductIds.value) {
        const productRef = doc(db, 'products', productId)
        const productDoc = await getDoc(productRef)

        if (productDoc.exists()) {
          const productData = { id: productDoc.id, ...productDoc.data() } as Product
          // Solo incluir productos activos
          if (productData.status === 'activo') {
            products.push(productData)
          }
        }
      }

      // Ordenar por fecha de agregado (más recientes primero)
      favoriteProducts.value = products.sort(
        (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
      )
    } catch (err) {
      console.error('Error loading favorite products:', err)
      error.value = err instanceof Error ? err.message : 'Error al cargar productos favoritos'
    }
  }

  async function toggleFavorite(productId: string) {
    const authStore = useAuthStore()
    const productsStore = useProductsStore()

    if (!authStore.isAuthenticated) {
      error.value = 'Debes iniciar sesión para usar favoritos'
      return { success: false, error: error.value }
    }

    loading.value = true
    error.value = null

    try {
      const result = await toggleProductFavorite(productId)

      if (result.success) {
        if (result.data) {
          // Producto agregado a favoritos
          favoriteProductIds.value.add(productId)
          // Incrementar contador en el store de productos
          productsStore.incrementProductFavorites(productId)
          // Recargar productos para obtener la información completa
          await loadFavoriteProducts()
        } else {
          // Producto removido de favoritos
          favoriteProductIds.value.delete(productId)
          // Decrementar contador en el store de productos
          productsStore.decrementProductFavorites(productId)
          // Remover de la lista de productos también
          favoriteProducts.value = favoriteProducts.value.filter(
            (product) => product.id !== productId,
          )
        }

        return { success: true, message: result.message, isFavorite: result.data }
      } else {
        error.value = result.error!
        return { success: false, error: result.error }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      error.value = err instanceof Error ? err.message : 'Error al actualizar favoritos'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function removeFavorite(productId: string) {
    if (!favoriteProductIds.value.has(productId)) {
      return { success: true, message: 'Producto no está en favoritos' }
    }

    return await toggleFavorite(productId)
  }

  async function addFavorite(productId: string) {
    if (favoriteProductIds.value.has(productId)) {
      return { success: true, message: 'Producto ya está en favoritos' }
    }

    return await toggleFavorite(productId)
  }

  // Limpiar favoritos (al cerrar sesión)
  function clearFavorites() {
    favoriteProductIds.value.clear()
    favoriteProducts.value = []
    error.value = null
  }

  // Limpiar errores
  function clearError() {
    error.value = null
  }

  // Obtener productos favoritos por categoría
  const getFavoritesByCategory = computed(() => (category: string) => {
    return favoriteProducts.value.filter((product) => product.category === category)
  })

  return {
    // Estado
    favoriteProductIds,
    favoriteProducts,
    loading,
    error,

    // Getters
    favoritesCount,
    hasFavorites,
    isFavorite,
    getFavoritesByCategory,

    // Acciones
    loadFavorites,
    loadFavoriteProducts,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    clearError,
  }
})
