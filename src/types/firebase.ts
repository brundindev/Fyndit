import { Timestamp } from 'firebase/firestore'

// Tipos para Usuario
export interface User {
  uid: string
  email: string
  username: string
  displayName: string
  photoURL?: string
  phoneNumber?: string
  location?: UserLocation
  favoriteProducts: string[] // Array de IDs de productos
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLoginAt?: Timestamp
  isActive: boolean
  rating?: number
  reviewsCount?: number
  ratings?: Review[] // Array de valoraciones recibidas
  bio?: string
}

export interface UserLocation {
  city: string
  state: string
  country: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

// Tipos para Producto
export interface Product {
  id: string
  title: string
  description: string
  price: number
  currency: string
  category: ProductCategory
  subcategory?: string
  condition: ProductCondition
  status: ProductStatus
  saleStatus: SaleStatus
  images: ProductImage[]
  location: ProductLocation
  sellerId: string
  sellerInfo?: SellerInfo
  tags?: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
  views: number
  favorites: number
  isPromoted?: boolean
  promotedUntil?: Timestamp
}

export interface ProductImage {
  id: string
  url: string
  thumbnailUrl?: string
  order: number
  alt?: string
}

export interface ProductLocation {
  city: string
  state: string
  country: string
  zipCode?: string
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface SellerInfo {
  username: string
  displayName: string
  photoURL?: string
  rating?: number
  reviewsCount?: number
  isVerified?: boolean
  joinedAt: Timestamp
}

// Enums
export type ProductCategory =
  | 'electronica'
  | 'moda'
  | 'hogar'
  | 'deportes'
  | 'vehiculos'
  | 'inmuebles'
  | 'libros'
  | 'musica'
  | 'arte'
  | 'otros'

export type ProductCondition = 'nuevo' | 'como-nuevo' | 'bueno' | 'aceptable' | 'para-reparar'

export type ProductStatus = 'activo' | 'pausado' | 'eliminado' | 'bloqueado'

export type SaleStatus = 'en-venta' | 'reservado' | 'vendido'

// Tipos para Chat/Mensajes
export interface Chat {
  id: string
  productId: string
  buyerId: string
  sellerId: string
  lastMessage?: ChatMessage
  createdAt: Timestamp
  updatedAt: Timestamp
  isActive: boolean
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  content: string
  messageType: 'text' | 'image' | 'offer' | 'system'
  timestamp: Timestamp
  isRead: boolean
  offer?: {
    amount: number
    currency: string
    status: 'pending' | 'accepted' | 'rejected' | 'expired'
  }
}

// Tipos para Favoritos
export interface Favorite {
  userId: string
  productId: string
  addedAt: Timestamp
}

// Tipos para Reviews/Valoraciones
export interface Review {
  id: string
  fromUserId: string
  toUserId: string
  productId?: string
  rating: number
  comment?: string
  createdAt: Timestamp
  isVerified?: boolean
}

// Tipos para filtros de búsqueda
export interface SearchFilters {
  searchText?: string
  category?: ProductCategory
  subcategory?: string
  condition?: ProductCondition[]
  priceRange?: {
    min: number
    max: number
  }
  location?: {
    city?: string
    state?: string
    radius?: number // en km
  }
  sortBy?: 'recent' | 'price-low' | 'price-high' | 'distance' | 'popularity'
}

// Tipos para respuestas de API
export interface FirebaseResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  hasMore: boolean
  lastDoc?: unknown
  total?: number
}
