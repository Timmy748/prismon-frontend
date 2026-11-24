<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AppShell } from '@/components/shell'
import {
  Button,
  ConfirmDialog,
  DataTable,
  Modal,
  Select,
  TextInput,
  toast,
  type BatchAction,
  type DataTableColumn,
  type SelectOption,
} from '@/components/ui'
import { getApiErrorMessage } from '@/api/errors'
import { useApiKeysApi } from '@/composables/api'
import { useWorkspaceState } from '@/stores/workspaceState'
import type { ApiKeyItem, ApiKeyProvider } from '@/types/apiKeys'

type ApiKeyType = 'projeto' | 'membro'

type PendingRevokeTarget = {
  type: ApiKeyType
  ids: number[]
}

const PAGE_SIZE = 10

const columns: DataTableColumn[] = [
  { key: 'id', label: 'id' },
  { key: 'provider', label: 'provedor' },
  { key: 'hint', label: 'hint' },
  { key: 'createdAtLabel', label: 'criada em' },
]

const keyTypeOptions: SelectOption[] = [
  { label: 'Projeto', value: 'projeto' },
  { label: 'Membro logado', value: 'membro' },
]

const providerOptions: SelectOption[] = [{ label: 'OpenRouter', value: 'openrouter' }]

const batchActions: BatchAction[] = [{ id: 'revoke', label: 'revogar', icon: 'delete' }]

const { activeProjectId } = useWorkspaceState()
const apiKeysApi = useApiKeysApi()

const projectKeys = ref<ApiKeyItem[]>([])
const memberKeys = ref<ApiKeyItem[]>([])

const isLoadingProjectKeys = ref(false)
const isLoadingMemberKeys = ref(false)
const isSubmittingCreate = ref(false)
const isSubmittingRevoke = ref(false)
let latestProjectRequestId = 0
let latestMemberRequestId = 0

const selectedProjectKeys = ref<number[]>([])
const selectedMemberKeys = ref<number[]>([])

const projectPage = ref(1)
const memberPage = ref(1)

const isCreateModalOpen = ref(false)
const newKeyType = ref<ApiKeyType>('projeto')
const newKeyProvider = ref<ApiKeyProvider>('openrouter')
const newKeySecret = ref('')
const newKeyError = ref('')

const isRevokeDialogOpen = ref(false)
const pendingRevokeTarget = ref<PendingRevokeTarget | null>(null)

const paginatedProjectKeys = computed(() => {
  const start = (projectPage.value - 1) * PAGE_SIZE
  return projectKeys.value.slice(start, start + PAGE_SIZE)
})

const paginatedMemberKeys = computed(() => {
  const start = (memberPage.value - 1) * PAGE_SIZE
  return memberKeys.value.slice(start, start + PAGE_SIZE)
})

const projectTableRows = computed<Array<Record<string, unknown>>>(() =>
  paginatedProjectKeys.value.map((item) => ({ ...item })),
)

const memberTableRows = computed<Array<Record<string, unknown>>>(() =>
  paginatedMemberKeys.value.map((item) => ({ ...item })),
)

const canProjectPrevious = computed(() => projectPage.value > 1)
const canProjectNext = computed(() => projectPage.value * PAGE_SIZE < projectKeys.value.length)

const canMemberPrevious = computed(() => memberPage.value > 1)
const canMemberNext = computed(() => memberPage.value * PAGE_SIZE < memberKeys.value.length)

async function loadProjectKeys(projectId: number): Promise<void> {
  const requestId = ++latestProjectRequestId
  isLoadingProjectKeys.value = true

  try {
    const page = await apiKeysApi.listProjectApiKeys(projectId, { limit: 100 })
    if (requestId === latestProjectRequestId && activeProjectId.value === projectId) {
      projectKeys.value = page.items
    }
  } catch (error) {
    if (requestId === latestProjectRequestId) {
      toast.error(getApiErrorMessage(error, 'Não foi possível carregar as chaves do projeto.'))
    }
  } finally {
    if (requestId === latestProjectRequestId) {
      isLoadingProjectKeys.value = false
    }
  }
}

async function loadMemberKeys(projectId: number): Promise<void> {
  const requestId = ++latestMemberRequestId
  isLoadingMemberKeys.value = true

  try {
    const page = await apiKeysApi.listMemberApiKeys(projectId, { limit: 100 })
    if (requestId === latestMemberRequestId && activeProjectId.value === projectId) {
      memberKeys.value = page.items
    }
  } catch (error) {
    if (requestId === latestMemberRequestId) {
      toast.error(getApiErrorMessage(error, 'Não foi possível carregar as chaves pessoais.'))
    }
  } finally {
    if (requestId === latestMemberRequestId) {
      isLoadingMemberKeys.value = false
    }
  }
}

watch(
  activeProjectId,
  (projectId) => {
    selectedProjectKeys.value = []
    selectedMemberKeys.value = []
    projectPage.value = 1
    memberPage.value = 1

    if (projectId === null) {
      latestProjectRequestId += 1
      latestMemberRequestId += 1
      projectKeys.value = []
      memberKeys.value = []
      isLoadingProjectKeys.value = false
      isLoadingMemberKeys.value = false
      return
    }

    void Promise.all([loadProjectKeys(projectId), loadMemberKeys(projectId)])
  },
  { immediate: true },
)

function toggleSelect(type: ApiKeyType, rowKey: string | number) {
  const key = Number(rowKey)
  if (!Number.isFinite(key)) {
    return
  }

  const targetSelection = type === 'projeto' ? selectedProjectKeys : selectedMemberKeys

  if (targetSelection.value.includes(key)) {
    targetSelection.value = targetSelection.value.filter((item) => item !== key)
    return
  }

  targetSelection.value = [...targetSelection.value, key]
}

function handleBatchAction(type: ApiKeyType, actionId: string) {
  const selectedIds = type === 'projeto' ? selectedProjectKeys.value : selectedMemberKeys.value
  if (actionId !== 'revoke' || selectedIds.length === 0) {
    return
  }

  pendingRevokeTarget.value = {
    type,
    ids: [...selectedIds],
  }
  isRevokeDialogOpen.value = true
}

async function confirmRevokeKeys() {
  const projectId = activeProjectId.value
  const target = pendingRevokeTarget.value
  if (projectId === null || !target || target.ids.length === 0) {
    isRevokeDialogOpen.value = false
    pendingRevokeTarget.value = null
    return
  }

  if (isSubmittingRevoke.value) {
    return
  }

  isSubmittingRevoke.value = true
  try {
    await Promise.all(
      target.ids.map((apiKeyId) => apiKeysApi.deleteProjectApiKey(projectId, apiKeyId)),
    )

    if (target.type === 'projeto') {
      await loadProjectKeys(projectId)
      selectedProjectKeys.value = []
    } else {
      await loadMemberKeys(projectId)
      selectedMemberKeys.value = []
    }

    toast.success(`${target.ids.length} chave(s) revogada(s) com sucesso.`)
    pendingRevokeTarget.value = null
    isRevokeDialogOpen.value = false
  } catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível revogar as chaves selecionadas.'))
  } finally {
    isSubmittingRevoke.value = false
  }
}

function openCreateModal(type: ApiKeyType) {
  if (activeProjectId.value === null) {
    toast.error('Selecione um projeto ativo antes de cadastrar uma chave.')
    return
  }

  newKeyType.value = type
  newKeyProvider.value = 'openrouter'
  newKeySecret.value = ''
  newKeyError.value = ''
  isCreateModalOpen.value = true
}

function resetCreateForm() {
  newKeyType.value = 'projeto'
  newKeyProvider.value = 'openrouter'
  newKeySecret.value = ''
  newKeyError.value = ''
}

function closeCreateModal() {
  isCreateModalOpen.value = false
  resetCreateForm()
}

function handleProviderChange(value: string) {
  if (value === 'openrouter') {
    newKeyProvider.value = value
  }
}

async function handleCreateKey() {
  const projectId = activeProjectId.value
  if (projectId === null) {
    toast.error('Selecione um projeto ativo antes de cadastrar uma chave.')
    return
  }

  const secret = newKeySecret.value.trim()
  if (!secret) {
    newKeyError.value = 'Informe a chave de API.'
    toast.error('Informe a chave de API antes de salvar.')
    return
  }

  if (isSubmittingCreate.value) {
    return
  }

  const targetType = newKeyType.value
  const payload = {
    provider: newKeyProvider.value,
    apiKey: secret,
  }

  isSubmittingCreate.value = true
  try {
    if (targetType === 'projeto') {
      await apiKeysApi.createProjectApiKey(projectId, payload)
      await loadProjectKeys(projectId)
      projectPage.value = 1
      toast.success('Chave do projeto cadastrada com sucesso.')
    } else {
      await apiKeysApi.createMemberApiKey(projectId, payload)
      await loadMemberKeys(projectId)
      memberPage.value = 1
      toast.success('Chave pessoal cadastrada com sucesso.')
    }

    closeCreateModal()
  } catch (error) {
    const message = getApiErrorMessage(error, 'Não foi possível cadastrar a chave de API.')
    newKeyError.value = message
    toast.error(message)
  } finally {
    isSubmittingCreate.value = false
  }
}
</script>

<template>
  <AppShell title="chaves de api" active-nav="api-keys">
    <div class="api-keys-view">
      <div class="api-keys-view__sections">
        <section class="api-keys-view__section" aria-label="APIs do Projeto">
          <DataTable
            title="apis do projeto"
            description="chaves vinculadas ao projeto ativo para integrações e workflows"
            :columns="columns"
            :rows="projectTableRows"
            :selectable="true"
            :selected-row-keys="selectedProjectKeys"
            :show-pagination="true"
            :can-previous="canProjectPrevious"
            :can-next="canProjectNext"
            action-label="nova chave do projeto"
            action-icon="api-keys"
            :batch-actions="batchActions"
            @toggle-select="(key) => toggleSelect('projeto', key)"
            @previous-page="projectPage--"
            @next-page="projectPage++"
            @primary-action="openCreateModal('projeto')"
            @batch-action="(actionId) => handleBatchAction('projeto', actionId)"
            @clear-selection="selectedProjectKeys = []"
          >
            <template #cell-id="{ row }">
              <code class="api-keys-view__id">{{ row.id }}</code>
            </template>

            <template #cell-hint="{ row }">
              <code class="api-keys-view__hint">{{ row.hint }}</code>
            </template>
          </DataTable>

          <p v-if="isLoadingProjectKeys" class="api-keys-view__empty" role="status">
            Carregando chaves do projeto...
          </p>

          <p v-else-if="activeProjectId === null" class="api-keys-view__empty" role="status">
            Selecione um projeto para visualizar as chaves de API.
          </p>

          <p v-else-if="projectKeys.length === 0" class="api-keys-view__empty" role="status">
            Nenhuma chave de projeto cadastrada.
          </p>
        </section>

        <section class="api-keys-view__section" aria-label="Minhas APIs (Membro Logado)">
          <DataTable
            title="minhas apis (membro logado)"
            description="chaves pessoais vinculadas à sua conta de usuário"
            :columns="columns"
            :rows="memberTableRows"
            :selectable="true"
            :selected-row-keys="selectedMemberKeys"
            :show-pagination="true"
            :can-previous="canMemberPrevious"
            :can-next="canMemberNext"
            action-label="nova chave pessoal"
            action-icon="api-keys"
            :batch-actions="batchActions"
            @toggle-select="(key) => toggleSelect('membro', key)"
            @previous-page="memberPage--"
            @next-page="memberPage++"
            @primary-action="openCreateModal('membro')"
            @batch-action="(actionId) => handleBatchAction('membro', actionId)"
            @clear-selection="selectedMemberKeys = []"
          >
            <template #cell-id="{ row }">
              <code class="api-keys-view__id">{{ row.id }}</code>
            </template>

            <template #cell-hint="{ row }">
              <code class="api-keys-view__hint">{{ row.hint }}</code>
            </template>
          </DataTable>

          <p v-if="isLoadingMemberKeys" class="api-keys-view__empty" role="status">
            Carregando chaves pessoais...
          </p>

          <p v-else-if="activeProjectId === null" class="api-keys-view__empty" role="status">
            Selecione um projeto para visualizar as chaves pessoais.
          </p>

          <p v-else-if="memberKeys.length === 0" class="api-keys-view__empty" role="status">
            Nenhuma chave pessoal cadastrada.
          </p>
        </section>
      </div>
    </div>

    <Modal
      v-model:open="isCreateModalOpen"
      size="md"
      title="nova chave de api"
      subtitle="Cadastre uma chave de provedor vinculada ao projeto ou à sua conta."
      @close="resetCreateForm"
    >
      <div class="api-keys-view__modal-fields">
        <Select
          v-model="newKeyType"
          label="tipo de chave"
          name="api-key-type"
          :options="keyTypeOptions"
        />
        <Select
          :model-value="newKeyProvider"
          label="provedor"
          name="api-key-provider"
          :options="providerOptions"
          @update:model-value="handleProviderChange"
        />
        <TextInput
          v-model="newKeySecret"
          type="password"
          label="chave de api"
          name="api-key-secret"
          placeholder="sk-or-v1-..."
          :error="newKeyError"
          @update:model-value="newKeyError = ''"
        />
      </div>

      <template #footer>
        <Button variant="tertiary" :disabled="isSubmittingCreate" @click="closeCreateModal">
          Cancelar
        </Button>
        <Button variant="primary" :disabled="isSubmittingCreate" @click="handleCreateKey">
          Salvar chave
        </Button>
      </template>
    </Modal>

    <ConfirmDialog
      v-model:open="isRevokeDialogOpen"
      title="revogar chaves selecionadas"
      :description="`Confirmar revogação de ${pendingRevokeTarget?.ids.length ?? 0} chave(s)? Esta ação não pode ser desfeita.`"
      confirm-label="Revogar"
      confirm-variant="danger"
      @confirm="confirmRevokeKeys"
      @cancel="pendingRevokeTarget = null"
    />
  </AppShell>
</template>

<style scoped>
.api-keys-view {
  --api-keys-view-max-width: 1100px;
  --api-keys-view-padding: var(--spacing-6);
  --api-keys-view-mobile-padding: var(--spacing-4);
  --api-keys-view-gap: var(--spacing-6);
  --api-keys-view-sections-gap: var(--spacing-7);
  --api-keys-view-section-gap: var(--spacing-4);
  --api-keys-view-modal-gap: var(--spacing-4);
  --api-keys-view-code-bg: var(--surface-subtle);
  --api-keys-view-code-border-color: var(--border-subtle-1);
  --api-keys-view-code-border-width: var(--border-width-thin);
  --api-keys-view-code-color: var(--text-primary);
  --api-keys-view-code-padding-y: var(--spacing-1);
  --api-keys-view-code-padding-x: var(--spacing-3);
  --api-keys-view-code-font-size: var(--type-body-compact-01-font-size);
  --api-keys-view-code-line-height: var(--type-body-compact-01-line-height);
  --api-keys-view-empty-padding: var(--spacing-5);
  --api-keys-view-empty-bg: var(--surface-elevated);
  --api-keys-view-empty-border-color: var(--border-subtle-1);
  --api-keys-view-empty-border-width: var(--border-width-thin);
  --api-keys-view-empty-color: var(--text-secondary);
  --api-keys-view-empty-font-family: var(--type-body-01-font-family);
  --api-keys-view-empty-font-size: var(--type-body-01-font-size);
  --api-keys-view-empty-line-height: var(--type-body-01-line-height);
  --api-keys-view-empty-font-weight: var(--type-body-01-font-weight);
  --api-keys-view-helper-color: var(--text-helper);
  --api-keys-view-helper-font-family: var(--type-body-compact-01-font-family);
  --api-keys-view-helper-font-size: var(--type-body-compact-01-font-size);
  --api-keys-view-helper-line-height: var(--type-body-compact-01-line-height);
  --api-keys-view-helper-font-weight: var(--type-body-compact-01-font-weight);

  display: flex;
  flex-direction: column;
  gap: var(--api-keys-view-gap);
  width: 100%;
  max-width: var(--api-keys-view-max-width);
  margin: var(--spacing-0) auto;
  padding: var(--api-keys-view-padding);
  box-sizing: border-box;
}

.api-keys-view__sections {
  display: flex;
  flex-direction: column;
  gap: var(--api-keys-view-sections-gap);
}

.api-keys-view__section {
  display: flex;
  flex-direction: column;
  gap: var(--api-keys-view-section-gap);
}

.api-keys-view__id,
.api-keys-view__hint {
  display: inline-block;
  padding: var(--api-keys-view-code-padding-y) var(--api-keys-view-code-padding-x);
  background-color: var(--api-keys-view-code-bg);
  border: var(--api-keys-view-code-border-width) solid var(--api-keys-view-code-border-color);
  color: var(--api-keys-view-code-color);
  font-family: monospace;
  font-size: var(--api-keys-view-code-font-size);
  line-height: var(--api-keys-view-code-line-height);
  white-space: nowrap;
}

.api-keys-view__modal-fields {
  display: flex;
  flex-direction: column;
  gap: var(--api-keys-view-modal-gap);
}

.api-keys-view__empty {
  margin: var(--spacing-0);
  padding: var(--api-keys-view-empty-padding);
  background-color: var(--api-keys-view-empty-bg);
  border: var(--api-keys-view-empty-border-width) solid var(--api-keys-view-empty-border-color);
  color: var(--api-keys-view-empty-color);
  font-family: var(--api-keys-view-empty-font-family);
  font-size: var(--api-keys-view-empty-font-size);
  line-height: var(--api-keys-view-empty-line-height);
  font-weight: var(--api-keys-view-empty-font-weight);
  text-align: center;
}

@media (max-width: 767px) {
  .api-keys-view {
    padding: var(--api-keys-view-mobile-padding);
  }
}

@media (prefers-reduced-motion: reduce) {
  .api-keys-view {
    scroll-behavior: auto;
  }
}
</style>
