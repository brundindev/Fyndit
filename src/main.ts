import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'

import App from './App.vue'
import router from './router'

// Importar Firebase para inicialización
import './firebase/config'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(MotionPlugin)

// Inicializar autenticación después de montar la app
app.mount('#app')

// Configurar el observador de autenticación
const authStore = useAuthStore()
authStore.initializeAuth()

// Opcional: Precargar favoritos cuando el usuario se autentique
import { useFavoritesStore } from './stores/favorites'

// Escuchar cambios en el estado de autenticación para manejar favoritos
authStore.$subscribe((mutation, state) => {
  const favoritesStore = useFavoritesStore()

  if (authStore.isAuthenticated && state.isInitialized) {
    // Usuario autenticado: cargar favoritos
    favoritesStore.loadFavorites()
  } else if (!authStore.isAuthenticated && state.isInitialized) {
    // Usuario desautenticado: limpiar favoritos
    favoritesStore.clearFavorites()
  }
})
