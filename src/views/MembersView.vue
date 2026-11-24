<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AppShell } from '@/components/shell'
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Modal,
  Notification,
  SearchInput,
  Select,
  Tag,
  TextInput,
  toast,
  type BatchAction,
  type DataTableColumn,
  type SelectOption,
} from '@/components/ui'
import { getApiErrorMessage } from '@/api/errors'
import { getMemberRoleLabel } from '@/api/mappers/memberMapper'
import { useMembersApi } from '@/composables/api'
import { useAuthState } from '@/stores/authState'
import { useWorkspaceState } from '@/stores/workspaceState'
import type { MemberRole, ProjectMember } from '@/types/members'

const PAGE_SIZE = 10

const columns: DataTableColumn[] = [
  { key: 'userLabel', label: 'usuário' },
  { key: 'roleLabel', label: 'cargo' },
  { key: 'statusLabel', label: 'status' },
  { key: 'createdAtLabel', label: 'entrada' },
]

const roleFilterOptions: SelectOption[] = [
  { label: 'todos os cargos', value: 'all' },
  { label: 'Proprietário', value: 'owner' },
  { label: 'Diretor', value: 'director' },
  { label: 'Membro', value: 'member' },
  { label: 'Colaborador', value: 'collaborator' },
]

const batchRoleOptions: SelectOption[] = [
  { label: 'Diretor', value: 'director' },
  { label: 'Membro', value: 'member' },
  { label: 'Colaborador', value: 'collaborator' },
  { label: 'Proprietário', value: 'owner' },
]

const batchActions: BatchAction[] = [
  { id: 'change-role', label: 'alterar cargo', icon: 'people' },
  { id: 'remove', label: 'remover', icon: 'delete' },
]

const { activeProjectId, loadProjects } = useWorkspaceState()
const { currentUser } = useAuthState()
const membersApi = useMembersApi()

const members = ref<ProjectMember[]>([])
const isLoading = ref(false)
const isSubmittingInvite = ref(false)
const isSubmittingBatchRole = ref(false)
const isSubmittingRemove = ref(false)
const isRespondingInvite = ref(false)
let latestLoadRequestId = 0

const searchQuery = ref('')
const roleFilter = ref('')
const selectedKeys = ref<number[]>([])
const currentPage = ref(1)

const isInviteModalOpen = ref(false)
const inviteUserId = ref('')
const inviteUserIdError = ref('')

const isRoleModalOpen = ref(false)
const batchRoleTarget = ref<MemberRole>('member')

const isRemoveDialogOpen = ref(false)

const pendingInvite = computed(() => {
  const userId = currentUser.value?.id
  if (userId === undefined || userId === null) {
    return null
  }
  return (
    members.value.find((member) => member.userId === userId && member.status === 'pending') ?? null
  )
})

const filteredMembers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const activeRole = roleFilter.value

  return members.value.filter((member) => {
    const matchesQuery =
      query.length === 0 ||
      member.userLabel.toLowerCase().includes(query) ||
      String(member.userId).includes(query) ||
      member.roleLabel.toLowerCase().includes(query)

    const matchesRole = !activeRole || activeRole === 'all' || member.role === activeRole

    return matchesQuery && matchesRole
  })
})

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredMembers.value.slice(start, start + PAGE_SIZE)
})

const tableRows = computed<Array<Record<string, unknown>>>(() =>
  paginatedMembers.value.map((member) => ({ ...member })),
)

const canPrevious = computed(() => currentPage.value > 1)
const canNext = computed(() => currentPage.value * PAGE_SIZE < filteredMembers.value.length)

async function loadMembers(projectId: number): Promise<void> {
  const requestId = ++latestLoadRequestId
  isLoading.value = true

  try {
    const page = await membersApi.listMembers(projectId, { limit: 100 })
    if (requestId === latestLoadRequestId && activeProjectId.value === projectId) {
      members.value = page.items
    }
  } catch (error) {
    if (requestId === latestLoadRequestId) {
      toast.error(getApiErrorMessage(error, 'Não foi possível carregar os membros do projeto.'))
    }
  } finally {
    if (requestId === latestLoadRequestId) {
      isLoading.value = false
    }
  }
}

watch(
  activeProjectId,
  (projectId) => {
    selectedKeys.value = []
    currentPage.value = 1

    if (projectId === null) {
      latestLoadRequestId += 1
      members.value = []
      isLoading.value = false
      return
    }

    void loadMembers(projectId)
  },
  { immediate: true },
)

watch([searchQuery, roleFilter], () => {
  currentPage.value = 1
})

function getRoleModifier(role: string): string {
  if (role === 'owner' || role === 'director') {
    return 'admin'
  }
  if (role === 'member') {
    return 'editor'
  }
  return 'viewer'
}

function getStatusModifier(status: string): string {
  return status === 'active' ? 'active' : 'pending'
}

function toggleSelect(rowKey: string | number) {
  const key = Number(rowKey)
  if (!Number.isFinite(key)) {
    return
  }
  if (selectedKeys.value.includes(key)) {
    selectedKeys.value = selectedKeys.value.filter((item) => item !== key)
    return
  }
  selectedKeys.value = [...selectedKeys.value, key]
}

function handleBatchAction(actionId: string) {
  if (selectedKeys.value.length === 0) {
    return
  }
  if (actionId === 'change-role') {
    batchRoleTarget.value = 'member'
    isRoleModalOpen.value = true
    return
  }
  if (actionId === 'remove') {
    isRemoveDialogOpen.value = true
  }
}

function handleRefreshMembers() {
  if (activeProjectId.value === null || isLoading.value) {
    return
  }
  void loadMembers(activeProjectId.value)
}

function openInviteModal() {
  if (activeProjectId.value === null) {
    toast.error('Selecione um projeto ativo antes de convidar membros.')
    return
  }
  resetInviteForm()
  isInviteModalOpen.value = true
}

function resetInviteForm() {
  inviteUserId.value = ''
  inviteUserIdError.value = ''
}

function closeInviteModal() {
  isInviteModalOpen.value = false
  resetInviteForm()
}

async function handleInviteSubmit() {
  const projectId = activeProjectId.value
  if (projectId === null) {
    toast.error('Selecione um projeto ativo antes de convidar.')
    return
  }

  const rawValue = inviteUserId.value.trim()
  const parsedUserId = Number(rawValue)
  inviteUserIdError.value = ''

  if (!rawValue || !Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    inviteUserIdError.value = 'Informe um ID de usuário válido (inteiro positivo).'
    toast.error('Informe um ID de usuário válido antes de enviar.')
    return
  }

  if (isSubmittingInvite.value) {
    return
  }

  isSubmittingInvite.value = true
  try {
    const invited = await membersApi.inviteMember(projectId, { userId: parsedUserId })
    await loadMembers(projectId)
    currentPage.value = 1
    closeInviteModal()
    toast.success(`Convite enviado para ${invited.userLabel}.`)
  } catch (error) {
    const message = getApiErrorMessage(error, 'Não foi possível enviar o convite.')
    inviteUserIdError.value = message
    toast.error(message)
  } finally {
    isSubmittingInvite.value = false
  }
}

async function handleAcceptInvite() {
  const projectId = activeProjectId.value
  if (projectId === null || isRespondingInvite.value) {
    return
  }

  isRespondingInvite.value = true
  try {
    await membersApi.acceptProjectInvite(projectId)
    await Promise.all([loadMembers(projectId), loadProjects(true)])
    toast.success('Convite aceito com sucesso.')
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível aceitar o convite.'))
  } finally {
    isRespondingInvite.value = false
  }
}

async function handleRefuseInvite() {
  const projectId = activeProjectId.value
  if (projectId === null || isRespondingInvite.value) {
    return
  }

  isRespondingInvite.value = true
  try {
    await membersApi.refuseProjectInvite(projectId)
    await loadProjects(true)
    if (activeProjectId.value === projectId) {
      await loadMembers(projectId)
    }
    toast.info('Convite recusado.')
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível recusar o convite.'))
  } finally {
    isRespondingInvite.value = false
  }
}

async function confirmBatchRoleChange() {
  const projectId = activeProjectId.value
  const targetIds = [...selectedKeys.value]
  if (projectId === null || targetIds.length === 0) {
    isRoleModalOpen.value = false
    return
  }

  if (isSubmittingBatchRole.value) {
    return
  }

  isSubmittingBatchRole.value = true
  try {
    await Promise.all(
      targetIds.map((memberId) =>
        membersApi.changeMemberRole(projectId, memberId, { role: batchRoleTarget.value }),
      ),
    )
    await loadMembers(projectId)
    isRoleModalOpen.value = false
    selectedKeys.value = []
    toast.success(
      `Cargo atualizado para ${getMemberRoleLabel(batchRoleTarget.value)} em ${targetIds.length} membro(s).`,
    )
  } catch (error) {
    toast.error(
      getApiErrorMessage(error, 'Não foi possível alterar o cargo dos membros selecionados.'),
    )
  } finally {
    isSubmittingBatchRole.value = false
  }
}

async function confirmRemoveMembers() {
  const projectId = activeProjectId.value
  const targetIds = [...selectedKeys.value]
  if (projectId === null || targetIds.length === 0) {
    isRemoveDialogOpen.value = false
    return
  }

  if (isSubmittingRemove.value) {
    return
  }

  isSubmittingRemove.value = true
  try {
    await Promise.all(targetIds.map((memberId) => membersApi.removeMember(projectId, memberId)))
    await loadMembers(projectId)
    isRemoveDialogOpen.value = false
    selectedKeys.value = []
    toast.success(`${targetIds.length} membro(s) removido(s) do projeto.`)
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível remover os membros selecionados.'))
  } finally {
    isSubmittingRemove.value = false
  }
}
</script>

<template>
  <AppShell title="membros" active-nav="members">
    <div class="members-view">
      <div
        v-if="pendingInvite"
        class="members-view__invite-banner"
        role="region"
        aria-label="Convite pendente"
      >
        <Notification
          variant="default"
          icon="add-member"
          title="Convite pendente para este projeto"
          :message="`Você recebeu um convite como ${pendingInvite.roleLabel}. Deseja aceitar ou recusar o acesso?`"
        />
        <div class="members-view__invite-actions">
          <Button
            variant="tertiary"
            size="sm"
            :disabled="isRespondingInvite"
            @click="handleRefuseInvite"
          >
            Recusar
          </Button>
          <Button
            variant="primary"
            size="sm"
            :disabled="isRespondingInvite"
            @click="handleAcceptInvite"
          >
            Aceitar
          </Button>
        </div>
      </div>

      <div class="members-view__filters">
        <div class="members-view__search">
          <SearchInput
            v-model="searchQuery"
            placeholder="Buscar membro por usuário, ID ou cargo"
            aria-label="Buscar membro por usuário, ID ou cargo"
          />
        </div>
        <div class="members-view__role-select">
          <Select
            v-model="roleFilter"
            :options="roleFilterOptions"
            placeholder="todos os cargos"
            aria-label="Filtrar por cargo"
          />
        </div>
        <Button
          variant="tertiary"
          size="md"
          icon="refresh"
          :disabled="isLoading || activeProjectId === null"
          @click="handleRefreshMembers"
        >
          Atualizar
        </Button>
      </div>

      <DataTable
        title="membros do workspace"
        description="gerencie permissões e acessos da equipe no prismon"
        :columns="columns"
        :rows="tableRows"
        :selectable="true"
        :selected-row-keys="selectedKeys"
        :show-pagination="true"
        :can-previous="canPrevious"
        :can-next="canNext"
        action-label="convidar membro"
        action-icon="add-member"
        :batch-actions="batchActions"
        @toggle-select="toggleSelect"
        @previous-page="currentPage--"
        @next-page="currentPage++"
        @primary-action="openInviteModal"
        @batch-action="handleBatchAction"
        @clear-selection="selectedKeys = []"
      >
        <template #cell-roleLabel="{ row }">
          <Badge
            :class="[
              'members-view__role-badge',
              `members-view__role-badge--${getRoleModifier(String(row.role ?? ''))}`,
            ]"
            :label="String(row.roleLabel ?? '')"
          />
        </template>

        <template #cell-statusLabel="{ row }">
          <Tag
            :class="[
              'members-view__status-tag',
              `members-view__status-tag--${getStatusModifier(String(row.status ?? ''))}`,
            ]"
            :label="String(row.statusLabel ?? '')"
          />
        </template>
      </DataTable>

      <p v-if="isLoading" class="members-view__empty" role="status">Carregando membros...</p>

      <p v-else-if="activeProjectId === null" class="members-view__empty" role="status">
        Selecione um projeto para visualizar os membros.
      </p>

      <p v-else-if="filteredMembers.length === 0" class="members-view__empty" role="status">
        Nenhum membro encontrado para os filtros aplicados.
      </p>
    </div>

    <Modal
      v-model:open="isInviteModalOpen"
      size="md"
      title="convidar membro"
      subtitle="Informe o ID numérico do usuário para enviar o convite ao projeto."
      @close="resetInviteForm"
    >
      <div class="members-view__modal-fields">
        <TextInput
          v-model="inviteUserId"
          type="number"
          label="ID do usuário"
          name="invite-user-id"
          placeholder="Ex.: 42"
          :error="inviteUserIdError"
          @update:model-value="inviteUserIdError = ''"
        />
      </div>

      <template #footer>
        <Button variant="tertiary" :disabled="isSubmittingInvite" @click="closeInviteModal">
          Cancelar
        </Button>
        <Button variant="primary" :disabled="isSubmittingInvite" @click="handleInviteSubmit">
          Enviar convite
        </Button>
      </template>
    </Modal>

    <Modal
      v-model:open="isRoleModalOpen"
      size="md"
      title="alterar cargo"
      subtitle="Defina o novo nível de acesso dos membros selecionados."
    >
      <div class="members-view__modal-fields">
        <Select
          v-model="batchRoleTarget"
          label="novo cargo"
          name="batch-role-target"
          :options="batchRoleOptions"
        />
      </div>

      <template #footer>
        <Button
          variant="tertiary"
          :disabled="isSubmittingBatchRole"
          @click="isRoleModalOpen = false"
        >
          Cancelar
        </Button>
        <Button variant="primary" :disabled="isSubmittingBatchRole" @click="confirmBatchRoleChange">
          Aplicar
        </Button>
      </template>
    </Modal>

    <ConfirmDialog
      v-model:open="isRemoveDialogOpen"
      title="remover membros"
      :description="`Deseja remover ${selectedKeys.length} membro(s) deste projeto?`"
      confirm-label="Remover"
      confirm-variant="danger"
      @confirm="confirmRemoveMembers"
    />
  </AppShell>
</template>

<style scoped>
.members-view {
  --members-view-max-width: 1100px;
  --members-view-padding: var(--spacing-6);
  --members-view-mobile-padding: var(--spacing-4);
  --members-view-gap: var(--spacing-6);
  --members-view-filters-gap: var(--spacing-4);
  --members-view-role-select-width: 220px;
  --members-view-modal-gap: var(--spacing-4);
  --members-view-banner-gap: var(--spacing-3);
  --members-view-banner-actions-gap: var(--spacing-2);
  --members-view-banner-bg: var(--surface-brand-subtle);
  --members-view-banner-border-color: var(--border-brand-subtle);
  --members-view-banner-border-width: var(--border-width-thin);
  --members-view-banner-padding: var(--spacing-3);
  --members-view-empty-padding: var(--spacing-5);
  --members-view-empty-bg: var(--surface-elevated);
  --members-view-empty-border-color: var(--border-subtle-1);
  --members-view-empty-border-width: var(--border-width-thin);
  --members-view-empty-color: var(--text-secondary);
  --members-view-empty-font-family: var(--type-body-01-font-family);
  --members-view-empty-font-size: var(--type-body-01-font-size);
  --members-view-empty-line-height: var(--type-body-01-line-height);
  --members-view-empty-font-weight: var(--type-body-01-font-weight);
  --members-view-badge-admin-bg: var(--surface-brand-selection);
  --members-view-badge-admin-color: var(--text-brand-strong);
  --members-view-badge-editor-bg: var(--surface-subtle-hover);
  --members-view-badge-editor-color: var(--text-primary);
  --members-view-badge-viewer-bg: var(--surface-disabled);
  --members-view-badge-viewer-color: var(--text-secondary);
  --members-view-tag-active-dot: var(--icon-brand);
  --members-view-tag-pending-dot: var(--icon-helper);
  --members-view-tag-pending-color: var(--text-tertiary);

  display: flex;
  flex-direction: column;
  gap: var(--members-view-gap);
  width: 100%;
  max-width: var(--members-view-max-width);
  margin: var(--spacing-0) auto;
  padding: var(--members-view-padding);
  box-sizing: border-box;
}

.members-view__invite-banner {
  display: flex;
  flex-direction: column;
  gap: var(--members-view-banner-gap);
  padding: var(--members-view-banner-padding);
  background-color: var(--members-view-banner-bg);
  border: var(--members-view-banner-border-width) solid var(--members-view-banner-border-color);
}

.members-view__invite-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--members-view-banner-actions-gap);
}

.members-view__filters {
  display: flex;
  align-items: center;
  gap: var(--members-view-filters-gap);
}

.members-view__search {
  flex: 1;
  min-width: var(--spacing-0);
}

.members-view__role-select {
  width: var(--members-view-role-select-width);
  flex-shrink: 0;
}

.members-view__modal-fields {
  display: flex;
  flex-direction: column;
  gap: var(--members-view-modal-gap);
}

.members-view__empty {
  margin: var(--spacing-0);
  padding: var(--members-view-empty-padding);
  background-color: var(--members-view-empty-bg);
  border: var(--members-view-empty-border-width) solid var(--members-view-empty-border-color);
  color: var(--members-view-empty-color);
  font-family: var(--members-view-empty-font-family);
  font-size: var(--members-view-empty-font-size);
  line-height: var(--members-view-empty-line-height);
  font-weight: var(--members-view-empty-font-weight);
  text-align: center;
}

.members-view__role-badge.members-view__role-badge--admin {
  --badge-bg: var(--members-view-badge-admin-bg);
  --badge-color: var(--members-view-badge-admin-color);
}

.members-view__role-badge.members-view__role-badge--editor {
  --badge-bg: var(--members-view-badge-editor-bg);
  --badge-color: var(--members-view-badge-editor-color);
}

.members-view__role-badge.members-view__role-badge--viewer {
  --badge-bg: var(--members-view-badge-viewer-bg);
  --badge-color: var(--members-view-badge-viewer-color);
}

.members-view__status-tag.members-view__status-tag--active {
  --tag-dot-bg: var(--members-view-tag-active-dot);
}

.members-view__status-tag.members-view__status-tag--pending {
  --tag-dot-bg: var(--members-view-tag-pending-dot);
  --tag-color: var(--members-view-tag-pending-color);
}

@media (max-width: 767px) {
  .members-view {
    padding: var(--members-view-mobile-padding);
  }

  .members-view__filters {
    flex-direction: column;
    align-items: stretch;
  }

  .members-view__role-select {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .members-view {
    scroll-behavior: auto;
  }
}
</style>
