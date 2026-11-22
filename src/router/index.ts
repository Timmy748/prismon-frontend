import { createRouter, createWebHistory } from 'vue-router'
import UiKitPreview from '@/views/UiKitPreview.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'ui-kit-preview',
      component: UiKitPreview,
    },
  ],
})

export default router
