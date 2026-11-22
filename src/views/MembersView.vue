<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { AppShell } from '@/components/shell'
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Modal,
  SearchInput,
  Select,
  Tag,
  TextInput,
  toast,
  type BatchAction,
  type DataTableColumn,
  type SelectOption,
} from '@/components/ui'

type MemberRole = 'Administrador' | 'Editor' | 'Visualizador'
type MemberStatus = 'Ativo' | 'Convite pendente'

type MemberRow = {
  id: string
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
  joinedAt: string
}

const PAGE_SIZE = 10

const INITIAL_MEMBERS: MemberRow[] = [
  {
    id: 'mem-1',
    name: 'Ana Paula Ribeiro',
    email: 'ana@prismon.ai',
    role: 'Administrador',
    status: 'Ativo',
    joinedAt: '12/01/2026',
  },
  {
    id: 'mem-2',
    name: 'Lucas Ferreira',
    email: 'lucas@prismon.ai',
    role: 'Editor',
    status: 'Ativo',
    joinedAt: '03/02/2026',
  },
  {
    id: 'mem-3',
    name: 'Camila Andrade',
    email: 'camila@prismon.ai',
    role: 'Editor',
    status: 'Ativo',
    joinedAt: '19/02/2026',
  },
  {
    id: 'mem-4',
    name: 'Rafael Nogueira',
    email: 'rafael@prismon.ai',
    role: 'Visualizador',
    status: 'Convite pendente',
    joinedAt: '04/03/2026',
  },
  {
    id: 'mem-5',
    name: 'Beatriz Mendes',
    email: 'beatriz@prismon.ai',
    role: 'Visualizador',
    status: 'Ativo',
    joinedAt: '15/03/2026',
  },
]

const columns: DataTableColumn[] = [
  { key: 'name', label: 'nome' },
  { key: 'email', label: 'email' },
  { key: 'role', label: 'cargo' },
  { key: 'status', label: 'status' },
  { key: 'joinedAt', label: 'entrada' },
]

const roleOptions: SelectOption[] = [
  { label: 'Administrador', value: 'Administrador' },
  { label: 'Editor', value: 'Editor' },
  { label: 'Visualizador', value: 'Visualizador' },
]

const roleFilterOptions: SelectOption[] = [
  { label: 'todos os cargos', value: 'all' },
  ...roleOptions,
]

const batchActions: BatchAction[] = [
  { id: 'change-role', label: 'alterar cargo', icon: 'people' },
  { id: 'remove', label: 'remover', icon: 'delete' },
]

const members = ref<MemberRow[]>(INITIAL_MEMBERS.map((item) => ({ ...item })))
const searchQuery = ref('')
const roleFilter = ref('')
const selectedKeys = ref<string[]>([])
const currentPage = ref(1)

const isInviteModalOpen = ref(false)
const inviteName = ref('')
const inviteEmail = ref('')
const inviteRole = ref<MemberRole>('Editor')
const inviteErrors = reactive({
  name: '',
  email: '',
})

const isRoleModalOpen = ref(false)
const batchRoleTarget = ref<MemberRole>('Editor')

const isRemoveDialogOpen = ref(false)

const filteredMembers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const activeRole = roleFilter.value

  return members.value.filter((member) => {
    const matchesQuery =
      query.length === 0 ||
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)

    const matchesRole = !activeRole || activeRole === 'all' || member.role === activeRole

    return matchesQuery && matchesRole
  })
})

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredMembers.value.slice(start, start + PAGE_SIZE)
})

const canPrevious = computed(() => currentPage.value > 1)
const canNext = computed(() => currentPage.value * PAGE_SIZE < filteredMembers.value.length)

watch([searchQuery, roleFilter], () => {
  currentPage.value = 1
})

function getRoleModifier(role: string): string {
  if (role === 'Administrador') {
    return 'admin'
  }
  if (role === 'Editor') {
    return 'editor'
  }
  return 'viewer'
}

function getStatusModifier(status: string): string {
  return status === 'Ativo' ? 'active' : 'pending'
}

function toggleSelect(rowKey: string | number) {
  const key = String(rowKey)
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
    batchRoleTarget.value = 'Editor'
    isRoleModalOpen.value = true
    return
  }
  if (actionId === 'remove') {
    isRemoveDialogOpen.value = true
  }
}

function resetInviteForm() {
  inviteName.value = ''
  inviteEmail.value = ''
  inviteRole.value = 'Editor'
  inviteErrors.name = ''
  inviteErrors.email = ''
}

function closeInviteModal() {
  isInviteModalOpen.value = false
  resetInviteForm()
}

function handleInviteSubmit() {
  const name = inviteName.value.trim()
  const email = inviteEmail.value.trim()
  let valid = true

  inviteErrors.name = ''
  inviteErrors.email = ''

  if (!name) {
    inviteErrors.name = 'Informe o nome do membro.'
    valid = false
  }

  if (!email) {
    inviteErrors.email = 'Informe o email do membro.'
    valid = false
  } else if (!email.includes('@')) {
    inviteErrors.email = 'Informe um email válido contendo @.'
    valid = false
  }

  if (!valid) {
    toast.error('Revise os campos do convite antes de enviar.')
    return
  }

  const newMember: MemberRow = {
    id: `mem-${Date.now()}`,
    name,
    email,
    role: inviteRole.value,
    status: 'Convite pendente',
    joinedAt: 'agora',
  }

  members.value = [newMember, ...members.value]
  currentPage.value = 1
  closeInviteModal()
  toast.success(`Convite simulado enviado para ${name}.`)
}

function confirmBatchRoleChange() {
  const targetIds = new Set(selectedKeys.value)
  const count = targetIds.size
  if (count === 0) {
    isRoleModalOpen.value = false
    return
  }

  members.value = members.value.map((member) =>
    targetIds.has(member.id) ? { ...member, role: batchRoleTarget.value } : member,
  )

  isRoleModalOpen.value = false
  selectedKeys.value = []
  toast.success(`Cargo atualizado para ${batchRoleTarget.value} em ${count} membro(s).`)
}

function confirmRemoveMembers() {
  const targetIds = new Set(selectedKeys.value)
  const count = targetIds.size
  if (count === 0) {
    isRemoveDialogOpen.value = false
    return
  }

  members.value = members.value.filter((member) => !targetIds.has(member.id))
  isRemoveDialogOpen.value = false
  selectedKeys.value = []
  toast.success(`${count} membro(s) removido(s) da lista simulada.`)
}
</script>

<template>
  <AppShell title="membros" active-nav="members">
    <div class="members-view">
      <div class="members-view__filters">
        <div class="members-view__search">
          <SearchInput
            v-model="searchQuery"
            placeholder="Buscar membro por nome ou email"
            aria-label="Buscar membro por nome ou email"
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
      </div>

      <DataTable
        title="membros do workspace"
        description="gerencie permissões e acessos da equipe no prismon"
        :columns="columns"
        :rows="paginatedMembers"
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
        @primary-action="isInviteModalOpen = true"
        @batch-action="handleBatchAction"
        @clear-selection="selectedKeys = []"
      >
        <template #cell-role="{ row }">
          <Badge
            :class="[
              'members-view__role-badge',
              `members-view__role-badge--${getRoleModifier(String(row.role))}`,
            ]"
            :label="String(row.role)"
          />
        </template>

        <template #cell-status="{ row }">
          <Tag
            :class="[
              'members-view__status-tag',
              `members-view__status-tag--${getStatusModifier(String(row.status))}`,
            ]"
            :label="String(row.status)"
          />
        </template>
      </DataTable>

      <p v-if="filteredMembers.length === 0" class="members-view__empty" role="status">
        Nenhum membro encontrado para os filtros aplicados.
      </p>
    </div>

    <Modal
      v-model:open="isInviteModalOpen"
      size="sm"
      title="convidar membro"
      subtitle="Adicione um integrante ao workspace."
      @close="resetInviteForm"
    >
      <div class="members-view__modal-fields">
        <TextInput
          v-model="inviteName"
          label="nome"
          name="invite-name"
          placeholder="Ex.: Mariana Costa"
          :error="inviteErrors.name"
          @update:model-value="inviteErrors.name = ''"
        />
        <TextInput
          v-model="inviteEmail"
          type="email"
          label="email"
          name="invite-email"
          placeholder="mariana@empresa.com"
          :error="inviteErrors.email"
          @update:model-value="inviteErrors.email = ''"
        />
        <Select v-model="inviteRole" label="cargo" name="invite-role" :options="roleOptions" />
      </div>

      <template #footer>
        <Button variant="tertiary" @click="closeInviteModal">Cancelar</Button>
        <Button variant="primary" @click="handleInviteSubmit">Enviar convite</Button>
      </template>
    </Modal>

    <Modal
      v-model:open="isRoleModalOpen"
      size="sm"
      title="alterar cargo"
      subtitle="Defina o novo nível de acesso dos membros selecionados."
    >
      <div class="members-view__modal-fields">
        <Select
          v-model="batchRoleTarget"
          label="novo cargo"
          name="batch-role-target"
          :options="roleOptions"
        />
      </div>

      <template #footer>
        <Button variant="tertiary" @click="isRoleModalOpen = false">Cancelar</Button>
        <Button variant="primary" @click="confirmBatchRoleChange">Aplicar</Button>
      </template>
    </Modal>

    <ConfirmDialog
      v-model:open="isRemoveDialogOpen"
      title="remover membros"
      :description="`Deseja remover ${selectedKeys.length} membro(s) desta lista simulada?`"
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
