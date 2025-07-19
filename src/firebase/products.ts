import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db, auth } from './config'
import { cloudinaryService } from '@/services/cloudinary'
import type {
  Product,
  ProductImage,
  SearchFilters,
  FirebaseResponse,
  PaginatedResponse,
  ProductCategory,
  ProductCondition,
  SaleStatus,
} from '@/types/firebase'

export interface CreateProductData {
  title: string
  description: string
  price: number
  currency: string
  category: ProductCategory
  subcategory?: string
  condition: ProductCondition
  images: File[]
  location: {
    city: string
    state: string
    country: string
    zipCode?: string
  }
  tags?: string[]
}

export interface UpdateProductData extends Partial<CreateProductData> {
  saleStatus?: SaleStatus
}

// Crear nuevo producto
export async function createProduct(data: CreateProductData): Promise<FirebaseResponse<Product>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado para crear un producto',
      }
    }

    // Subir imágenes primero
    const imageUploadResult = await uploadProductImages(data.images)
    if (!imageUploadResult.success) {
      return {
        success: false,
        error: imageUploadResult.error || 'Error al subir imágenes',
      }
    }

    // Crear producto en Firestore
    const baseProductData = {
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      category: data.category,
      condition: data.condition,
      status: 'activo' as const,
      saleStatus: 'en-venta' as const,
      images: imageUploadResult.data!,
      location: data.location,
      sellerId: auth.currentUser.uid,
      tags: data.tags || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      favorites: 0,
    }

    // Filtrar campos undefined que Firestore no acepta
    const productData: Record<string, unknown> = { ...baseProductData }

    // Solo agregar subcategory si tiene valor
    if (data.subcategory && data.subcategory.trim() !== '') {
      productData.subcategory = data.subcategory
    }

    const docRef = await addDoc(collection(db, 'products'), productData)

    // Actualizar con el ID generado
    await updateDoc(docRef, { id: docRef.id })

    return {
      success: true,
      data: { id: docRef.id, ...productData } as Product,
      message: 'Producto creado exitosamente',
    }
  } catch (error: unknown) {
    console.error('Error creating product:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear producto',
    }
  }
}

// Obtener producto por ID
export async function getProduct(productId: string): Promise<FirebaseResponse<Product>> {
  try {
    const productRef = doc(db, 'products', productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    const productData = { id: productDoc.id, ...productDoc.data() } as Product

    // Intentar incrementar contador de vistas de forma opcional
    // Si falla por permisos, no afectar la obtención del producto
    try {
      await updateDoc(productRef, {
        views: increment(1),
        updatedAt: serverTimestamp(),
      })
    } catch (viewsError) {
      console.warn('Warning: Could not increment views for product:', productId, viewsError)
      // No devolver error, ya que el producto se obtuvo correctamente
    }

    return {
      success: true,
      data: productData,
    }
  } catch (error: unknown) {
    console.error('Error getting product:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener producto',
    }
  }
}

// Buscar productos con filtros y paginación
export async function searchProducts(
  filters: SearchFilters = {},
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot,
): Promise<FirebaseResponse<PaginatedResponse<Product>>> {
  try {
    let q = query(collection(db, 'products'))

    // Aplicar filtros
    q = query(q, where('status', '==', 'activo'))

    if (filters.category) {
      q = query(q, where('category', '==', filters.category))
    }

    if (filters.subcategory) {
      q = query(q, where('subcategory', '==', filters.subcategory))
    }

    if (filters.condition && filters.condition.length > 0) {
      q = query(q, where('condition', 'in', filters.condition))
    }

    if (filters.priceRange) {
      if (filters.priceRange.min > 0) {
        q = query(q, where('price', '>=', filters.priceRange.min))
      }
      if (filters.priceRange.max > 0) {
        q = query(q, where('price', '<=', filters.priceRange.max))
      }
    }

    // Aplicar ordenamiento
    switch (filters.sortBy) {
      case 'price-low':
        q = query(q, orderBy('price', 'asc'))
        break
      case 'price-high':
        q = query(q, orderBy('price', 'desc'))
        break
      case 'popularity':
        q = query(q, orderBy('favorites', 'desc'))
        break
      default:
        q = query(q, orderBy('createdAt', 'desc'))
    }

    // Paginación
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    // Si hay búsqueda de texto, obtener más productos para filtrar localmente
    const searchMultiplier = filters.searchText ? 3 : 1
    q = query(q, limit(pageSize * searchMultiplier + 1))

    const querySnapshot = await getDocs(q)
    let allProducts: Product[] = []
    const docs = querySnapshot.docs

    // Convertir documentos a productos
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i]
      allProducts.push({ id: doc.id, ...doc.data() } as Product)
    }

    // Filtrar por texto de búsqueda si se especifica
    if (filters.searchText) {
      const searchText = filters.searchText.toLowerCase().trim()
      const searchTerms = searchText.split(' ').filter((term) => term.length > 0)

      allProducts = allProducts.filter((product) => {
        const title = product.title.toLowerCase()
        const description = product.description.toLowerCase()
        const tags = product.tags?.join(' ').toLowerCase() || ''
        const fullText = `${title} ${description} ${tags}`

        // El producto debe contener todos los términos de búsqueda
        return searchTerms.every((term) => fullText.includes(term))
      })
    }

    // Aplicar paginación después del filtrado de texto
    const startIndex = 0
    const endIndex = Math.min(allProducts.length, pageSize)
    const products = allProducts.slice(startIndex, endIndex)

    // Determinar si hay más páginas
    const hasMore = allProducts.length > pageSize
    const newLastDoc =
      hasMore && docs.length > 0 ? docs[Math.min(docs.length - 1, pageSize)] : undefined

    return {
      success: true,
      data: {
        items: products,
        hasMore,
        lastDoc: newLastDoc,
      },
    }
  } catch (error: unknown) {
    console.error('Error searching products:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al buscar productos',
    }
  }
}

// Obtener productos del usuario actual
export async function getCurrentUserProducts(): Promise<FirebaseResponse<Product[]>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
    )

    const querySnapshot = await getDocs(q)
    const products: Product[] = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product,
    )

    return {
      success: true,
      data: products,
    }
  } catch (error: unknown) {
    console.error('Error getting user products:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener productos',
    }
  }
}

// Actualizar producto
export async function updateProduct(
  productId: string,
  updates: UpdateProductData,
): Promise<FirebaseResponse<Product>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    const productRef = doc(db, 'products', productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    const productData = productDoc.data() as Product
    if (productData.sellerId !== auth.currentUser.uid) {
      return {
        success: false,
        error: 'No tienes permisos para actualizar este producto',
      }
    }

    // Manejar subida de nuevas imágenes si las hay
    let updatedImages = productData.images
    if (updates.images && updates.images.length > 0) {
      const imageUploadResult = await uploadProductImages(updates.images)
      if (!imageUploadResult.success) {
        return {
          success: false,
          error: imageUploadResult.error || 'Error al subir nuevas imágenes',
        }
      }
      updatedImages = [...updatedImages, ...imageUploadResult.data!]
    }

    const updateData = {
      ...updates,
      images: updatedImages,
      updatedAt: serverTimestamp(),
    }

    // Remover campos undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    await updateDoc(productRef, updateData)

    return await getProduct(productId)
  } catch (error: unknown) {
    console.error('Error updating product:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar producto',
    }
  }
}

// Eliminar producto
export async function deleteProduct(productId: string): Promise<FirebaseResponse<null>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    const productRef = doc(db, 'products', productId)
    const productDoc = await getDoc(productRef)

    if (!productDoc.exists()) {
      return {
        success: false,
        error: 'Producto no encontrado',
      }
    }

    const productData = productDoc.data() as Product
    if (productData.sellerId !== auth.currentUser.uid) {
      return {
        success: false,
        error: 'No tienes permisos para eliminar este producto',
      }
    }

    // Eliminar imágenes de Cloudinary
    for (const image of productData.images) {
      try {
        // Extraer publicId de la URL de Cloudinary o usar el ID almacenado
        const publicId = image.id
        await cloudinaryService.deleteImage(publicId)
      } catch (error) {
        console.warn('Error deleting image:', error)
      }
    }

    // Eliminar documento
    await deleteDoc(productRef)

    return {
      success: true,
      message: 'Producto eliminado exitosamente',
    }
  } catch (error: unknown) {
    console.error('Error deleting product:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar producto',
    }
  }
}

// Subir imágenes del producto usando Cloudinary
async function uploadProductImages(files: File[]): Promise<FirebaseResponse<ProductImage[]>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    const uploadResult = await cloudinaryService.uploadMultipleImages(
      files,
      `fyndit/products/${auth.currentUser.uid}`,
    )

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error || 'Error al subir imágenes',
      }
    }

    const images: ProductImage[] = uploadResult.results.map((result, index) => ({
      id: result.publicId || `${Date.now()}_${index}`,
      url: result.url!,
      order: index,
      alt: `Imagen ${index + 1}`,
    }))

    return {
      success: true,
      data: images,
    }
  } catch (error: unknown) {
    console.error('Error uploading images:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al subir imágenes',
    }
  }
}

// Marcar producto como favorito
export async function toggleProductFavorite(productId: string): Promise<FirebaseResponse<boolean>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    console.log('Toggle favorite for product:', productId, 'by user:', auth.currentUser.uid)

    const favoriteId = `${auth.currentUser.uid}_${productId}`
    const favoriteRef = doc(db, 'favorites', favoriteId)
    const productRef = doc(db, 'products', productId)

    // Verificar que el producto existe
    const productDoc = await getDoc(productRef)
    if (!productDoc.exists()) {
      return {
        success: false,
        error: 'El producto no existe',
      }
    }

    const favoriteDoc = await getDoc(favoriteRef)

    if (favoriteDoc.exists()) {
      // Remover favorito
      console.log('Removing favorite:', favoriteId)
      try {
        await deleteDoc(favoriteRef)

        // Intentar actualizar contador en producto (opcional)
        try {
          await updateDoc(productRef, {
            favorites: increment(-1),
            updatedAt: serverTimestamp(),
          })
        } catch (counterError) {
          console.warn('Warning: Could not decrement favorites counter for product:', productId, counterError)
        }

        return {
          success: true,
          data: false,
          message: 'Producto removido de favoritos',
        }
      } catch (deleteError) {
        console.error('Error deleting favorite:', deleteError)
        return {
          success: false,
          error: 'Error al remover de favoritos',
        }
      }
    } else {
      // Agregar favorito
      console.log('Adding favorite:', favoriteId)
      const favoriteData = {
        userId: auth.currentUser.uid,
        productId,
        addedAt: serverTimestamp(),
      }

      try {
        console.log('Favorite data:', favoriteData)
        await setDoc(favoriteRef, favoriteData)

        // Intentar actualizar contador en producto (opcional)
        try {
          await updateDoc(productRef, {
            favorites: increment(1),
            updatedAt: serverTimestamp(),
          })
        } catch (counterError) {
          console.warn('Warning: Could not increment favorites counter for product:', productId, counterError)
        }

        return {
          success: true,
          data: true,
          message: 'Producto agregado a favoritos',
        }
      } catch (createError) {
        console.error('Error creating favorite:', createError)
        return {
          success: false,
          error: 'Error al agregar a favoritos',
        }
      }
    }
  } catch (error: unknown) {
    console.error('Error toggling favorite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar favoritos',
    }
  }
}

// Función para obtener un usuario por ID
export async function getUserById(
  userId: string,
): Promise<FirebaseResponse<import('@/types/firebase').User>> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return {
        success: false,
        error: 'Usuario no encontrado',
      }
    }

    const userData = { uid: userDoc.id, ...userDoc.data() } as import('@/types/firebase').User

    return {
      success: true,
      data: userData,
    }
  } catch (error: unknown) {
    console.error('Error getting user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener usuario',
    }
  }
}

// Función para obtener productos de un usuario
export async function getUserProducts(userId: string): Promise<FirebaseResponse<Product[]>> {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('sellerId', '==', userId),
      orderBy('createdAt', 'desc'),
    )

    const querySnapshot = await getDocs(productsQuery)
    const products: Product[] = []

    querySnapshot.forEach((doc) => {
      const productData = { id: doc.id, ...doc.data() } as Product
      products.push(productData)
    })

    return {
      success: true,
      data: products,
    }
  } catch (error: unknown) {
    console.error('Error getting user products:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener productos del usuario',
    }
  }
}
