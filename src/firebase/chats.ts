import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { db, auth } from './config'
import type { Chat, ChatMessage, FirebaseResponse, PaginatedResponse } from '@/types/firebase'

// Crear o obtener un chat existente
export async function createOrGetChat(
  productId: string,
  sellerId: string,
): Promise<FirebaseResponse<Chat>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado para crear un chat',
      }
    }

    const buyerId = auth.currentUser.uid

    // No permitir chat consigo mismo
    if (buyerId === sellerId) {
      return {
        success: false,
        error: 'No puedes crear un chat contigo mismo',
      }
    }

    // Buscar chat existente
    const existingChatQuery = query(
      collection(db, 'chats'),
      where('productId', '==', productId),
      where('buyerId', '==', buyerId),
      where('sellerId', '==', sellerId),
    )

    const existingChatSnapshot = await getDocs(existingChatQuery)

    if (!existingChatSnapshot.empty) {
      // Chat ya existe, devolverlo
      const chatDoc = existingChatSnapshot.docs[0]
      const chatData = { id: chatDoc.id, ...chatDoc.data() } as Chat
      return {
        success: true,
        data: chatData,
        message: 'Chat existente encontrado',
      }
    }

    // Crear nuevo chat
    const chatData = {
      productId,
      buyerId,
      sellerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: true,
    }

    const chatRef = await addDoc(collection(db, 'chats'), chatData)
    const newChat = { id: chatRef.id, ...chatData } as Chat

    return {
      success: true,
      data: newChat,
      message: 'Chat creado exitosamente',
    }
  } catch (error: unknown) {
    console.error('Error creating/getting chat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear o buscar chat',
    }
  }
}

// Obtener todos los chats del usuario actual
export async function getUserChats(): Promise<FirebaseResponse<Chat[]>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    const userId = auth.currentUser.uid

    // Buscar chats donde el usuario es comprador o vendedor
    const buyerChatsQuery = query(
      collection(db, 'chats'),
      where('buyerId', '==', userId),
      where('isActive', '==', true),
      orderBy('updatedAt', 'desc'),
    )

    const sellerChatsQuery = query(
      collection(db, 'chats'),
      where('sellerId', '==', userId),
      where('isActive', '==', true),
      orderBy('updatedAt', 'desc'),
    )

    const [buyerSnapshot, sellerSnapshot] = await Promise.all([
      getDocs(buyerChatsQuery),
      getDocs(sellerChatsQuery),
    ])

    const chats: Chat[] = []

    // Procesar chats como comprador
    buyerSnapshot.docs.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() } as Chat)
    })

    // Procesar chats como vendedor
    sellerSnapshot.docs.forEach((doc) => {
      chats.push({ id: doc.id, ...doc.data() } as Chat)
    })

    // Eliminar duplicados y ordenar por updatedAt
    const uniqueChats = chats.filter(
      (chat, index, self) => index === self.findIndex((c) => c.id === chat.id),
    )

    uniqueChats.sort((a, b) => {
      const aTime = a.updatedAt instanceof Timestamp ? a.updatedAt.toMillis() : 0
      const bTime = b.updatedAt instanceof Timestamp ? b.updatedAt.toMillis() : 0
      return bTime - aTime
    })

    return {
      success: true,
      data: uniqueChats,
    }
  } catch (error: unknown) {
    console.error('Error getting user chats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener chats',
    }
  }
}

// Obtener un chat específico
export async function getChat(chatId: string): Promise<FirebaseResponse<Chat>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    const chatRef = doc(db, 'chats', chatId)
    const chatDoc = await getDoc(chatRef)

    if (!chatDoc.exists()) {
      return {
        success: false,
        error: 'Chat no encontrado',
      }
    }

    const chatData = { id: chatDoc.id, ...chatDoc.data() } as Chat
    const userId = auth.currentUser.uid

    // Verificar que el usuario es participante del chat
    if (chatData.buyerId !== userId && chatData.sellerId !== userId) {
      return {
        success: false,
        error: 'No tienes permisos para acceder a este chat',
      }
    }

    return {
      success: true,
      data: chatData,
    }
  } catch (error: unknown) {
    console.error('Error getting chat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener chat',
    }
  }
}

// Enviar mensaje
export async function sendMessage(
  chatId: string,
  content: string,
  messageType: 'text' | 'image' | 'offer' = 'text',
  offer?: { amount: number; currency: string },
): Promise<FirebaseResponse<ChatMessage>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    if (!content.trim()) {
      return {
        success: false,
        error: 'El mensaje no puede estar vacío',
      }
    }

    // Verificar que el chat existe y el usuario tiene permisos
    const chatResult = await getChat(chatId)
    if (!chatResult.success) {
      return {
        success: false,
        error: chatResult.error,
      }
    }

    const messageData = {
      chatId,
      senderId: auth.currentUser.uid,
      content: content.trim(),
      messageType,
      timestamp: serverTimestamp(),
      isRead: false,
      ...(offer && { offer: { ...offer, status: 'pending' as const } }),
    }

    // Usar batch para actualizar mensaje y chat
    const batch = writeBatch(db)

    // Añadir mensaje
    const messageRef = doc(collection(db, 'messages'))
    batch.set(messageRef, messageData)

    // Actualizar chat con último mensaje y timestamp
    const chatRef = doc(db, 'chats', chatId)
    batch.update(chatRef, {
      lastMessage: {
        ...messageData,
        id: messageRef.id,
      },
      updatedAt: serverTimestamp(),
    })

    await batch.commit()

    const newMessage = { id: messageRef.id, ...messageData } as ChatMessage

    return {
      success: true,
      data: newMessage,
      message: 'Mensaje enviado exitosamente',
    }
  } catch (error: unknown) {
    console.error('Error sending message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar mensaje',
    }
  }
}

// Obtener mensajes de un chat
export async function getChatMessages(
  chatId: string,
  limitCount: number = 50,
): Promise<FirebaseResponse<ChatMessage[]>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    // Verificar permisos del chat
    const chatResult = await getChat(chatId)
    if (!chatResult.success) {
      return {
        success: false,
        error: chatResult.error,
      }
    }

    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'desc'),
      limit(limitCount),
    )

    const messagesSnapshot = await getDocs(messagesQuery)
    const messages: ChatMessage[] = []

    messagesSnapshot.docs.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as ChatMessage)
    })

    // Ordenar por timestamp ascendente para mostrar cronológicamente
    messages.reverse()

    return {
      success: true,
      data: messages,
    }
  } catch (error: unknown) {
    console.error('Error getting chat messages:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener mensajes',
    }
  }
}

// Marcar mensajes como leídos
export async function markMessagesAsRead(chatId: string): Promise<FirebaseResponse<null>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    const userId = auth.currentUser.uid

    // Obtener mensajes no leídos que no son del usuario actual
    const unreadMessagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('senderId', '!=', userId),
      where('isRead', '==', false),
    )

    const unreadSnapshot = await getDocs(unreadMessagesQuery)

    if (unreadSnapshot.empty) {
      return {
        success: true,
        message: 'No hay mensajes por marcar como leídos',
      }
    }

    const batch = writeBatch(db)

    unreadSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true })
    })

    await batch.commit()

    return {
      success: true,
      message: 'Mensajes marcados como leídos',
    }
  } catch (error: unknown) {
    console.error('Error marking messages as read:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al marcar mensajes como leídos',
    }
  }
}

// Suscribirse a mensajes en tiempo real
export function subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
  if (!auth.currentUser) {
    console.error('User not authenticated')
    return () => {}
  }

  const messagesQuery = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('timestamp', 'asc'),
  )

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: ChatMessage[] = []
      snapshot.docs.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage)
      })
      callback(messages)
    },
    (error) => {
      console.error('Error subscribing to messages:', error)
    },
  )
}

// Suscribirse a chats del usuario en tiempo real
export function subscribeToUserChats(callback: (chats: Chat[]) => void) {
  if (!auth.currentUser) {
    console.error('User not authenticated')
    return () => {}
  }

  const userId = auth.currentUser.uid

  const chatsQuery = query(
    collection(db, 'chats'),
    where('isActive', '==', true),
    orderBy('updatedAt', 'desc'),
  )

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const chats: Chat[] = []
      snapshot.docs.forEach((doc) => {
        const chatData = { id: doc.id, ...doc.data() } as Chat
        // Solo incluir chats donde el usuario es participante
        if (chatData.buyerId === userId || chatData.sellerId === userId) {
          chats.push(chatData)
        }
      })
      callback(chats)
    },
    (error) => {
      console.error('Error subscribing to chats:', error)
    },
  )
}

// Obtener conteo de mensajes no leídos por chat
export async function getUnreadMessagesCount(chatId: string): Promise<FirebaseResponse<number>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    const userId = auth.currentUser.uid

    const unreadQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('senderId', '!=', userId),
      where('isRead', '==', false),
    )

    const unreadSnapshot = await getDocs(unreadQuery)

    return {
      success: true,
      data: unreadSnapshot.size,
    }
  } catch (error: unknown) {
    console.error('Error getting unread count:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener mensajes no leídos',
    }
  }
}

// Cerrar/desactivar chat
export async function closeChat(chatId: string): Promise<FirebaseResponse<null>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Debes estar autenticado',
      }
    }

    // Verificar permisos
    const chatResult = await getChat(chatId)
    if (!chatResult.success) {
      return {
        success: false,
        error: chatResult.error,
      }
    }

    const chatRef = doc(db, 'chats', chatId)
    await updateDoc(chatRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    })

    return {
      success: true,
      message: 'Chat cerrado exitosamente',
    }
  } catch (error: unknown) {
    console.error('Error closing chat:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cerrar chat',
    }
  }
}
