import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage, auth } from './config'
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
    const productData = {
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      category: data.category,
      subcategory: data.subcategory,
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

    // Incrementar contador de vistas
    await updateDoc(productRef, {
      views: increment(1),
    })

    const productData = { id: productDoc.id, ...productDoc.data() } as Product
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

    // Eliminar imágenes del storage
    for (const image of productData.images) {
      try {
        const imageRef = ref(storage, image.url)
        await deleteObject(imageRef)
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

// Subir imágenes del producto
async function uploadProductImages(files: File[]): Promise<FirebaseResponse<ProductImage[]>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    const images: ProductImage[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const imageId = `${Date.now()}_${i}`
      const imagePath = `products/${auth.currentUser.uid}/${imageId}`
      const imageRef = ref(storage, imagePath)

      // Subir archivo
      await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(imageRef)

      images.push({
        id: imageId,
        url: downloadURL,
        order: i,
        alt: `Imagen ${i + 1}`,
      })
    }

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

    const favoriteRef = doc(db, 'favorites', `${auth.currentUser.uid}_${productId}`)
    const favoriteDoc = await getDoc(favoriteRef)
    const productRef = doc(db, 'products', productId)

    if (favoriteDoc.exists()) {
      // Remover favorito
      await deleteDoc(favoriteRef)
      await updateDoc(productRef, {
        favorites: increment(-1),
      })

      return {
        success: true,
        data: false,
        message: 'Producto removido de favoritos',
      }
    } else {
      // Agregar favorito
      await addDoc(collection(db, 'favorites'), {
        userId: auth.currentUser.uid,
        productId,
        addedAt: serverTimestamp(),
      })

      await updateDoc(productRef, {
        favorites: increment(1),
      })

      return {
        success: true,
        data: true,
        message: 'Producto agregado a favoritos',
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
