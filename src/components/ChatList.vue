<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { MessageCircle, User, Search, Loader2 } from 'lucide-vue-next'
import { useChatsStore } from '@/stores/chats'
import { useAuthStore } from '@/stores/auth'

const chatsStore = useChatsStore()
const authStore = useAuthStore()

// Props
interface Props {
  selectedChatId?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  selectChat: [chatId: string]
  startNewChat: []
}>()

// Estado local
const searchQuery = ref('')

// Métodos
const selectChat = (chatId: string) => {
  emit('selectChat', chatId)
}

const isSelected = (chatId: string) => {
  return props.selectedChatId === chatId
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

// Filtrar chats por búsqueda
const filteredChats = ref(
  chatsStore.sortedChats.filter((chat) => {
    if (!searchQuery.value.trim()) return true

    const query = searchQuery.value.toLowerCase()
    const otherUser = chatsStore.getOtherUser(chat.id)
    const product = chatsStore.getChatProduct(chat.id)

    return (
      otherUser?.displayName?.toLowerCase().includes(query) ||
      otherUser?.username?.toLowerCase().includes(query) ||
      product?.title?.toLowerCase().includes(query) ||
      chatsStore.getLastMessagePreview(chat.id).toLowerCase().includes(query)
    )
  }),
)

// Actualizar filtros cuando cambie la búsqueda
const updateFilter = () => {
  filteredChats.value = chatsStore.sortedChats.filter((chat) => {
    if (!searchQuery.value.trim()) return true

    const query = searchQuery.value.toLowerCase()
    const otherUser = chatsStore.getOtherUser(chat.id)
    const product = chatsStore.getChatProduct(chat.id)

    return (
      otherUser?.displayName?.toLowerCase().includes(query) ||
      otherUser?.username?.toLowerCase().includes(query) ||
      product?.title?.toLowerCase().includes(query) ||
      chatsStore.getLastMessagePreview(chat.id).toLowerCase().includes(query)
    )
  })
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await chatsStore.loadChats()
    chatsStore.subscribeToChatsUpdates()
    updateFilter()
  }
})

onUnmounted(() => {
  // Las suscripciones se limpian en el store
})

// Actualizar filtros cuando cambien los chats
chatsStore.$subscribe(() => {
  updateFilter()
})
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900 flex items-center">
          <MessageCircle class="w-5 h-5 mr-2" />
          Chats
          <span
            v-if="chatsStore.totalUnreadMessages > 0"
            class="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center"
          >
            {{ chatsStore.totalUnreadMessages }}
          </span>
        </h2>
        <button
          @click="emit('startNewChat')"
          class="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          Nuevo chat
        </button>
      </div>

      <!-- Barra de búsqueda -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          v-model="searchQuery"
          @input="updateFilter"
          type="text"
          placeholder="Buscar chats..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
    </div>

    <!-- Lista de chats -->
    <div class="flex-1 overflow-y-auto">
      <!-- Estado de carga -->
      <div v-if="chatsStore.loading" class="flex items-center justify-center py-8">
        <Loader2 class="w-6 h-6 animate-spin text-primary-600 mr-2" />
        <span class="text-gray-600">Cargando chats...</span>
      </div>

      <!-- Estado de error -->
      <div v-else-if="chatsStore.error" class="p-4">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-600 text-sm">{{ chatsStore.error }}</p>
          <button
            @click="chatsStore.loadChats()"
            class="mt-2 text-red-700 hover:text-red-800 text-sm font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>

      <!-- Lista vacía -->
      <div
        v-else-if="!chatsStore.loading && filteredChats.length === 0"
        class="flex flex-col items-center justify-center py-12 px-4"
      >
        <MessageCircle class="w-12 h-12 text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ searchQuery ? 'No se encontraron chats' : 'No tienes chats aún' }}
        </h3>
        <p class="text-gray-600 text-center mb-4">
          {{
            searchQuery
              ? 'Intenta con otros términos de búsqueda'
              : 'Contacta a vendedores para comenzar a chatear'
          }}
        </p>
        <button v-if="!searchQuery" @click="emit('startNewChat')" class="btn-primary">
          Explorar productos
        </button>
      </div>

      <!-- Lista de chats -->
      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="chat in filteredChats"
          :key="chat.id"
          @click="selectChat(chat.id)"
          class="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
          :class="{ 'bg-primary-50 border-r-2 border-primary-500': isSelected(chat.id) }"
        >
          <div class="flex items-center space-x-3">
            <!-- Avatar del otro usuario -->
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <img
                  v-if="chatsStore.getOtherUser(chat.id)?.photoURL"
                  :src="chatsStore.getOtherUser(chat.id)?.photoURL"
                  :alt="chatsStore.getOtherUser(chat.id)?.displayName"
                  class="w-12 h-12 rounded-full object-cover"
                />
                <User v-else class="w-6 h-6 text-gray-600" />
              </div>
            </div>

            <!-- Contenido del chat -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <h4 class="text-sm font-semibold text-gray-900 truncate">
                  {{ chatsStore.getOtherUser(chat.id)?.displayName || 'Usuario' }}
                </h4>
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-500">
                    {{ chatsStore.getRelativeTime(chat.updatedAt) }}
                  </span>
                  <span
                    v-if="(chatsStore.unreadCounts.get(chat.id) || 0) > 0"
                    class="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[18px] text-center"
                  >
                    {{ chatsStore.unreadCounts.get(chat.id) || 0 }}
                  </span>
                </div>
              </div>

              <!-- Información del producto -->
              <div
                v-if="chatsStore.getChatProduct(chat.id)"
                class="flex items-center space-x-2 mb-1"
              >
                <img
                  :src="chatsStore.getChatProduct(chat.id)?.images?.[0]?.url"
                  :alt="chatsStore.getChatProduct(chat.id)?.title"
                  class="w-8 h-8 rounded object-cover"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-gray-600 truncate">
                    {{ chatsStore.getChatProduct(chat.id)?.title }}
                  </p>
                  <p class="text-xs font-medium text-gray-900">
                    {{ formatPrice(chatsStore.getChatProduct(chat.id)?.price || 0) }}
                  </p>
                </div>
              </div>

              <!-- Último mensaje -->
              <p class="text-sm text-gray-600 truncate">
                {{ chatsStore.getLastMessagePreview(chat.id) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.divide-y > :not([hidden]) ~ :not([hidden]) {
  border-top-width: 1px;
  border-color: rgb(243 244 246);
}
</style>
