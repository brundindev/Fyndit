<template>
  <header class="bg-white shadow-lg sticky top-0 z-50 transition-all duration-300">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center space-x-2">
          <router-link
            to="/"
            class="flex items-center space-x-2 hover:scale-105 transition-transform duration-200"
          >
            <div
              class="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center"
            >
              <span class="text-white font-bold text-lg">F</span>
            </div>
            <span class="text-xl font-bold text-gray-900">Fyndit</span>
          </router-link>
        </div>

        <!-- Barra de búsqueda -->
        <div class="flex-1 max-w-2xl mx-8 hidden md:block">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar productos..."
              class="input-field w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary-500"
              @keyup.enter="handleSearch"
            />
            <Search
              class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Navegación y acciones -->
        <div class="flex items-center space-x-4">
          <!-- Botón de búsqueda móvil -->
          <button
            class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            @click="toggleMobileSearch"
          >
            <Search class="w-5 h-5" />
          </button>

          <!-- Favoritos -->
          <router-link
            v-if="authStore.isAuthenticated"
            to="/favoritos"
            class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <Heart class="w-5 h-5" />
            <span
              v-if="favoritesStore.favoritesCount > 0"
              class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              {{ favoritesStore.favoritesCount }}
            </span>
          </router-link>

          <!-- Mensajes -->
          <router-link
            v-if="authStore.isAuthenticated"
            to="/mensajes"
            class="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <MessageCircle class="w-5 h-5" />
            <span
              v-if="messagesCount > 0"
              class="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              {{ messagesCount }}
            </span>
          </router-link>

          <!-- Subir producto -->
          <button @click="openUploadModal" class="btn-primary flex items-center space-x-2">
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Subir</span>
          </button>

          <!-- Menú usuario autenticado -->
          <div v-if="authStore.isAuthenticated" class="relative" ref="userMenuRef">
            <button
              @click="toggleUserMenu"
              class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User class="w-5 h-5 text-gray-600" />
              </div>
              <span class="hidden md:block text-sm font-medium text-gray-700">
                {{ authStore.userDisplayName }}
              </span>
              <ChevronDown class="w-4 h-4 text-gray-600" />
            </button>

            <!-- Dropdown del usuario -->
            <div
              v-show="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-scale-in"
            >
              <button
                @click="goToProfile"
                class="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <UserIcon class="w-4 h-4 mr-3" />
                Ver perfil
              </button>
              <button
                @click="goToEditProfile"
                class="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Settings class="w-4 h-4 mr-3" />
                Editar perfil
              </button>
              <hr class="my-1" />
              <button
                @click="logout"
                class="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <LogOut class="w-4 h-4 mr-3" />
                Cerrar sesión
              </button>
            </div>
          </div>

          <!-- Botón de login para usuarios no autenticados -->
          <button v-else @click="goToLogin" class="btn-primary">Iniciar sesión</button>
        </div>
      </div>

      <!-- Barra de búsqueda móvil -->
      <div v-show="showMobileSearch" class="md:hidden pb-4 animate-slide-up">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar productos..."
            class="input-field w-full pl-12 pr-4 py-3 rounded-full"
            @keyup.enter="handleSearch"
          />
          <Search
            class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
          />
        </div>
      </div>
    </div>

    <!-- Modal para subir producto -->
    <UploadProductModal v-model:show="showUploadModal" />
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Heart,
  MessageCircle,
  Plus,
  User,
  ChevronDown,
  X,
  LogOut,
  Settings,
  UserIcon,
} from 'lucide-vue-next'
import { useFavoritesStore } from '@/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import UploadProductModal from './UploadProductModal.vue'

const router = useRouter()
const favoritesStore = useFavoritesStore()
const authStore = useAuthStore()

// Estado reactivo
const searchQuery = ref('')
const showUserMenu = ref(false)
const showMobileSearch = ref(false)
const showUploadModal = ref(false)
const messagesCount = ref(2) // Ejemplo

// Referencias
const userMenuRef = ref<HTMLElement>()

// Métodos
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/buscar?q=${encodeURIComponent(searchQuery.value)}`)
  }
}

const clearSearch = () => {
  searchQuery.value = ''
}

const toggleMobileSearch = () => {
  showMobileSearch.value = !showMobileSearch.value
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const openUploadModal = () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  showUploadModal.value = true
}

const logout = async () => {
  await authStore.signOut()
  showUserMenu.value = false
  router.push('/')
}

const goToProfile = () => {
  showUserMenu.value = false
  router.push('/perfil')
}

const goToEditProfile = () => {
  showUserMenu.value = false
  router.push('/editar-perfil')
}

const goToLogin = () => {
  router.push('/login')
}

// Cerrar menú cuando se hace clic fuera
const handleClickOutside = (event: Event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // Cargar favoritos del localStorage
  favoritesStore.loadFavorites()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
