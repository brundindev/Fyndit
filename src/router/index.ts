import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/producto/:id',
      name: 'product-detail',
      component: () => import('@/views/ProductDetail.vue'),
    },
    {
      path: '/buscar',
      name: 'search',
      component: () => import('@/views/SearchResults.vue'),
    },
    {
      path: '/categoria/:slug',
      name: 'category',
      component: () => import('@/views/CategoryView.vue'),
    },
    {
      path: '/favoritos',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
    },
    {
      path: '/perfil',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
    },
    {
      path: '/perfil/:id',
      name: 'user-profile',
      component: () => import('@/views/ProfileView.vue'),
    },
    {
      path: '/editar-perfil',
      name: 'edit-profile',
      component: () => import('@/views/EditProfileView.vue'),
    },
    {
      path: '/mis-productos',
      name: 'my-products',
      component: () => import('@/views/MyProductsView.vue'),
    },
    {
      path: '/chats',
      name: 'ChatsView',
      component: () => import('@/views/ChatsView.vue'),
    },
    {
      path: '/chats/:chatId',
      name: 'ChatDetail',
      component: () => import('@/views/ChatsView.vue'),
    },
    {
      path: '/configuracion',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
    },
    {
      path: '/ayuda',
      name: 'help',
      component: () => import('@/views/HelpView.vue'),
    },
    {
      path: '/contacto',
      name: 'contact',
      component: () => import('@/views/ContactView.vue'),
    },
  ],
})

export default router
