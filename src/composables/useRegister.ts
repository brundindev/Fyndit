import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { isUsernameAvailable, type RegisterData } from '@/firebase/auth'

export function useRegister() {
  const router = useRouter()
  const authStore = useAuthStore()

  // Estado del formulario
  const form = ref({
    displayName: '',
    username: '',
    email: '',
    password: '',
  })

  // Estado de validación
  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const checkingUsername = ref(false)
  const usernameError = ref('')
  const usernameValid = ref(false)

  // Debounce timer para validación de username
  let usernameTimer: number | null = null

  // Computed para validar formulario
  const formValid = computed(() => {
    return (
      form.value.displayName.trim().length > 0 &&
      form.value.username.trim().length >= 3 &&
      form.value.email.trim().length > 0 &&
      form.value.password.length >= 6 &&
      usernameValid.value &&
      !usernameError.value
    )
  })

  // Función para validar username con debounce
  const checkUsername = () => {
    if (usernameTimer) {
      clearTimeout(usernameTimer)
    }

    usernameTimer = setTimeout(async () => {
      await validateUsername()
    }, 500)
  }

  // Validar username
  const validateUsername = async () => {
    const username = form.value.username.trim()

    if (username.length === 0) {
      usernameError.value = ''
      usernameValid.value = false
      return
    }

    if (username.length < 3) {
      usernameError.value = 'El username debe tener al menos 3 caracteres'
      usernameValid.value = false
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      usernameError.value = 'Solo se permiten letras, números y guiones bajos'
      usernameValid.value = false
      return
    }

    checkingUsername.value = true
    usernameError.value = ''

    try {
      const result = await isUsernameAvailable(username)

      if (result.success) {
        if (result.data) {
          usernameValid.value = true
          usernameError.value = ''
        } else {
          usernameValid.value = false
          usernameError.value = 'Este username ya está en uso'
        }
      } else {
        usernameValid.value = false
        usernameError.value = result.error || 'Error al verificar username'
      }
    } catch {
      usernameValid.value = false
      usernameError.value = 'Error al verificar username'
    } finally {
      checkingUsername.value = false
    }
  }

  // Manejar registro
  const handleRegister = async () => {
    if (!formValid.value) return

    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const registerData: RegisterData = {
        email: form.value.email.trim(),
        password: form.value.password,
        username: form.value.username.trim(),
        displayName: form.value.displayName.trim(),
      }

      const result = await authStore.register(registerData)

      if (result.success) {
        successMessage.value = 'Cuenta creada exitosamente. Redirigiendo...'
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        errorMessage.value = result.error || 'Error al crear la cuenta'
      }
    } catch (error) {
      errorMessage.value = 'Error inesperado. Inténtalo de nuevo.'
      console.error('Error en registro:', error)
    } finally {
      loading.value = false
    }
  }

  // Manejar registro con Google
  const handleGoogleSignup = async () => {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const result = await authStore.loginGoogle()

      if (result.success) {
        successMessage.value = 'Cuenta creada exitosamente. Redirigiendo...'
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        errorMessage.value = result.error || 'Error al registrarse con Google'
      }
    } catch (error) {
      errorMessage.value = 'Error inesperado. Inténtalo de nuevo.'
      console.error('Error en registro con Google:', error)
    } finally {
      loading.value = false
    }
  }

  // Watchers
  watch(
    () => form.value.username,
    () => {
      usernameValid.value = false
      usernameError.value = ''
    },
  )

  watch(
    () => form.value,
    () => {
      if (errorMessage.value) {
        errorMessage.value = ''
      }
    },
    { deep: true },
  )

  return {
    form,
    loading,
    errorMessage,
    successMessage,
    checkingUsername,
    usernameError,
    usernameValid,
    formValid,
    checkUsername,
    validateUsername,
    handleRegister,
    handleGoogleSignup,
  }
}
