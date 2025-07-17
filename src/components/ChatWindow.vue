<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { User, Send, ArrowLeft, MoreVertical, Loader2, Info } from 'lucide-vue-next'
import { useChatsStore } from '@/stores/chats'
import { useAuthStore } from '@/stores/auth'
import type { ChatMessage } from '@/types/firebase'
import type { Timestamp } from 'firebase/firestore'

const chatsStore = useChatsStore()
const authStore = useAuthStore()

// Props
interface Props {
  chatId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  back: []
  viewProduct: [productId: string]
  viewProfile: [userId: string]
}>()

// Estado local
const messageText = ref('')
const messagesContainer = ref<HTMLElement>()
const sending = ref(false)

// Computed
const otherUser = computed(() => {
  if (!chatsStore.currentChat) return null
  return chatsStore.getOtherUser(chatsStore.currentChat.id)
})

const chatProduct = computed(() => {
  if (!chatsStore.currentChat) return null
  return chatsStore.getChatProduct(chatsStore.currentChat.id)
})

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

const formatMessageTime = (timestamp: Timestamp | Date | string | null | undefined) => {
  if (!timestamp) return ''
  const date =
    timestamp instanceof Date
      ? timestamp
      : (timestamp as Timestamp)?.toDate?.() || new Date(timestamp as string)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatMessageDate = (timestamp: Timestamp | Date | string | null | undefined) => {
  if (!timestamp) return ''
  const date =
    timestamp instanceof Date
      ? timestamp
      : (timestamp as Timestamp)?.toDate?.() || new Date(timestamp as string)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer'
  } else {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
  }
}

// Agrupar mensajes por fecha
const groupedMessages = computed(() => {
  const groups: { date: string; messages: ChatMessage[] }[] = []
  let currentDate = ''

  chatsStore.currentMessages.forEach((message) => {
    const messageDate = formatMessageDate(message.timestamp)

    if (messageDate !== currentDate) {
      currentDate = messageDate
      groups.push({
        date: messageDate,
        messages: [message],
      })
    } else {
      groups[groups.length - 1].messages.push(message)
    }
  })

  return groups
})

const isMyMessage = (senderId: string) => {
  return authStore.user?.uid === senderId
}

// Métodos
const sendMessage = async () => {
  if (!messageText.value.trim() || sending.value) return

  sending.value = true
  const content = messageText.value.trim()
  messageText.value = ''

  const result = await chatsStore.sendChatMessage(content)

  if (!result.success) {
    // Si falla, restaurar el mensaje
    messageText.value = content
    // Aquí podrías mostrar un toast de error
    console.error('Error sending message:', result.error)
  }

  sending.value = false
  await scrollToBottom()
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const viewProduct = () => {
  if (chatProduct.value) {
    emit('viewProduct', chatProduct.value.id)
  }
}

const viewProfile = () => {
  if (otherUser.value) {
    emit('viewProfile', otherUser.value.uid)
  }
}

onMounted(async () => {
  await chatsStore.selectChat(props.chatId)
  await scrollToBottom()
})

onUnmounted(() => {
  chatsStore.clearCurrentChat()
})

// Auto-scroll cuando lleguen nuevos mensajes
chatsStore.$subscribe((mutation) => {
  if (
    Array.isArray(mutation.events) &&
    mutation.events.some((event: unknown) => (event as { key: string }).key === 'currentMessages')
  ) {
    scrollToBottom()
  }
})
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header del chat -->
    <div class="p-4 border-b border-gray-200 bg-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <!-- Botón volver (móvil) -->
          <button @click="emit('back')" class="lg:hidden p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft class="w-5 h-5" />
          </button>

          <!-- Info del usuario -->
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <img
                v-if="otherUser?.photoURL"
                :src="otherUser.photoURL"
                :alt="otherUser.displayName"
                class="w-10 h-10 rounded-full object-cover"
              />
              <User v-else class="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">
                {{ otherUser?.displayName || 'Usuario' }}
              </h3>
              <p class="text-sm text-gray-500">@{{ otherUser?.username || 'usuario' }}</p>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex items-center space-x-2">
          <button
            @click="viewProfile"
            class="p-2 hover:bg-gray-100 rounded-full"
            title="Ver perfil"
          >
            <Info class="w-5 h-5 text-gray-600" />
          </button>
          <button class="p-2 hover:bg-gray-100 rounded-full">
            <MoreVertical class="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <!-- Info del producto -->
      <div
        v-if="chatProduct"
        @click="viewProduct"
        class="mt-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
      >
        <div class="flex items-center space-x-3">
          <img
            :src="chatProduct.images?.[0]?.url"
            :alt="chatProduct.title"
            class="w-12 h-12 rounded-lg object-cover"
          />
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 truncate">{{ chatProduct.title }}</h4>
            <p class="text-lg font-bold text-primary-600">
              {{ formatPrice(chatProduct.price) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado de carga de mensajes -->
    <div v-if="chatsStore.messagesLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <Loader2 class="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
        <p class="text-gray-600">Cargando mensajes...</p>
      </div>
    </div>

    <!-- Error de mensajes -->
    <div v-else-if="chatsStore.messagesError" class="flex-1 flex items-center justify-center p-4">
      <div class="text-center">
        <div
          class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error al cargar mensajes</h3>
        <p class="text-gray-600 mb-4">{{ chatsStore.messagesError }}</p>
        <button @click="chatsStore.selectChat(props.chatId)" class="btn-primary">Reintentar</button>
      </div>
    </div>

    <!-- Mensajes -->
    <div v-else ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Mensajes agrupados por fecha -->
      <div v-for="group in groupedMessages" :key="group.date" class="space-y-4">
        <!-- Separador de fecha -->
        <div class="flex items-center justify-center py-2">
          <span class="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
            {{ group.date }}
          </span>
        </div>

        <!-- Mensajes del día -->
        <div
          v-for="message in group.messages"
          :key="message.id"
          class="flex"
          :class="{ 'justify-end': isMyMessage(message.senderId) }"
        >
          <div
            class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
            :class="
              isMyMessage(message.senderId)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-900'
            "
          >
            <!-- Contenido del mensaje -->
            <div v-if="message.messageType === 'text'">
              <p class="text-sm">{{ message.content }}</p>
            </div>

            <!-- Oferta -->
            <div v-else-if="message.messageType === 'offer'" class="space-y-2">
              <p class="text-sm font-medium">💰 Oferta</p>
              <p class="text-lg font-bold">{{ formatPrice(message.offer?.amount || 0) }}</p>
              <p class="text-sm">{{ message.content }}</p>
            </div>

            <!-- Imagen -->
            <div v-else-if="message.messageType === 'image'">
              <img :src="message.content" alt="Imagen" class="rounded max-w-full h-auto" />
            </div>

            <!-- Mensaje del sistema -->
            <div v-else-if="message.messageType === 'system'" class="text-center">
              <p class="text-xs italic opacity-75">{{ message.content }}</p>
            </div>

            <!-- Timestamp -->
            <div class="flex justify-end mt-1">
              <span
                class="text-xs opacity-75"
                :class="isMyMessage(message.senderId) ? 'text-white' : 'text-gray-500'"
              >
                {{ formatMessageTime(message.timestamp) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje vacío -->
      <div
        v-if="!chatsStore.messagesLoading && groupedMessages.length === 0"
        class="flex flex-col items-center justify-center py-12"
      >
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <User class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Comienza la conversación</h3>
        <p class="text-gray-600 text-center">
          Envía un mensaje a {{ otherUser?.displayName || 'este usuario' }} sobre el producto
        </p>
      </div>
    </div>

    <!-- Input para enviar mensajes -->
    <div class="p-4 border-t border-gray-200 bg-white">
      <div class="flex items-end space-x-3">
        <div class="flex-1">
          <textarea
            v-model="messageText"
            @keydown="handleKeyPress"
            placeholder="Escribe un mensaje..."
            rows="1"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            style="min-height: 44px; max-height: 120px"
          ></textarea>
        </div>
        <button
          @click="sendMessage"
          :disabled="!messageText.trim() || sending"
          class="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Loader2 v-if="sending" class="w-5 h-5 animate-spin" />
          <Send v-else class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Auto-resize textarea */
textarea {
  overflow-y: hidden;
  resize: none;
}
</style>
