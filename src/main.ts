import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import { Cloudinary } from '@cloudinary/url-gen'

import App from './App.vue'
import router from './router'

// Importar Firebase para inicialización
import './firebase/config'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

// Configurar Cloudinary
const cloudinary = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dvxe3ihxa',
  },
})

app.use(createPinia())
app.use(router)
app.use(MotionPlugin)

// Hacer Cloudinary disponible globalmente
app.config.globalProperties.$cloudinary = cloudinary

// Inicializar autenticación después de montar la app
app.mount('#app')

// Configurar el observador de autenticación
const authStore = useAuthStore()
authStore.initializeAuth()

// Opcional: Precargar favoritos y chats cuando el usuario se autentique
import { useFavoritesStore } from './stores/favorites'
import { useChatsStore } from './stores/chats'

// Escuchar cambios en el estado de autenticación para manejar favoritos y chats
authStore.$subscribe((mutation, state) => {
  const favoritesStore = useFavoritesStore()
  const chatsStore = useChatsStore()

  if (authStore.isAuthenticated && authStore.user && state.isInitialized) {
    // Usuario autenticado: cargar favoritos y chats con un pequeño delay para asegurar sincronización
    setTimeout(() => {
      if (authStore.isAuthenticated && authStore.user) {
        favoritesStore.loadFavorites()
        chatsStore.loadChats()
        chatsStore.subscribeToChatsUpdates()
      }
    }, 100)
  } else if (!authStore.isAuthenticated && state.isInitialized) {
    // Usuario desautenticado: limpiar favoritos y chats
    favoritesStore.clearFavorites()
    chatsStore.clearChats()
  }
})
