<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button, Modal, Select, Tag, TextInput, toast, type SelectOption } from '@/components/ui'
import { MEMBER_PROJECTS } from './navigationConfig'

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

const localUsername = ref(props.username)
const localEmail = ref(props.email)
const localWorkspace = ref(props.workspace)

const projectOptions = computed<SelectOption[]>(() => {
  const base = MEMBER_PROJECTS.map((project) => ({
    label: project.name,
    value: project.name,
  }))
  if (props.workspace && !base.some((option) => option.value === props.workspace)) {
    return [{ label: props.workspace, value: props.workspace }, ...base]
  }
  return base
})

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
  <Modal
    :open="open"
    size="lg"
    title="configurações da conta"
    :subtitle="`${role} • ${workspace}`"
    @update:open="emit('update:open', $event)"
  >
    <div class="profile-modal">
      <div class="profile-modal__plan">
        <Tag label="plano studio" />
      </div>

      <form id="profile-settings-form" class="profile-modal__form" @submit.prevent="handleSave">
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
        <Select v-model="localWorkspace" label="Projeto padrão" :options="projectOptions" />
      </form>
    </div>

    <template #footer>
      <div class="profile-modal__footer">
        <Button variant="danger" icon="leave" @click="handleLogout">Sair da conta</Button>
        <div class="profile-modal__actions">
          <Button variant="tertiary" @click="handleClose">Cancelar</Button>
          <Button variant="primary" type="button" @click="handleSave">Salvar alterações</Button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.profile-modal,
.profile-modal__footer {
  --profile-modal-gap: var(--spacing-4);
  --profile-modal-form-gap: var(--spacing-4);
  --profile-modal-footer-gap: var(--spacing-3);
}

.profile-modal {
  display: flex;
  flex-direction: column;
  gap: var(--profile-modal-gap);
}

.profile-modal__plan {
  display: flex;
  align-items: center;
}

.profile-modal__form {
  display: flex;
  flex-direction: column;
  gap: var(--profile-modal-form-gap);
}

.profile-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  width: 100%;
  gap: var(--profile-modal-footer-gap);
}

.profile-modal__actions {
  display: flex;
  align-items: center;
  gap: var(--profile-modal-footer-gap);
}

@media (max-width: 767px) {
  .profile-modal__footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .profile-modal__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-modal {
    scroll-behavior: auto;
  }
}
</style>
