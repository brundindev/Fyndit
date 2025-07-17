<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessageCircle } from 'lucide-vue-next'
import ChatList from '@/components/ChatList.vue'
import ChatWindow from '@/components/ChatWindow.vue'
import { useAuthStore } from '@/stores/auth'
import { useChatsStore } from '@/stores/chats'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const chatsStore = useChatsStore()

// Estado
const selectedChatId = ref<string | null>(null)
const showChatList = ref(true) // Para responsive

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Métodos
const selectChat = (chatId: string) => {
  selectedChatId.value = chatId
  showChatList.value = false // Ocultar lista en móvil

  // Actualizar URL
  router.push({ name: 'ChatsView', params: { chatId } })
}

const goBack = () => {
  selectedChatId.value = null
  showChatList.value = true

  // Volver a la vista de lista
  router.push({ name: 'ChatsView' })
}

const startNewChat = () => {
  // Navegar a la página principal para explorar productos
  router.push({ name: 'HomeView' })
}

const viewProduct = (productId: string) => {
  router.push({ name: 'ProductDetail', params: { id: productId } })
}

const viewProfile = (userId: string) => {
  router.push({ name: 'ProfileView', params: { id: userId } })
}

// Inicializar desde URL
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'LoginView' })
    return
  }

  const chatIdFromRoute = route.params.chatId as string
  if (chatIdFromRoute) {
    selectedChatId.value = chatIdFromRoute
    showChatList.value = false
  }
})

// Limpiar cuando el usuario se deslogee
authStore.$subscribe(() => {
  if (!authStore.isAuthenticated) {
    chatsStore.clearChats()
    router.push({ name: 'LoginView' })
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Usuario no autenticado -->
    <div v-if="!isAuthenticated" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <MessageCircle class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Inicia sesión para ver tus chats</h2>
        <p class="text-gray-600 mb-6">
          Necesitas estar registrado para poder chatear con otros usuarios
        </p>
        <div class="space-x-4">
          <router-link to="/login" class="btn-primary">Iniciar sesión</router-link>
          <router-link to="/register" class="btn-secondary">Registrarse</router-link>
        </div>
      </div>
    </div>

    <!-- Interfaz de chats -->
    <div v-else class="h-screen flex">
      <!-- Lista de chats -->
      <div
        class="w-full lg:w-1/3 xl:w-1/4 bg-white border-r border-gray-200"
        :class="{ 'hidden lg:block': !showChatList }"
      >
        <ChatList
          :selected-chat-id="selectedChatId || undefined"
          @select-chat="selectChat"
          @start-new-chat="startNewChat"
        />
      </div>

      <!-- Ventana de chat -->
      <div class="flex-1 bg-white" :class="{ 'hidden lg:block': showChatList && !selectedChatId }">
        <!-- Chat seleccionado -->
        <ChatWindow
          v-if="selectedChatId"
          :key="selectedChatId"
          :chat-id="selectedChatId"
          @back="goBack"
          @view-product="viewProduct"
          @view-profile="viewProfile"
        />

        <!-- Placeholder cuando no hay chat seleccionado -->
        <div v-else class="h-full flex items-center justify-center bg-gray-50">
          <div class="text-center">
            <div
              class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <MessageCircle class="w-12 h-12 text-gray-400" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">
              Selecciona un chat para comenzar
            </h3>
            <p class="text-gray-600 mb-6 max-w-sm">
              Elige una conversación de la lista o contacta a un vendedor desde un producto
            </p>
            <button @click="startNewChat" class="btn-primary">Explorar productos</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Asegurar que la altura sea completa */
.h-screen {
  height: 100vh;
}

/* Responsive breakpoints para el chat */
@media (max-width: 1023px) {
  .lg\:w-1\/3 {
    width: 100%;
  }

  .lg\:block {
    display: block !important;
  }

  .hidden.lg\:block {
    display: none !important;
  }
}
</style>
