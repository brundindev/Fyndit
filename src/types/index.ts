export interface Product {
  id: string
  title: string
  description: string
  price: number
  image: string
  location: string
  createdAt: string
  status?: 'new' | 'excellent' | 'good' | 'fair'
  category: string
  seller: {
    name: string
    rating: number
  }
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  rating: number
  joinedAt: string
  verified: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  count: number
  icon: any // Componente de icono
}

export interface Message {
  id: string
  fromUser: User
  toUser: User
  content: string
  createdAt: string
  read: boolean
  productId?: string
}

export interface SearchFilters {
  category: string
  priceRange: string
  condition: string
  location?: string
  sortBy: 'recent' | 'price-asc' | 'price-desc' | 'popular'
}
