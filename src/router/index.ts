import { createRouter, createWebHistory } from 'vue-router'
import ApiKeysView from '@/views/ApiKeysView.vue'
import AuthView from '@/views/AuthView.vue'
import ChatView from '@/views/ChatView.vue'
import MembersView from '@/views/MembersView.vue'
import RepertoryView from '@/views/RepertoryView.vue'
import UiKitPreview from '@/views/UiKitPreview.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: AuthView,
      props: { initialMode: 'login' },
    },
    {
      path: '/cadastro',
      name: 'register',
      component: AuthView,
      props: { initialMode: 'register' },
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
    },
    {
      path: '/repertorio',
      name: 'repertory',
      component: RepertoryView,
    },
    {
      path: '/membros',
      name: 'members',
      component: MembersView,
    },
    {
      path: '/api-keys',
      name: 'api-keys',
      component: ApiKeysView,
    },
    {
      path: '/ui-kit',
      name: 'ui-kit-preview',
      component: UiKitPreview,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

export default router
