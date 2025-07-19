import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Product } from '@/types/firebase'

export const useProductsStore = defineStore('products', () => {
  // Cache de productos por ID
  const productsCache = ref<Map<string, Product>>(new Map())

  // Getters
  const getProduct = computed(() => (productId: string) => {
    return productsCache.value.get(productId)
  })

  // Acciones
  function setProduct(product: Product) {
    productsCache.value.set(product.id, product)
  }

  function setProducts(products: Product[]) {
    products.forEach((product) => {
      productsCache.value.set(product.id, product)
    })
  }

  function updateProductCounters(productId: string, views?: number, favorites?: number) {
    const product = productsCache.value.get(productId)
    if (product) {
      const updatedProduct = { ...product }
      if (views !== undefined) updatedProduct.views = views
      if (favorites !== undefined) updatedProduct.favorites = favorites
      productsCache.value.set(productId, updatedProduct)
    }
  }

  function incrementProductViews(productId: string) {
    const product = productsCache.value.get(productId)
    if (product) {
      const updatedProduct = { ...product, views: (product.views || 0) + 1 }
      productsCache.value.set(productId, updatedProduct)
    }
  }

  function incrementProductFavorites(productId: string) {
    const product = productsCache.value.get(productId)
    if (product) {
      const updatedProduct = { ...product, favorites: (product.favorites || 0) + 1 }
      productsCache.value.set(productId, updatedProduct)
    }
  }

  function decrementProductFavorites(productId: string) {
    const product = productsCache.value.get(productId)
    if (product) {
      const updatedProduct = { ...product, favorites: Math.max((product.favorites || 0) - 1, 0) }
      productsCache.value.set(productId, updatedProduct)
    }
  }

  function removeProduct(productId: string) {
    productsCache.value.delete(productId)
  }

  function clearCache() {
    productsCache.value.clear()
  }

  // Obtener productos actualizados para una lista
  function getUpdatedProducts(products: Product[]): Product[] {
    return products.map((product) => {
      const cachedProduct = productsCache.value.get(product.id)
      return cachedProduct || product
    })
  }

  return {
    // Estado
    productsCache,

    // Getters
    getProduct,

    // Acciones
    setProduct,
    setProducts,
    updateProductCounters,
    incrementProductViews,
    incrementProductFavorites,
    decrementProductFavorites,
    removeProduct,
    clearCache,
    getUpdatedProducts,
  }
})
