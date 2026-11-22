<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button, Drawer, Select, Tag, TextInput, toast, type SelectOption } from '@/components/ui'

interface Props {
  open: boolean
  username: string
  email: string
  role: string
  workspace: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [payload: { username: string; email: string; workspace: string }]
  logout: []
}>()

const WORKSPACE_OPTIONS: SelectOption[] = [
  { label: 'Prismon Studio', value: 'Prismon Studio' },
  { label: 'Pesquisa Jurídica', value: 'Pesquisa Jurídica' },
  { label: 'Produto & Dados', value: 'Produto & Dados' },
]

const localUsername = ref(props.username)
const localEmail = ref(props.email)
const localWorkspace = ref(props.workspace)

watch(
  () => [props.open, props.username, props.email, props.workspace] as const,
  ([isOpen, username, email, workspace]) => {
    if (isOpen) {
      localUsername.value = username
      localEmail.value = email
      localWorkspace.value = workspace
    }
  },
  { immediate: true },
)

function handleClose() {
  emit('update:open', false)
}

function handleSave() {
  const nextUsername = localUsername.value.trim() || props.username
  const nextEmail = localEmail.value.trim() || props.email
  const nextWorkspace = localWorkspace.value || props.workspace

  emit('save', {
    username: nextUsername,
    email: nextEmail,
    workspace: nextWorkspace,
  })
  toast.success('Preferências atualizadas localmente.')
  emit('update:open', false)
}

function handleLogout() {
  emit('logout')
  emit('update:open', false)
}
</script>

<template>
  <div class="profile-drawer">
    <Drawer
      :open="open"
      direction="bottom"
      ariaLabel="Configurações de conta e workspace"
      @update:open="emit('update:open', $event)"
    >
      <template #header>
        <div class="profile-drawer__container profile-drawer__header">
          <div class="profile-drawer__heading">
            <h2 class="profile-drawer__title">configurações da conta</h2>
            <p class="profile-drawer__role">{{ role }}</p>
          </div>
          <Tag label="plano studio" />
        </div>
      </template>

      <form
        id="profile-settings-form"
        class="profile-drawer__container profile-drawer__form"
        @submit.prevent="handleSave"
      >
        <TextInput
          v-model="localUsername"
          label="Nome de exibição"
          placeholder="Seu nome"
          required
        />
        <TextInput
          v-model="localEmail"
          type="email"
          label="E-mail"
          placeholder="voce@prismon.ai"
          required
        />
        <Select v-model="localWorkspace" label="Workspace ativo" :options="WORKSPACE_OPTIONS" />
      </form>

      <template #footer>
        <div class="profile-drawer__container profile-drawer__footer">
          <Button variant="danger" icon="leave" @click="handleLogout">Sair da conta</Button>
          <div class="profile-drawer__actions">
            <Button variant="tertiary" @click="handleClose">Cancelar</Button>
            <Button variant="primary" type="button" @click="handleSave"> Salvar alterações </Button>
          </div>
        </div>
      </template>
    </Drawer>
  </div>
</template>

<style scoped>
.profile-drawer {
  --profile-drawer-max-width: 520px;
  --profile-drawer-header-gap: var(--spacing-3);
  --profile-drawer-heading-gap: var(--spacing-1);
  --profile-drawer-form-gap: var(--spacing-4);
  --profile-drawer-footer-gap: var(--spacing-3);
  --profile-drawer-footer-padding-top: var(--spacing-4);
  --profile-drawer-border-color: var(--border-subtle-1);
  --profile-drawer-border-width: var(--border-width-thin);
  --profile-drawer-title-color: var(--text-primary);
  --profile-drawer-title-font-family: var(--type-heading-03-font-family);
  --profile-drawer-title-font-size: var(--type-heading-03-font-size);
  --profile-drawer-title-line-height: var(--type-heading-03-line-height);
  --profile-drawer-title-font-weight: var(--type-heading-03-font-weight);
  --profile-drawer-title-text-transform: var(--type-heading-03-text-transform);
  --profile-drawer-role-color: var(--text-helper);
  --profile-drawer-role-font-family: var(--type-helper-text-01-font-family);
  --profile-drawer-role-font-size: var(--type-helper-text-01-font-size);
  --profile-drawer-role-line-height: var(--type-helper-text-01-line-height);
  --profile-drawer-role-font-weight: var(--type-helper-text-01-font-weight);
  --profile-drawer-role-text-transform: var(--type-helper-text-01-text-transform);

  display: contents;
}

.profile-drawer :deep(.drawer--bottom) {
  --drawer-max-width: var(--profile-drawer-max-width);
}

.profile-drawer__container {
  width: 100%;
  max-width: var(--profile-drawer-max-width);
  margin-inline: auto;
  box-sizing: border-box;
}

.profile-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--profile-drawer-header-gap);
}

.profile-drawer__heading {
  display: flex;
  flex-direction: column;
  gap: var(--profile-drawer-heading-gap);
  min-width: var(--spacing-0);
}

.profile-drawer__title {
  margin: var(--spacing-0);
  color: var(--profile-drawer-title-color);
  font-family: var(--profile-drawer-title-font-family);
  font-size: var(--profile-drawer-title-font-size);
  line-height: var(--profile-drawer-title-line-height);
  font-weight: var(--profile-drawer-title-font-weight);
  text-transform: var(--profile-drawer-title-text-transform);
}

.profile-drawer__role {
  margin: var(--spacing-0);
  color: var(--profile-drawer-role-color);
  font-family: var(--profile-drawer-role-font-family);
  font-size: var(--profile-drawer-role-font-size);
  line-height: var(--profile-drawer-role-line-height);
  font-weight: var(--profile-drawer-role-font-weight);
  text-transform: var(--profile-drawer-role-text-transform);
}

.profile-drawer__form {
  display: flex;
  flex-direction: column;
  gap: var(--profile-drawer-form-gap);
}

.profile-drawer__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--profile-drawer-footer-gap);
  padding-top: var(--profile-drawer-footer-padding-top);
  border-top: var(--profile-drawer-border-width) solid var(--profile-drawer-border-color);
}

.profile-drawer__actions {
  display: flex;
  align-items: center;
  gap: var(--profile-drawer-footer-gap);
}

@media (max-width: 767px) {
  .profile-drawer__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-drawer__footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .profile-drawer__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-drawer {
    --drawer-transition-duration: var(--duration-normal);
  }
}
</style>
