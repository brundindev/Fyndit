# 🔍 Fyndit - Marketplace de Segunda Mano

Una moderna aplicación web de marketplace inspirada en Wallapop, construida con Vue 3, Vite y Tailwind CSS.

## 🚀 Características

### 🎨 Diseño Moderno

- Interfaz limpia e intuitiva inspirada en Wallapop
- Diseño responsive para móvil, tablet y escritorio
- Animaciones suaves con @vueuse/motion
- Esquema de colores moderno con gradientes

### 🛍️ Funcionalidades Core

- **Exploración de productos**: Cuadrícula de productos con filtros avanzados
- **Sistema de favoritos**: Guarda productos con persistencia en localStorage
- **Búsqueda inteligente**: Barra de búsqueda con sugerencias
- **Categorías**: Navegación por categorías con iconos
- **Detalles de producto**: Páginas detalladas con galería de imágenes
- **Autenticación**: Sistema de login/registro con validación

### 🎯 Componentes Reutilizables

- `Header.vue` - Navegación principal con búsqueda y menú de usuario
- `Footer.vue` - Pie de página con enlaces útiles
- `ProductCard.vue` - Tarjeta de producto con animaciones
- Páginas de autenticación (`LoginView.vue`)
- Gestión de favoritos (`FavoritesView.vue`)

## 🛠️ Stack Tecnológico

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS
- **Routing**: Vue Router 4
- **Estado Global**: Pinia
- **Animaciones**: @vueuse/motion
- **Iconos**: Lucide Vue Next
- **Lenguaje**: TypeScript

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Header.vue
│   ├── Footer.vue
│   └── ProductCard.vue
├── views/              # Páginas/Vistas
│   ├── Home.vue
│   ├── ProductDetail.vue
│   ├── LoginView.vue
│   └── FavoritesView.vue
├── stores/             # Stores de Pinia
│   └── favorites.ts
├── router/             # Configuración de rutas
│   └── index.ts
├── types/              # Tipos TypeScript
│   └── index.ts
├── assets/             # Recursos estáticos
│   ├── main.css
│   └── base.css
└── main.ts            # Punto de entrada
```

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+
- pnpm (recomendado) o npm

### Instalación

1. **Clonar el repositorio**

   ```bash
   git clone <repository-url>
   cd fyndit
   ```

2. **Instalar dependencias**

   ```bash
   pnpm install
   ```

3. **Iniciar servidor de desarrollo**

   ```bash
   pnpm dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

### Scripts Disponibles

```bash
# Desarrollo
pnpm dev

# Build para producción
pnpm build

# Preview del build
pnpm preview

# Linting
pnpm lint

# Formateo de código
pnpm format

# Type checking
pnpm type-check
```

## 🎨 Características de Diseño

### Paleta de Colores

- **Primary**: Azul (#0ea5e9 - #075985)
- **Secondary**: Rosa (#ec4899 - #831843)
- **Gray Scale**: Completa gama de grises para UI

### Animaciones

- Efectos hover suaves en cards y botones
- Animaciones de entrada con @vueuse/motion
- Transiciones CSS personalizadas
- Efectos de scroll y parallax

### Responsive Design

- **Mobile First**: Diseño optimizado para móviles
- **Breakpoints**: sm, md, lg, xl
- **Componentes adaptativos**: Header colapsable, grid responsive

## 📱 Funcionalidades Implementadas

### ✅ Completadas

- [x] Header responsive con navegación
- [x] Sistema de favoritos con persistencia
- [x] Cuadrícula de productos con animaciones
- [x] Filtros de búsqueda y ordenación
- [x] Página de detalles de producto
- [x] Página de favoritos
- [x] Formulario de login
- [x] Footer con enlaces
- [x] Estado global con Pinia
- [x] Tipos TypeScript

### 🚧 En Desarrollo / Futuras Mejoras

- [ ] Sistema de mensajería entre usuarios
- [ ] Carrito de compras
- [ ] Perfil de usuario completo
- [ ] Subida de productos
- [ ] Sistema de valoraciones
- [ ] Notificaciones push
- [ ] Chat en tiempo real
- [ ] Geolocalización

## 🎯 Uso de la Aplicación

### Navegación Principal

- **Logo**: Click para volver al inicio
- **Búsqueda**: Barra central para buscar productos
- **Favoritos**: Ver productos guardados (con contador)
- **Mensajes**: Sistema de mensajería (próximamente)
- **Subir**: Añadir nuevos productos (próximamente)
- **Usuario**: Menú desplegable con opciones de perfil

### Exploración de Productos

- **Categorías**: Click en iconos para filtrar por categoría
- **Filtros**: Precio, estado, categoría y ordenación
- **Cards**: Hover para efectos visuales, click para detalles
- **Favoritos**: Corazón para guardar/quitar productos

### Sistema de Favoritos

- **Guardar**: Click en corazón en cualquier producto
- **Ver todos**: Click en icono de favoritos en header
- **Gestionar**: Página dedicada con opción de limpiar todo

## 🔧 Configuración Avanzada

### Tailwind CSS

El proyecto incluye configuración personalizada de Tailwind con:

- Colores de marca personalizados
- Animaciones adicionales
- Componentes CSS reutilizables
- Plugins para forms y typography

### Pinia Store

Estado global organizado por funcionalidad:

- `favorites.ts` - Gestión de productos favoritos
- Persistencia automática en localStorage
- Acciones reactivas y computadas

### Vue Router

Rutas configuradas para toda la aplicación:

- Lazy loading de componentes
- Rutas anidadas para mejor organización
- Guardias de ruta (futuro)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🎉 Agradecimientos

- Inspirado en el diseño de Wallapop
- Iconos por Lucide
- Imágenes de Unsplash
- Comunidad de Vue.js

---

**Desarrollado con ❤️ usando Vue 3 + Vite + Tailwind CSS by @brundindev**
