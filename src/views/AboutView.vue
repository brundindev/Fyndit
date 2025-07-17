<script setup lang="ts">
import { Info, Users, Shield, Heart } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Hero Section -->
      <div class="text-center py-16">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Acerca de Fyndit</h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          El marketplace donde encuentras todo lo que buscas. Compra y vende de forma segura con
          nuestra comunidad de usuarios verificados.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <div
            class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4"
          >
            <Shield class="w-6 h-6 text-primary-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Compra Segura</h3>
          <p class="text-gray-600 text-sm">Transacciones protegidas y vendedores verificados</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <div
            class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4"
          >
            <Users class="w-6 h-6 text-green-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Comunidad</h3>
          <p class="text-gray-600 text-sm">Miles de usuarios comprando y vendiendo cada día</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <div
            class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4"
          >
            <Info class="w-6 h-6 text-blue-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Fácil de usar</h3>
          <p class="text-gray-600 text-sm">Interfaz intuitiva para encontrar lo que necesitas</p>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <div
            class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4"
          >
            <Heart class="w-6 h-6 text-red-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Favoritos</h3>
          <p class="text-gray-600 text-sm">Guarda productos y recibe notificaciones de precio</p>
        </div>
      </div>

      <!-- Mission Section -->
      <div class="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-6 text-center">Nuestra Misión</h2>
        <div class="prose prose-lg mx-auto text-gray-700">
          <p>
            En Fyndit creemos que cada objeto tiene una segunda oportunidad. Nuestra misión es
            conectar a personas que quieren vender productos que ya no usan con aquellas que los
            necesitan, creando un ecosistema sostenible y económico.
          </p>
          <p>
            Fundada en 2024, Fyndit se ha convertido en la plataforma de referencia para la
            compra-venta de productos de segunda mano en España. Con miles de usuarios activos,
            facilitamos transacciones seguras y construimos comunidad.
          </p>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div>
          <div class="text-4xl font-bold text-primary-600 mb-2">10K+</div>
          <div class="text-gray-600">Usuarios registrados</div>
        </div>
        <div>
          <div class="text-4xl font-bold text-green-600 mb-2">50K+</div>
          <div class="text-gray-600">Productos vendidos</div>
        </div>
        <div>
          <div class="text-4xl font-bold text-blue-600 mb-2">99%</div>
          <div class="text-gray-600">Satisfacción del cliente</div>
        </div>
      </div>
    </div>
  </div>
</template>
