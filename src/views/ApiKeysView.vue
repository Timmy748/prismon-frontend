<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AppShell } from '@/components/shell'
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  IconButton,
  Modal,
  Notification,
  SearchInput,
  Select,
  TextInput,
  toast,
  type BatchAction,
  type DataTableColumn,
  type SelectOption,
} from '@/components/ui'

type ApiKeyScope = 'Leitura' | 'Leitura e escrita' | 'Administração'

type ApiKeyRow = {
  id: string
  name: string
  prefix: string
  scope: ApiKeyScope
  createdAt: string
  lastUsedAt: string
}

const PAGE_SIZE = 10

const INITIAL_KEYS: ApiKeyRow[] = [
  {
    id: 'key-1',
    name: 'Integração Repertório CI',
    prefix: 'pk_live_84f1••••',
    scope: 'Leitura',
    createdAt: '10/01/2026',
    lastUsedAt: 'há 2 horas',
  },
  {
    id: 'key-2',
    name: 'Automação Workflows Jurídicos',
    prefix: 'pk_live_3c9a••••',
    scope: 'Leitura e escrita',
    createdAt: '28/01/2026',
    lastUsedAt: 'ontem',
  },
  {
    id: 'key-3',
    name: 'Sincronização Workspace',
    prefix: 'pk_live_7b20••••',
    scope: 'Administração',
    createdAt: '14/02/2026',
    lastUsedAt: 'há 5 dias',
  },
  {
    id: 'key-4',
    name: 'Conector Busca Semântica',
    prefix: 'pk_live_19de••••',
    scope: 'Leitura',
    createdAt: '02/03/2026',
    lastUsedAt: 'nunca usada',
  },
]

const columns: DataTableColumn[] = [
  { key: 'name', label: 'nome' },
  { key: 'prefix', label: 'prefixo' },
  { key: 'scope', label: 'escopo' },
  { key: 'createdAt', label: 'criada em' },
  { key: 'lastUsedAt', label: 'último uso' },
  { key: 'actions', label: 'ações', align: 'right' },
]

const scopeOptions: SelectOption[] = [
  { label: 'Leitura', value: 'Leitura' },
  { label: 'Leitura e escrita', value: 'Leitura e escrita' },
  { label: 'Administração', value: 'Administração' },
]

const scopeFilterOptions: SelectOption[] = [
  { label: 'todos os escopos', value: 'all' },
  ...scopeOptions,
]

const batchActions: BatchAction[] = [{ id: 'revoke', label: 'revogar', icon: 'delete' }]

const apiKeys = ref<ApiKeyRow[]>(INITIAL_KEYS.map((item) => ({ ...item })))
const searchQuery = ref('')
const scopeFilter = ref('')
const selectedKeys = ref<string[]>([])
const currentPage = ref(1)

const newlyCreatedKey = ref<string | null>(null)

const isCreateModalOpen = ref(false)
const newKeyName = ref('')
const newKeyScope = ref<ApiKeyScope>('Leitura')
const newKeyError = ref('')

const isRevokeDialogOpen = ref(false)
const pendingRevokeIds = ref<string[]>([])

const filteredKeys = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const activeScope = scopeFilter.value

  return apiKeys.value.filter((item) => {
    const matchesQuery =
      query.length === 0 ||
      item.name.toLowerCase().includes(query) ||
      item.prefix.toLowerCase().includes(query)

    const matchesScope = !activeScope || activeScope === 'all' || item.scope === activeScope

    return matchesQuery && matchesScope
  })
})

const paginatedKeys = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredKeys.value.slice(start, start + PAGE_SIZE)
})

const canPrevious = computed(() => currentPage.value > 1)
const canNext = computed(() => currentPage.value * PAGE_SIZE < filteredKeys.value.length)

watch([searchQuery, scopeFilter], () => {
  currentPage.value = 1
})

function toggleSelect(rowKey: string | number) {
  const key = String(rowKey)
  if (selectedKeys.value.includes(key)) {
    selectedKeys.value = selectedKeys.value.filter((item) => item !== key)
    return
  }
  selectedKeys.value = [...selectedKeys.value, key]
}

function handleBatchAction(actionId: string) {
  if (actionId !== 'revoke' || selectedKeys.value.length === 0) {
    return
  }
  pendingRevokeIds.value = [...selectedKeys.value]
  isRevokeDialogOpen.value = true
}

function askRevokeSingle(id: string) {
  pendingRevokeIds.value = [id]
  isRevokeDialogOpen.value = true
}

function confirmRevokeKeys() {
  const targetIds = new Set(pendingRevokeIds.value)
  const count = targetIds.size
  if (count === 0) {
    isRevokeDialogOpen.value = false
    return
  }

  apiKeys.value = apiKeys.value.filter((item) => !targetIds.has(item.id))
  selectedKeys.value = selectedKeys.value.filter((id) => !targetIds.has(id))
  pendingRevokeIds.value = []
  isRevokeDialogOpen.value = false
  toast.success(`${count} chave(s) revogada(s) localmente.`)
}

function resetCreateForm() {
  newKeyName.value = ''
  newKeyScope.value = 'Leitura'
  newKeyError.value = ''
}

function closeCreateModal() {
  isCreateModalOpen.value = false
  resetCreateForm()
}

function generateSimulatedToken(): { fullKey: string; prefix: string } {
  const randomCode = Math.random().toString(36).slice(2, 10).padEnd(8, '0')
  const shortPrefix = randomCode.slice(0, 4)
  return {
    fullKey: `pk_live_sim_${randomCode}`,
    prefix: `pk_live_${shortPrefix}••••`,
  }
}

function handleCreateKey() {
  const name = newKeyName.value.trim()
  if (!name) {
    newKeyError.value = 'Informe um nome para a chave.'
    toast.error('Informe o nome da nova chave antes de gerar.')
    return
  }

  const { fullKey, prefix } = generateSimulatedToken()
  const createdEntry: ApiKeyRow = {
    id: `key-${Date.now()}`,
    name,
    prefix,
    scope: newKeyScope.value,
    createdAt: 'agora',
    lastUsedAt: 'nunca usada',
  }

  apiKeys.value = [createdEntry, ...apiKeys.value]
  newlyCreatedKey.value = fullKey
  currentPage.value = 1
  closeCreateModal()
  toast.success(`Chave simulada "${name}" gerada localmente.`)
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
          :message="`Copie agora: ${newlyCreatedKey} (exibição única simulada).`"
        />
        <div class="api-keys-view__created-actions">
          <Button variant="secondary" size="sm" icon="repeat" @click="copyKey(newlyCreatedKey)">
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

      <div class="api-keys-view__filters">
        <div class="api-keys-view__search">
          <SearchInput
            v-model="searchQuery"
            placeholder="Filtrar chave por nome ou prefixo"
            aria-label="Filtrar chave por nome ou prefixo"
          />
        </div>
        <div class="api-keys-view__scope-select">
          <Select
            v-model="scopeFilter"
            :options="scopeFilterOptions"
            placeholder="todos os escopos"
            aria-label="Filtrar por escopo"
          />
        </div>
      </div>

      <DataTable
        title="chaves cadastradas"
        description="controle tokens de acesso para integrações e workflows externos"
        :columns="columns"
        :rows="paginatedKeys"
        :selectable="true"
        :selected-row-keys="selectedKeys"
        :show-pagination="true"
        :can-previous="canPrevious"
        :can-next="canNext"
        action-label="nova chave"
        action-icon="api-keys"
        :batch-actions="batchActions"
        @toggle-select="toggleSelect"
        @previous-page="currentPage--"
        @next-page="currentPage++"
        @primary-action="isCreateModalOpen = true"
        @batch-action="handleBatchAction"
        @clear-selection="selectedKeys = []"
      >
        <template #cell-prefix="{ row }">
          <code class="api-keys-view__prefix">{{ row.prefix }}</code>
        </template>

        <template #cell-scope="{ row }">
          <Badge :label="String(row.scope)" />
        </template>

        <template #cell-actions="{ row }">
          <div class="api-keys-view__row-actions">
            <IconButton
              variant="ghost"
              size="sm"
              icon="repeat"
              :ariaLabel="`Copiar prefixo de ${row.name}`"
              @click.stop="copyKey(String(row.prefix))"
            />
            <IconButton
              variant="ghost"
              size="sm"
              icon="delete"
              :ariaLabel="`Revogar ${row.name}`"
              @click.stop="askRevokeSingle(String(row.id))"
            />
          </div>
        </template>
      </DataTable>

      <p v-if="filteredKeys.length === 0" class="api-keys-view__empty" role="status">
        Nenhuma chave encontrada para os filtros aplicados.
      </p>
    </div>

    <Modal
      v-model:open="isCreateModalOpen"
      size="sm"
      title="nova chave de api"
      subtitle="Gere um token simulado com escopo limitado."
      @close="resetCreateForm"
    >
      <div class="api-keys-view__modal-fields">
        <TextInput
          v-model="newKeyName"
          label="nome da chave"
          name="api-key-name"
          placeholder="Ex.: Pipeline Produção"
          :error="newKeyError"
          @update:model-value="newKeyError = ''"
        />
        <Select v-model="newKeyScope" label="escopo" name="api-key-scope" :options="scopeOptions" />
      </div>

      <template #footer>
        <Button variant="tertiary" @click="closeCreateModal">Cancelar</Button>
        <Button variant="primary" @click="handleCreateKey">Gerar chave</Button>
      </template>
    </Modal>

    <ConfirmDialog
      v-model:open="isRevokeDialogOpen"
      title="revogar chaves selecionadas"
      :description="`Confirmar revogação local de ${pendingRevokeIds.length} chave(s)?`"
      confirm-label="Revogar"
      confirm-variant="danger"
      @confirm="confirmRevokeKeys"
      @cancel="pendingRevokeIds = []"
    />
  </AppShell>
</template>

<style scoped>
.api-keys-view {
  --api-keys-view-max-width: 1100px;
  --api-keys-view-padding: var(--spacing-6);
  --api-keys-view-mobile-padding: var(--spacing-4);
  --api-keys-view-gap: var(--spacing-6);
  --api-keys-view-filters-gap: var(--spacing-4);
  --api-keys-view-scope-select-width: 220px;
  --api-keys-view-modal-gap: var(--spacing-4);
  --api-keys-view-actions-gap: var(--spacing-2);
  --api-keys-view-banner-gap: var(--spacing-3);
  --api-keys-view-banner-bg: var(--surface-brand-subtle);
  --api-keys-view-banner-border-color: var(--border-brand-subtle);
  --api-keys-view-banner-border-width: var(--border-width-thin);
  --api-keys-view-banner-padding: var(--spacing-3);
  --api-keys-view-prefix-bg: var(--surface-subtle);
  --api-keys-view-prefix-border-color: var(--border-subtle-1);
  --api-keys-view-prefix-border-width: var(--border-width-thin);
  --api-keys-view-prefix-color: var(--text-primary);
  --api-keys-view-prefix-padding-y: var(--spacing-1);
  --api-keys-view-prefix-padding-x: var(--spacing-3);
  --api-keys-view-prefix-font-size: var(--type-body-compact-01-font-size);
  --api-keys-view-prefix-line-height: var(--type-body-compact-01-line-height);
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

.api-keys-view__filters {
  display: flex;
  align-items: center;
  gap: var(--api-keys-view-filters-gap);
}

.api-keys-view__search {
  flex: 1;
  min-width: var(--spacing-0);
}

.api-keys-view__scope-select {
  width: var(--api-keys-view-scope-select-width);
  flex-shrink: 0;
}

.api-keys-view__prefix {
  display: inline-block;
  padding: var(--api-keys-view-prefix-padding-y) var(--api-keys-view-prefix-padding-x);
  background-color: var(--api-keys-view-prefix-bg);
  border: var(--api-keys-view-prefix-border-width) solid var(--api-keys-view-prefix-border-color);
  color: var(--api-keys-view-prefix-color);
  font-family: monospace;
  font-size: var(--api-keys-view-prefix-font-size);
  line-height: var(--api-keys-view-prefix-line-height);
  white-space: nowrap;
}

.api-keys-view__row-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--api-keys-view-actions-gap);
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

  .api-keys-view__filters {
    flex-direction: column;
    align-items: stretch;
  }

  .api-keys-view__scope-select {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .api-keys-view {
    scroll-behavior: auto;
  }
}
</style>
