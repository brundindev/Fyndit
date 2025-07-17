import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updatePassword,
  type AuthError,
  type User as FirebaseUser
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { auth, db } from './config'
import type { User, FirebaseResponse } from '@/types/firebase'

// Proveedor de Google para login social
const googleProvider = new GoogleAuthProvider()

export interface LoginCredentials {
  emailOrUsername: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username: string
  displayName: string
}

// Validar si username existe
export async function isUsernameAvailable(username: string): Promise<FirebaseResponse<boolean>> {
  try {
    // Convertir a minúsculas para búsqueda case-insensitive
    const normalizedUsername = username.toLowerCase().trim()

    if (normalizedUsername.length < 3) {
      return {
        success: false,
        error: 'El username debe tener al menos 3 caracteres'
      }
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      return {
        success: false,
        error: 'El username solo puede contener letras, números y guiones bajos'
      }
    }

    const usersQuery = query(
      collection(db, 'users'),
      where('username', '==', normalizedUsername)
    )

    const querySnapshot = await getDocs(usersQuery)
    const isAvailable = querySnapshot.empty

    return {
      success: true,
      data: isAvailable,
      message: isAvailable ? 'Username disponible' : 'Username ya está en uso'
    }
  } catch (error: unknown) {
    console.error('Error checking username availability:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar username'
    }
  }
}

// Buscar usuario por email o username
async function findUserByEmailOrUsername(emailOrUsername: string): Promise<FirebaseResponse<User>> {
  try {
    const identifier = emailOrUsername.toLowerCase().trim()

    // Primero intentar buscar por email
    if (identifier.includes('@')) {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', identifier)
      )
      const querySnapshot = await getDocs(usersQuery)

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        const userData = { uid: userDoc.id, ...userDoc.data() } as User
        return {
          success: true,
          data: userData
        }
      }
    } else {
      // Buscar por username
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', identifier)
      )
      const querySnapshot = await getDocs(usersQuery)

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        const userData = { uid: userDoc.id, ...userDoc.data() } as User
        return {
          success: true,
          data: userData
        }
      }
    }

    return {
      success: false,
      error: 'Usuario no encontrado'
    }
  } catch (error: unknown) {
    console.error('Error finding user:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al buscar usuario'
    }
  }
}

// Crear perfil de usuario en Firestore
async function createUserProfile(firebaseUser: FirebaseUser, additionalData?: any): Promise<FirebaseResponse<User>> {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      // Validar username si se proporciona
      if (additionalData?.username) {
        const usernameCheck = await isUsernameAvailable(additionalData.username)
        if (!usernameCheck.success || !usernameCheck.data) {
          return {
            success: false,
            error: usernameCheck.error || 'Username no disponible'
          }
        }
      }

      const userData: Omit<User, 'uid'> = {
        email: firebaseUser.email!,
        username: additionalData?.username?.toLowerCase().trim() || firebaseUser.email!.split('@')[0],
        displayName: additionalData?.displayName || firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || undefined,
        phoneNumber: firebaseUser.phoneNumber || undefined,
        favoriteProducts: [],
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
        lastLoginAt: serverTimestamp() as any,
        isActive: true
      }

      await setDoc(userRef, userData)

      return {
        success: true,
        data: { uid: firebaseUser.uid, ...userData } as User,
        message: 'Perfil de usuario creado exitosamente'
      }
    }

    // Actualizar última conexión
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    const userData = { uid: firebaseUser.uid, ...userDoc.data() } as User
    return {
      success: true,
      data: userData,
      message: 'Usuario autenticado exitosamente'
    }
  } catch (error: unknown) {
    console.error('Error creating user profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear perfil de usuario'
    }
  }
}

// Registro con email y contraseña
export async function registerWithEmail(data: RegisterData): Promise<FirebaseResponse<User>> {
  try {
    // Validar username primero
    const usernameCheck = await isUsernameAvailable(data.username)
    if (!usernameCheck.success || !usernameCheck.data) {
      return {
        success: false,
        error: usernameCheck.error || 'Username no disponible'
      }
    }

    const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password)

    // Actualizar perfil de Firebase Auth
    await updateProfile(user, {
      displayName: data.displayName
    })

    // Crear perfil en Firestore
    return await createUserProfile(user, data)
  } catch (error: unknown) {
    console.error('Error registering user:', error)
    return {
      success: false,
      error: getAuthErrorMessage(error as AuthError)
    }
  }
}

// Login con email/username y contraseña
export async function loginWithEmailOrUsername(credentials: LoginCredentials): Promise<FirebaseResponse<User>> {
  try {
    const identifier = credentials.emailOrUsername.toLowerCase().trim()
    let email = identifier

    // Si no es un email, buscar por username
    if (!identifier.includes('@')) {
      const userResult = await findUserByEmailOrUsername(identifier)
      if (!userResult.success) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        }
      }
      email = userResult.data!.email
    }

    const { user } = await signInWithEmailAndPassword(auth, email, credentials.password)
    return await createUserProfile(user)
  } catch (error: unknown) {
    console.error('Error logging in:', error)
    return {
      success: false,
      error: getAuthErrorMessage(error as AuthError)
    }
  }
}

// Mantener función de login legacy para compatibilidad
export async function loginWithEmail(credentials: { email: string; password: string }): Promise<FirebaseResponse<User>> {
  return await loginWithEmailOrUsername({
    emailOrUsername: credentials.email,
    password: credentials.password
  })
}

// Login con Google
export async function loginWithGoogle(): Promise<FirebaseResponse<User>> {
  try {
    const { user } = await signInWithPopup(auth, googleProvider)
    return await createUserProfile(user)
  } catch (error: unknown) {
    console.error('Error logging in with Google:', error)
    return {
      success: false,
      error: getAuthErrorMessage(error as AuthError)
    }
  }
}

// Cerrar sesión
export async function logout(): Promise<FirebaseResponse<null>> {
  try {
    await signOut(auth)
    return {
      success: true,
      message: 'Sesión cerrada exitosamente'
    }
  } catch (error: unknown) {
    console.error('Error logging out:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cerrar sesión'
    }
  }
}

// Restablecer contraseña
export async function resetPassword(emailOrUsername: string): Promise<FirebaseResponse<null>> {
  try {
    let email = emailOrUsername.toLowerCase().trim()

    // Si no es un email, buscar por username
    if (!email.includes('@')) {
      const userResult = await findUserByEmailOrUsername(email)
      if (!userResult.success) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        }
      }
      email = userResult.data!.email
    }

    await sendPasswordResetEmail(auth, email)
    return {
      success: true,
      message: 'Email de restablecimiento enviado'
    }
  } catch (error: unknown) {
    console.error('Error sending password reset:', error)
    return {
      success: false,
      error: getAuthErrorMessage(error as AuthError)
    }
  }
}

// Actualizar contraseña
export async function changePassword(newPassword: string): Promise<FirebaseResponse<null>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      }
    }

    await updatePassword(auth.currentUser, newPassword)
    return {
      success: true,
      message: 'Contraseña actualizada exitosamente'
    }
  } catch (error: unknown) {
    console.error('Error updating password:', error)
    return {
      success: false,
      error: getAuthErrorMessage(error as AuthError)
    }
  }
}

// Obtener perfil de usuario actual
export async function getCurrentUserProfile(): Promise<FirebaseResponse<User>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      }
    }

    const userRef = doc(db, 'users', auth.currentUser.uid)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return {
        success: false,
        error: 'Perfil de usuario no encontrado'
      }
    }

    const userData = { uid: auth.currentUser.uid, ...userDoc.data() } as User
    return {
      success: true,
      data: userData
    }
  } catch (error: unknown) {
    console.error('Error getting user profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener perfil de usuario'
    }
  }
}

// Actualizar perfil de usuario
export async function updateUserProfile(updates: Partial<User>): Promise<FirebaseResponse<User>> {
  try {
    if (!auth.currentUser) {
      return {
        success: false,
        error: 'Usuario no autenticado'
      }
    }

    // Si se está actualizando el username, validar disponibilidad
    if (updates.username) {
      const currentProfile = await getCurrentUserProfile()
      if (currentProfile.success && currentProfile.data!.username !== updates.username.toLowerCase().trim()) {
        const usernameCheck = await isUsernameAvailable(updates.username)
        if (!usernameCheck.success || !usernameCheck.data) {
          return {
            success: false,
            error: usernameCheck.error || 'Username no disponible'
          }
        }
        updates.username = updates.username.toLowerCase().trim()
      }
    }

    const userRef = doc(db, 'users', auth.currentUser.uid)
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    }

    await updateDoc(userRef, updateData)

    // Si se actualiza displayName, también actualizar en Firebase Auth
    if (updates.displayName) {
      await updateProfile(auth.currentUser, {
        displayName: updates.displayName
      })
    }

    return await getCurrentUserProfile()
  } catch (error: unknown) {
    console.error('Error updating user profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar perfil'
    }
  }
}

// Observer del estado de autenticación
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const result = await getCurrentUserProfile()
      callback(result.success ? result.data! : null)
    } else {
      callback(null)
    }
  })
}

// Obtener mensajes de error legibles
function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No existe una cuenta con este email o username'
    case 'auth/wrong-password':
      return 'Contraseña incorrecta'
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este email'
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres'
    case 'auth/invalid-email':
      return 'Email inválido'
    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada'
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Inténtalo más tarde'
    case 'auth/network-request-failed':
      return 'Error de conexión. Verifica tu internet'
    case 'auth/popup-closed-by-user':
      return 'Login cancelado'
    default:
      return error.message || 'Error de autenticación'
  }
}
