<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const categoryName = ref((route.params.slug as string) || 'Categoría')

onMounted(() => {
  console.log('Categoría:', categoryName.value)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">

    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8 capitalize">{{ categoryName }}</h1>

      <div class="text-center py-20">
        <p class="text-gray-600">Página de categoría en desarrollo</p>
        <router-link to="/" class="btn-primary mt-4">Volver al inicio</router-link>
      </div>
    </div>

  </div>
</template>
