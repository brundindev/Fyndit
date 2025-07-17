import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  createOrGetChat,
  getUserChats,
  getChat,
  sendMessage,
  getChatMessages,
  markMessagesAsRead,
  subscribeToMessages,
  subscribeToUserChats,
  getUnreadMessagesCount,
  closeChat,
} from '@/firebase/chats'
import { getProduct, getUserById } from '@/firebase/products'
import { useAuthStore } from './auth'
import type { Chat, ChatMessage, Product, User } from '@/types/firebase'

export const useChatsStore = defineStore('chats', () => {
  // Estado
  const chats = ref<Chat[]>([])
  const currentChat = ref<Chat | null>(null)
  const currentMessages = ref<ChatMessage[]>([])
  const loading = ref(false)
  const messagesLoading = ref(false)
  const error = ref<string | null>(null)
  const messagesError = ref<string | null>(null)

  // Datos adicionales para mejorar la UX
  const chatUsers = ref<Map<string, User>>(new Map()) // Cache de usuarios
  const chatProducts = ref<Map<string, Product>>(new Map()) // Cache de productos
  const unreadCounts = ref<Map<string, number>>(new Map()) // Conteo de no leídos por chat

  // Suscripciones activas
  let chatsUnsubscribe: (() => void) | null = null
  let messagesUnsubscribe: (() => void) | null = null

  // Getters
  const totalUnreadMessages = computed(() => {
    return Array.from(unreadCounts.value.values()).reduce((total, count) => total + count, 0)
  })

  const hasUnreadMessages = computed(() => totalUnreadMessages.value > 0)

  const sortedChats = computed(() => {
    return [...chats.value].sort((a, b) => {
      const aTime = a.updatedAt?.toMillis?.() || 0
      const bTime = b.updatedAt?.toMillis?.() || 0
      return bTime - aTime
    })
  })

  // Obtener información del otro usuario en el chat
  const getOtherUser = computed(() => (chatId: string) => {
    const authStore = useAuthStore()
    const chat = chats.value.find((c) => c.id === chatId)
    if (!chat || !authStore.user) return null

    const otherUserId = chat.buyerId === authStore.user.uid ? chat.sellerId : chat.buyerId
    return chatUsers.value.get(otherUserId) || null
  })

  // Obtener producto del chat
  const getChatProduct = computed(() => (chatId: string) => {
    const chat = chats.value.find((c) => c.id === chatId)
    if (!chat) return null
    return chatProducts.value.get(chat.productId) || null
  })

  // Acciones
  async function loadChats() {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      chats.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const result = await getUserChats()

      if (result.success && result.data) {
        chats.value = result.data

        // Cargar información adicional de usuarios y productos
        await loadAdditionalChatData(result.data)

        // Calcular mensajes no leídos para cada chat
        await updateUnreadCounts()
      } else {
        error.value = result.error || 'Error al cargar chats'
      }
    } catch (err) {
      console.error('Error loading chats:', err)
      error.value = err instanceof Error ? err.message : 'Error al cargar chats'
    } finally {
      loading.value = false
    }
  }

  async function loadAdditionalChatData(chatList: Chat[]) {
    const authStore = useAuthStore()
    if (!authStore.user) return

    const userIds = new Set<string>()
    const productIds = new Set<string>()

    // Recopilar IDs únicos
    chatList.forEach((chat) => {
      userIds.add(chat.buyerId)
      userIds.add(chat.sellerId)
      productIds.add(chat.productId)
    })

    // Remover el usuario actual
    userIds.delete(authStore.user.uid)

    // Cargar usuarios
    const userPromises = Array.from(userIds).map(async (userId) => {
      if (!chatUsers.value.has(userId)) {
        const result = await getUserById(userId)
        if (result.success && result.data) {
          chatUsers.value.set(userId, result.data)
        }
      }
    })

    // Cargar productos
    const productPromises = Array.from(productIds).map(async (productId) => {
      if (!chatProducts.value.has(productId)) {
        const result = await getProduct(productId)
        if (result.success && result.data) {
          chatProducts.value.set(productId, result.data)
        }
      }
    })

    await Promise.all([...userPromises, ...productPromises])
  }

  async function updateUnreadCounts() {
    const promises = chats.value.map(async (chat) => {
      const result = await getUnreadMessagesCount(chat.id)
      if (result.success && typeof result.data === 'number') {
        unreadCounts.value.set(chat.id, result.data)
      }
    })

    await Promise.all(promises)
  }

  async function startOrOpenChat(productId: string, sellerId: string) {
    loading.value = true
    error.value = null

    try {
      const result = await createOrGetChat(productId, sellerId)

      if (result.success && result.data) {
        const chat = result.data

        // Agregar a la lista si no existe
        if (!chats.value.find((c) => c.id === chat.id)) {
          chats.value.unshift(chat)
        }

        // Cargar datos adicionales
        await loadAdditionalChatData([chat])

        return { success: true, chatId: chat.id }
      } else {
        error.value = result.error || 'Error al crear o encontrar chat'
        return { success: false, error: error.value }
      }
    } catch (err) {
      console.error('Error starting chat:', err)
      error.value = err instanceof Error ? err.message : 'Error al iniciar chat'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function selectChat(chatId: string) {
    messagesLoading.value = true
    messagesError.value = null

    try {
      // Cargar el chat
      const chatResult = await getChat(chatId)
      if (!chatResult.success) {
        messagesError.value = chatResult.error || 'Chat no encontrado'
        return
      }

      currentChat.value = chatResult.data!

      // Cargar mensajes
      const messagesResult = await getChatMessages(chatId)
      if (messagesResult.success && messagesResult.data) {
        currentMessages.value = messagesResult.data
      } else {
        messagesError.value = messagesResult.error || 'Error al cargar mensajes'
      }

      // Marcar mensajes como leídos
      await markMessagesAsRead(chatId)

      // Actualizar contador de no leídos
      unreadCounts.value.set(chatId, 0)

      // Suscribirse a nuevos mensajes
      subscribeToCurrentChatMessages(chatId)
    } catch (err) {
      console.error('Error selecting chat:', err)
      messagesError.value = err instanceof Error ? err.message : 'Error al cargar chat'
    } finally {
      messagesLoading.value = false
    }
  }

  async function sendChatMessage(content: string) {
    if (!currentChat.value || !content.trim()) {
      return { success: false, error: 'Chat no seleccionado o mensaje vacío' }
    }

    try {
      const result = await sendMessage(currentChat.value.id, content.trim())

      if (result.success && result.data) {
        // El mensaje se agregará automáticamente por la suscripción en tiempo real
        return { success: true, message: 'Mensaje enviado' }
      } else {
        return { success: false, error: result.error || 'Error al enviar mensaje' }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al enviar mensaje',
      }
    }
  }

  function subscribeToChatsUpdates() {
    // Limpiar suscripción anterior
    if (chatsUnsubscribe) {
      chatsUnsubscribe()
    }

    chatsUnsubscribe = subscribeToUserChats(async (updatedChats) => {
      chats.value = updatedChats
      await loadAdditionalChatData(updatedChats)
      await updateUnreadCounts()
    })
  }

  function subscribeToCurrentChatMessages(chatId: string) {
    // Limpiar suscripción anterior
    if (messagesUnsubscribe) {
      messagesUnsubscribe()
    }

    messagesUnsubscribe = subscribeToMessages(chatId, async (messages) => {
      currentMessages.value = messages

      // Si hay nuevos mensajes, marcarlos como leídos automáticamente
      if (messages.length > 0) {
        await markMessagesAsRead(chatId)
        unreadCounts.value.set(chatId, 0)
      }
    })
  }

  function clearCurrentChat() {
    currentChat.value = null
    currentMessages.value = []
    messagesError.value = null

    // Limpiar suscripción de mensajes
    if (messagesUnsubscribe) {
      messagesUnsubscribe()
      messagesUnsubscribe = null
    }
  }

  function clearChats() {
    chats.value = []
    currentChat.value = null
    currentMessages.value = []
    chatUsers.value.clear()
    chatProducts.value.clear()
    unreadCounts.value.clear()
    error.value = null
    messagesError.value = null

    // Limpiar suscripciones
    if (chatsUnsubscribe) {
      chatsUnsubscribe()
      chatsUnsubscribe = null
    }
    if (messagesUnsubscribe) {
      messagesUnsubscribe()
      messagesUnsubscribe = null
    }
  }

  function clearError() {
    error.value = null
    messagesError.value = null
  }

  // Función para obtener el último mensaje formateado
  const getLastMessagePreview = computed(() => (chatId: string) => {
    const chat = chats.value.find((c) => c.id === chatId)
    if (!chat?.lastMessage) return 'Sin mensajes'

    const message = chat.lastMessage
    if (message.messageType === 'offer') {
      return `Oferta: €${message.offer?.amount}`
    }
    if (message.messageType === 'image') {
      return 'Imagen'
    }
    return message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content
  })

  // Formatear tiempo relativo
  const getRelativeTime = computed(() => (timestamp: any) => {
    if (!timestamp) return ''

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  })

  return {
    // Estado
    chats,
    currentChat,
    currentMessages,
    loading,
    messagesLoading,
    error,
    messagesError,
    chatUsers,
    chatProducts,
    unreadCounts,

    // Getters
    totalUnreadMessages,
    hasUnreadMessages,
    sortedChats,
    getOtherUser,
    getChatProduct,
    getLastMessagePreview,
    getRelativeTime,

    // Acciones
    loadChats,
    startOrOpenChat,
    selectChat,
    sendChatMessage,
    subscribeToChatsUpdates,
    clearCurrentChat,
    clearChats,
    clearError,
  }
})
