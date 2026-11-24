import type { IconName } from '@/components/ui'

export type AppNavId = 'chat' | 'repertory' | 'members' | 'api-keys'
export type AppNavRouteName = 'chat' | 'repertory' | 'members' | 'api-keys'

export interface AppNavItem {
  id: AppNavId
  label: string
  icon: IconName
  routeName: AppNavRouteName
  to: string
}

export interface ProjectItem {
  id: number
  name: string
  icon: IconName
}

export interface UserProfile {
  username: string
  email: string
  workspace: string
}

export const PRIMARY_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'chat',
    label: 'chatbot',
    icon: 'chat',
    routeName: 'chat',
    to: '/chat',
  },
  {
    id: 'repertory',
    label: 'repertório',
    icon: 'documents',
    routeName: 'repertory',
    to: '/repertorio',
  },
  {
    id: 'members',
    label: 'membros',
    icon: 'members',
    routeName: 'members',
    to: '/membros',
  },
  {
    id: 'api-keys',
    label: 'chaves de api',
    icon: 'api-keys',
    routeName: 'api-keys',
    to: '/api-keys',
  },
]
