<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { getApiErrorMessage, parseApiError } from '@/api/errors'
import {
  Button,
  Modal,
  Select,
  Tabs,
  TextInput,
  toast,
  type SelectOption,
  type TabOption,
} from '@/components/ui'
import { useAuthState } from '@/stores/authState'
import { useWorkspaceState } from '@/stores/workspaceState'

interface Props {
  open: boolean
  username: string
  email: string
  workspace?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [payload: { username: string; email: string; defaultProjectId: number | null }]
  logout: []
}>()

const { updateProfile, changePassword } = useAuthState()
const { projects, defaultProjectId, setDefaultProjectId } = useWorkspaceState()

const localUsername = ref(props.username)
const localEmail = ref(props.email)
const localDefaultProjectId = ref(
  defaultProjectId.value !== null ? String(defaultProjectId.value) : '',
)

const isSavingProfile = ref(false)
const profileErrors = reactive({
  username: '',
  email: '',
})

type ProfileModalTab = 'profile' | 'password'

const profileTabs: TabOption[] = [
  { id: 'profile', label: 'Perfil' },
  { id: 'password', label: 'Alterar senha' },
]

const activeTab = ref<ProfileModalTab>('profile')
const isChangingPassword = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordErrors = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const projectOptions = computed<SelectOption[]>(() => [
  { label: 'Nenhum selecionado', value: '' },
  ...projects.value.map((project) => ({
    label: project.name,
    value: String(project.id),
  })),
])

function resetPasswordState() {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordErrors.oldPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      activeTab.value = 'profile'
      localUsername.value = props.username
      localEmail.value = props.email
      localDefaultProjectId.value =
        defaultProjectId.value !== null ? String(defaultProjectId.value) : ''
      profileErrors.username = ''
      profileErrors.email = ''
      resetPasswordState()
    }
  },
  { immediate: true },
)

function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.includes('@') && !trimmed.startsWith('@') && !trimmed.endsWith('@')
}

function handleClose() {
  if (isSavingProfile.value || isChangingPassword.value) {
    return
  }
  emit('update:open', false)
}

async function handleSave() {
  if (isSavingProfile.value) {
    return
  }

  profileErrors.username = ''
  profileErrors.email = ''

  const nextUsername = localUsername.value.trim()
  const nextEmail = localEmail.value.trim()

  if (!nextUsername) {
    profileErrors.username = 'Informe seu nome de usuário.'
    toast.error('Revise os campos do perfil antes de salvar.')
    return
  }

  if (!nextEmail || !isValidEmail(nextEmail)) {
    profileErrors.email = 'Informe um email válido contendo @.'
    toast.error('Revise os campos do perfil antes de salvar.')
    return
  }

  isSavingProfile.value = true
  try {
    const updated = await updateProfile({
      username: nextUsername,
      email: nextEmail,
    })

    const parsedProjectId = localDefaultProjectId.value ? Number(localDefaultProjectId.value) : null
    const nextDefaultId =
      parsedProjectId !== null && Number.isFinite(parsedProjectId) ? parsedProjectId : null

    if (nextDefaultId !== defaultProjectId.value) {
      setDefaultProjectId(nextDefaultId)
    }

    emit('save', {
      username: updated.username,
      email: updated.email,
      defaultProjectId: nextDefaultId,
    })
    toast.success('Preferências atualizadas com sucesso.')
    emit('update:open', false)
  } catch (error) {
    const parsed = parseApiError(error)
    if (parsed.fieldErrors.username) {
      profileErrors.username = parsed.fieldErrors.username
    }
    if (parsed.fieldErrors.email) {
      profileErrors.email = parsed.fieldErrors.email
    }
    toast.error(getApiErrorMessage(error))
  } finally {
    isSavingProfile.value = false
  }
}

async function handleChangePassword() {
  if (isChangingPassword.value) {
    return
  }

  passwordErrors.oldPassword = ''
  passwordErrors.newPassword = ''
  passwordErrors.confirmPassword = ''

  let valid = true
  if (!passwordForm.oldPassword) {
    passwordErrors.oldPassword = 'Informe sua senha atual.'
    valid = false
  }
  if (passwordForm.newPassword.length < 6) {
    passwordErrors.newPassword = 'A nova senha deve ter no mínimo 6 caracteres.'
    valid = false
  }
  if (passwordForm.confirmPassword !== passwordForm.newPassword) {
    passwordErrors.confirmPassword = 'As senhas não coincidem.'
    valid = false
  }

  if (!valid) {
    toast.error('Revise os campos de senha antes de continuar.')
    return
  }

  isChangingPassword.value = true
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    toast.success('Senha alterada com sucesso.')
    resetPasswordState()
  } catch (error) {
    const parsed = parseApiError(error)
    if (parsed.fieldErrors.old_password) {
      passwordErrors.oldPassword = parsed.fieldErrors.old_password
    }
    if (parsed.fieldErrors.new_password) {
      passwordErrors.newPassword = parsed.fieldErrors.new_password
    }
    toast.error(getApiErrorMessage(error))
  } finally {
    isChangingPassword.value = false
  }
}

function handleLogout() {
  emit('logout')
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    size="md"
    title="configurações da conta"
    :subtitle="email || 'usuário autenticado'"
    @update:open="emit('update:open', $event)"
  >
    <div class="profile-modal">
      <Tabs
        :model-value="activeTab"
        :items="profileTabs"
        aria-label="Abas de configurações da conta"
        class="profile-modal__tabs"
        @update:model-value="activeTab = $event as ProfileModalTab"
      />

      <form
        v-if="activeTab === 'profile'"
        id="profile-settings-form"
        class="profile-modal__form"
        novalidate
        @submit.prevent="handleSave"
      >
        <TextInput
          v-model="localUsername"
          label="Nome de exibição"
          name="profile-username"
          placeholder="Seu nome"
          :disabled="isSavingProfile"
          :error="profileErrors.username"
          required
          @update:model-value="profileErrors.username = ''"
        />
        <TextInput
          v-model="localEmail"
          type="email"
          label="E-mail"
          name="profile-email"
          placeholder="voce@prismon.ai"
          :disabled="isSavingProfile"
          :error="profileErrors.email"
          required
          @update:model-value="profileErrors.email = ''"
        />
        <Select
          v-model="localDefaultProjectId"
          label="Projeto padrão"
          name="profile-default-project"
          :disabled="isSavingProfile"
          :options="projectOptions"
        />
      </form>

      <form
        v-else
        id="profile-password-form"
        class="profile-modal__form"
        novalidate
        @submit.prevent="handleChangePassword"
      >
        <TextInput
          v-model="passwordForm.oldPassword"
          type="password"
          name="old-password"
          label="Senha atual"
          placeholder="Digite sua senha atual"
          autocomplete="current-password"
          :disabled="isChangingPassword"
          :error="passwordErrors.oldPassword"
          @update:model-value="passwordErrors.oldPassword = ''"
        />
        <TextInput
          v-model="passwordForm.newPassword"
          type="password"
          name="new-password"
          label="Nova senha"
          placeholder="Mínimo de 6 caracteres"
          autocomplete="new-password"
          :disabled="isChangingPassword"
          :error="passwordErrors.newPassword"
          @update:model-value="passwordErrors.newPassword = ''"
        />
        <TextInput
          v-model="passwordForm.confirmPassword"
          type="password"
          name="confirm-password"
          label="Confirmar nova senha"
          placeholder="Repita a nova senha"
          autocomplete="new-password"
          :disabled="isChangingPassword"
          :error="passwordErrors.confirmPassword"
          @update:model-value="passwordErrors.confirmPassword = ''"
        />
      </form>
    </div>

    <template #footer>
      <div class="profile-modal__footer">
        <Button
          variant="danger"
          icon="leave"
          :disabled="isSavingProfile || isChangingPassword"
          @click="handleLogout"
        >
          Sair da conta
        </Button>
        <div class="profile-modal__actions">
          <Button
            variant="tertiary"
            :disabled="isSavingProfile || isChangingPassword"
            @click="handleClose"
          >
            Cancelar
          </Button>
          <Button
            v-if="activeTab === 'profile'"
            variant="primary"
            type="button"
            :disabled="isSavingProfile || isChangingPassword"
            @click="handleSave"
          >
            {{ isSavingProfile ? 'Salvando...' : 'Salvar alterações' }}
          </Button>
          <Button
            v-else
            variant="primary"
            type="button"
            :disabled="isSavingProfile || isChangingPassword"
            @click="handleChangePassword"
          >
            {{ isChangingPassword ? 'Alterando senha...' : 'Atualizar senha' }}
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.profile-modal,
.profile-modal__footer {
  --profile-modal-gap: var(--spacing-5);
  --profile-modal-form-gap: var(--spacing-4);
  --profile-modal-footer-gap: var(--spacing-3);
  --profile-modal-border-color: var(--border-subtle-1);
  --profile-modal-border-width: var(--border-width-thin);
}

.profile-modal {
  display: flex;
  flex-direction: column;
  gap: var(--profile-modal-gap);
}

.profile-modal__tabs {
  display: flex;
  width: 100%;
  border-bottom: var(--profile-modal-border-width) solid var(--profile-modal-border-color);
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
