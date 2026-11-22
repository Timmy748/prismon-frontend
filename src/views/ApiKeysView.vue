<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppShell } from '@/components/shell'
import {
  Button,
  ConfirmDialog,
  DataTable,
  IconButton,
  Modal,
  Notification,
  Select,
  TextInput,
  toast,
  type BatchAction,
  type DataTableColumn,
  type SelectOption,
} from '@/components/ui'

type ApiKeyType = 'projeto' | 'membro'

type ApiKeyRow = {
  id: string
  hint: string
  createdAt: string
}

type CreatedKeyBanner = {
  fullKey: string
  alias: string
  typeLabel: string
}

type PendingRevokeTarget = {
  type: ApiKeyType
  ids: string[]
}

const PAGE_SIZE = 10

const INITIAL_PROJECT_KEYS: ApiKeyRow[] = [
  {
    id: 'key_proj_ci_4a9f',
    hint: 'pk_proj_••••4a9f',
    createdAt: '10/01/2026',
  },
  {
    id: 'key_proj_wf_3c9a',
    hint: 'pk_proj_••••3c9a',
    createdAt: '28/01/2026',
  },
  {
    id: 'key_proj_sync_7b20',
    hint: 'pk_proj_••••7b20',
    createdAt: '14/02/2026',
  },
]

const INITIAL_MEMBER_KEYS: ApiKeyRow[] = [
  {
    id: 'key_user_cli_8c21',
    hint: 'pk_user_••••8c21',
    createdAt: '02/03/2026',
  },
  {
    id: 'key_user_dev_19de',
    hint: 'pk_user_••••19de',
    createdAt: '15/03/2026',
  },
]

const columns: DataTableColumn[] = [
  { key: 'id', label: 'id' },
  { key: 'hint', label: 'hint' },
  { key: 'createdAt', label: 'criada em' },
]

const keyTypeOptions: SelectOption[] = [
  { label: 'Projeto', value: 'projeto' },
  { label: 'Membro logado', value: 'membro' },
]

const batchActions: BatchAction[] = [{ id: 'revoke', label: 'revogar', icon: 'delete' }]

const projectKeys = ref<ApiKeyRow[]>(INITIAL_PROJECT_KEYS.map((item) => ({ ...item })))
const memberKeys = ref<ApiKeyRow[]>(INITIAL_MEMBER_KEYS.map((item) => ({ ...item })))

const selectedProjectKeys = ref<string[]>([])
const selectedMemberKeys = ref<string[]>([])

const projectPage = ref(1)
const memberPage = ref(1)

const newlyCreatedKey = ref<CreatedKeyBanner | null>(null)

const isCreateModalOpen = ref(false)
const newKeyType = ref<ApiKeyType>('projeto')
const newKeyAlias = ref('')
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

const canProjectPrevious = computed(() => projectPage.value > 1)
const canProjectNext = computed(() => projectPage.value * PAGE_SIZE < projectKeys.value.length)

const canMemberPrevious = computed(() => memberPage.value > 1)
const canMemberNext = computed(() => memberPage.value * PAGE_SIZE < memberKeys.value.length)

function toggleSelect(type: ApiKeyType, rowKey: string | number) {
  const key = String(rowKey)
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

function confirmRevokeKeys() {
  const target = pendingRevokeTarget.value
  if (!target || target.ids.length === 0) {
    isRevokeDialogOpen.value = false
    pendingRevokeTarget.value = null
    return
  }

  const targetIds = new Set(target.ids)
  const count = targetIds.size

  if (target.type === 'projeto') {
    projectKeys.value = projectKeys.value.filter((item) => !targetIds.has(item.id))
    selectedProjectKeys.value = selectedProjectKeys.value.filter((id) => !targetIds.has(id))
  } else {
    memberKeys.value = memberKeys.value.filter((item) => !targetIds.has(item.id))
    selectedMemberKeys.value = selectedMemberKeys.value.filter((id) => !targetIds.has(id))
  }

  pendingRevokeTarget.value = null
  isRevokeDialogOpen.value = false
  toast.success(`${count} chave(s) revogada(s) localmente.`)
}

function openCreateModal(type: ApiKeyType) {
  newKeyType.value = type
  newKeyAlias.value = ''
  newKeyError.value = ''
  isCreateModalOpen.value = true
}

function resetCreateForm() {
  newKeyType.value = 'projeto'
  newKeyAlias.value = ''
  newKeyError.value = ''
}

function closeCreateModal() {
  isCreateModalOpen.value = false
  resetCreateForm()
}

function buildKeySlug(alias: string): string {
  return alias
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 12)
}

function generateSimulatedToken(
  type: ApiKeyType,
  alias: string,
): { id: string; hint: string; fullKey: string } {
  const randomCode = Math.random().toString(36).slice(2, 10).padEnd(8, '0')
  const tail = randomCode.slice(-4)
  const prefix = type === 'projeto' ? 'pk_proj' : 'pk_user'
  const idPrefix = type === 'projeto' ? 'key_proj' : 'key_user'
  const slug = buildKeySlug(alias)

  return {
    id: slug ? `${idPrefix}_${slug}_${tail}` : `${idPrefix}_${randomCode.slice(0, 6)}`,
    hint: `${prefix}_••••${tail}`,
    fullKey: `${prefix}_sim_${randomCode}`,
  }
}

function handleCreateKey() {
  const alias = newKeyAlias.value.trim()
  if (!alias) {
    newKeyError.value = 'Informe uma identificação para a chave.'
    toast.error('Informe a identificação da nova chave antes de gerar.')
    return
  }

  const targetType = newKeyType.value
  const { id, hint, fullKey } = generateSimulatedToken(targetType, alias)
  const createdEntry: ApiKeyRow = {
    id,
    hint,
    createdAt: 'agora',
  }

  if (targetType === 'projeto') {
    projectKeys.value = [createdEntry, ...projectKeys.value]
    projectPage.value = 1
  } else {
    memberKeys.value = [createdEntry, ...memberKeys.value]
    memberPage.value = 1
  }

  newlyCreatedKey.value = {
    fullKey,
    alias,
    typeLabel: targetType === 'projeto' ? 'Projeto' : 'Membro logado',
  }
  closeCreateModal()
  toast.success(`Chave simulada "${alias}" gerada localmente.`)
}

async function copyKey(value: string) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
    }
    toast.success('Valor copiado para a área de transferência (simulado).')
  } catch {
    toast.info(`Copie manualmente: ${value}`)
  }
}
</script>

<template>
  <AppShell title="chaves de api" active-nav="api-keys">
    <div class="api-keys-view">
      <Notification
        variant="default"
        icon="api-keys"
        title="Ambiente de demonstração local"
        message="As chaves abaixo são simuladas localmente no navegador e não executam chamadas de API."
      />

      <div
        v-if="newlyCreatedKey"
        class="api-keys-view__created-banner"
        role="region"
        aria-label="Nova chave gerada"
      >
        <Notification
          variant="default"
          icon="api-keys"
          title="Nova chave gerada"
          :message="`Chave &quot;${newlyCreatedKey.alias}&quot; (${newlyCreatedKey.typeLabel}) — copie agora: ${newlyCreatedKey.fullKey} (exibição única simulada).`"
        />
        <div class="api-keys-view__created-actions">
          <Button
            variant="secondary"
            size="sm"
            icon="repeat"
            @click="copyKey(newlyCreatedKey.fullKey)"
          >
            Copiar chave
          </Button>
          <IconButton
            variant="ghost"
            size="sm"
            icon="close"
            ariaLabel="Fechar aviso de nova chave"
            @click="newlyCreatedKey = null"
          />
        </div>
      </div>

      <div class="api-keys-view__sections">
        <section class="api-keys-view__section" aria-label="APIs do Projeto">
          <DataTable
            title="apis do projeto"
            description="chaves vinculadas ao projeto ativo para integrações e workflows"
            :columns="columns"
            :rows="paginatedProjectKeys"
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

          <p v-if="projectKeys.length === 0" class="api-keys-view__empty" role="status">
            Nenhuma chave de projeto cadastrada.
          </p>
        </section>

        <section class="api-keys-view__section" aria-label="Minhas APIs (Membro Logado)">
          <DataTable
            title="minhas apis (membro logado)"
            description="chaves pessoais vinculadas à sua conta de usuário"
            :columns="columns"
            :rows="paginatedMemberKeys"
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

          <p v-if="memberKeys.length === 0" class="api-keys-view__empty" role="status">
            Nenhuma chave pessoal cadastrada.
          </p>
        </section>
      </div>
    </div>

    <Modal
      v-model:open="isCreateModalOpen"
      size="lg"
      title="nova chave de api"
      subtitle="Gere uma chave simulada vinculada ao projeto ou à sua conta."
      @close="resetCreateForm"
    >
      <div class="api-keys-view__modal-fields">
        <Select
          v-model="newKeyType"
          label="tipo de chave"
          name="api-key-type"
          :options="keyTypeOptions"
        />
        <TextInput
          v-model="newKeyAlias"
          label="identificação / apelido"
          name="api-key-alias"
          placeholder="Ex.: Pipeline Produção"
          :error="newKeyError"
          @update:model-value="newKeyError = ''"
        />
      </div>

      <template #footer>
        <Button variant="tertiary" @click="closeCreateModal">Cancelar</Button>
        <Button variant="primary" @click="handleCreateKey">Gerar chave</Button>
      </template>
    </Modal>

    <ConfirmDialog
      v-model:open="isRevokeDialogOpen"
      title="revogar chaves selecionadas"
      :description="`Confirmar revogação local de ${pendingRevokeTarget?.ids.length ?? 0} chave(s)?`"
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
  --api-keys-view-actions-gap: var(--spacing-2);
  --api-keys-view-banner-gap: var(--spacing-3);
  --api-keys-view-banner-bg: var(--surface-brand-subtle);
  --api-keys-view-banner-border-color: var(--border-brand-subtle);
  --api-keys-view-banner-border-width: var(--border-width-thin);
  --api-keys-view-banner-padding: var(--spacing-3);
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

  display: flex;
  flex-direction: column;
  gap: var(--api-keys-view-gap);
  width: 100%;
  max-width: var(--api-keys-view-max-width);
  margin: var(--spacing-0) auto;
  padding: var(--api-keys-view-padding);
  box-sizing: border-box;
}

.api-keys-view__created-banner {
  display: flex;
  flex-direction: column;
  gap: var(--api-keys-view-banner-gap);
  padding: var(--api-keys-view-banner-padding);
  background-color: var(--api-keys-view-banner-bg);
  border: var(--api-keys-view-banner-border-width) solid var(--api-keys-view-banner-border-color);
}

.api-keys-view__created-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--api-keys-view-actions-gap);
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
