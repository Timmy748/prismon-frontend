import type { IconName } from '@/components/ui'

export type AppNavId = 'chat' | 'repertory' | 'members' | 'api-keys' | 'ui-kit'

export interface AppNavItem {
  id: AppNavId
  label: string
  icon: IconName
  to: string
}

export interface UserProfile {
  username: string
  role: string
  email: string
  workspace: string
}

export const PRIMARY_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'chat',
    label: 'chatbot',
    icon: 'chat',
    to: '/chat',
  },
  {
    id: 'repertory',
    label: 'repertório',
    icon: 'documents',
    to: '/repertorio',
  },
  {
    id: 'members',
    label: 'membros',
    icon: 'members',
    to: '/membros',
  },
  {
    id: 'api-keys',
    label: 'chaves de api',
    icon: 'api-keys',
    to: '/api-keys',
  },
]

export const SECONDARY_NAV_ITEMS: AppNavItem[] = [
  {
    id: 'ui-kit',
    label: 'ui kit preview',
    icon: 'setting',
    to: '/ui-kit',
  },
]

export const DEFAULT_USER_PROFILE: UserProfile = {
  username: 'Ana Paula',
  role: 'Administradora',
  email: 'ana@prismon.ai',
  workspace: 'Prismon Studio',
}
