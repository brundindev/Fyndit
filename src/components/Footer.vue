<template>
  <footer class="bg-gray-900 text-white">
    <div class="container mx-auto px-4 py-12">
      <!-- Contenido principal del footer -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <!-- Logo y descripción -->
        <div class="col-span-1 md:col-span-2 lg:col-span-1">
          <div class="flex items-center space-x-2 mb-4">
            <div
              class="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center"
            >
              <span class="text-white font-bold text-lg">F</span>
            </div>
            <span class="text-xl font-bold">Fyndit</span>
          </div>
          <p class="text-gray-300 mb-4 leading-relaxed">
            El marketplace donde encontrarás todo lo que buscas. Compra y vende de forma segura con
            nuestra comunidad.
          </p>
          <div class="flex space-x-4">
            <a
              href="#"
              class="text-gray-400 hover:text-white transition-colors duration-200 transform hover:scale-110"
            >
              <Facebook class="w-5 h-5" />
            </a>
            <a
              href="#"
              class="text-gray-400 hover:text-white transition-colors duration-200 transform hover:scale-110"
            >
              <Twitter class="w-5 h-5" />
            </a>
            <a
              href="#"
              class="text-gray-400 hover:text-white transition-colors duration-200 transform hover:scale-110"
            >
              <Instagram class="w-5 h-5" />
            </a>
            <a
              href="#"
              class="text-gray-400 hover:text-white transition-colors duration-200 transform hover:scale-110"
            >
              <Youtube class="w-5 h-5" />
            </a>
          </div>
        </div>

        <!-- Categorías -->
        <div>
          <h3 class="text-lg font-semibold mb-4">Categorías</h3>
          <ul class="space-y-2">
            <li>
              <router-link
                to="/categoria/electronica"
                class="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
              >
                Electrónica
              </router-link>
            </li>
            <li>
              <router-link
                to="/categoria/moda"
                class="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
              >
                Moda y complementos
              </router-link>
            </li>
            <li>
              <router-link
                to="/categoria/hogar"
                class="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
              >
                Hogar y jardín
              </router-link>
            </li>
            <li>
              <router-link
                to="/categoria/deportes"
                class="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
              >
                Deportes y ocio
              </router-link>
            </li>
            <li>
              <router-link
                to="/categoria/motor"
                class="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
              >
                Motor
              </router-link>
            </li>
            <li>
              <router-link
                to="/categorias"
                class="text-primary-400 hover:text-primary-300 transition-colors duration-200 hover:underline"
              >
                Ver todas →
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Ayuda y soporte -->
        <div>
          <h3 class="text-lg font-semibold mb-4">Ayuda y soporte</h3>
          <ul class="space-y-2">
            <li>
              <router-link
                to="/ayuda/como-comprar"
                class="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
              >
                Cómo comprar
              </router-link>
            </li>
            <li>
              <router-link
                to="/ayuda/como-vender"
                class="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
              >
                Cómo vender
              </router-link>
            </li>
            <li>
              <router-link
                to="/ayuda/seguridad"
                class="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
              >
                Seguridad
              </router-link>
            </li>
            <li>
              <router-link
                to="/ayuda/faq"
                class="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
              >
                Preguntas frecuentes
              </router-link>
            </li>
            <li>
              <router-link
                to="/contacto"
                class="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
              >
                Contacto
              </router-link>
            </li>
            <li>
              <router-link
                to="/ayuda"
                class="text-primary-400 hover:text-primary-300 transition-colors duration-200 hover:underline"
              >
                Centro de ayuda →
              </router-link>
            </li>
          </ul>
        </div>

        <!-- App móvil -->
        <div>
          <h3 class="text-lg font-semibold mb-4">Descarga la app</h3>
          <p class="text-gray-300 mb-4">
            Lleva Fyndit contigo y encuentra las mejores ofertas estés donde estés.
          </p>
          <div class="space-y-3">
            <a
              href="#"
              class="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors duration-200 group"
            >
              <div
                class="w-8 h-8 bg-gray-600 rounded flex items-center justify-center group-hover:bg-gray-500 transition-colors duration-200"
              >
                <Smartphone class="w-5 h-5" />
              </div>
              <div>
                <div class="text-xs text-gray-400">Descargar en</div>
                <div class="text-sm font-semibold">App Store</div>
              </div>
            </a>
            <a
              href="#"
              class="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors duration-200 group"
            >
              <div
                class="w-8 h-8 bg-gray-600 rounded flex items-center justify-center group-hover:bg-gray-500 transition-colors duration-200"
              >
                <Smartphone class="w-5 h-5" />
              </div>
              <div>
                <div class="text-xs text-gray-400">Descargar en</div>
                <div class="text-sm font-semibold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Separador -->
      <div class="border-t border-gray-800"></div>

      <!-- Footer inferior -->
      <div class="pt-8 flex flex-col md:flex-row justify-between items-center">
        <div class="flex flex-wrap items-center gap-6 mb-4 md:mb-0">
          <router-link
            to="/legal/privacidad"
            class="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
          >
            Política de privacidad
          </router-link>
          <router-link
            to="/legal/terminos"
            class="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
          >
            Términos y condiciones
          </router-link>
          <router-link
            to="/legal/cookies"
            class="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
          >
            Política de cookies
          </router-link>
          <router-link
            to="/legal/accesibilidad"
            class="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
          >
            Accesibilidad
          </router-link>
        </div>

        <div class="text-gray-400 text-sm">
          © {{ new Date().getFullYear() }} Fyndit. Todos los derechos reservados.
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Facebook, Twitter, Instagram, Youtube, Smartphone } from 'lucide-vue-next'
</script>
