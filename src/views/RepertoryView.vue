<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AppShell } from '@/components/shell'
import DocumentCard from '@/components/repertory/DocumentCard.vue'
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DocumentDetails,
  DocumentForm,
  FileUpload,
  Icon,
  IconButton,
  Modal,
  SearchInput,
  Select,
  Sheet,
  Tabs,
  Tag,
  TagForm,
  toast,
  type BatchAction,
  type DataTableColumn,
  type DocumentFormPayload,
  type DocumentHistoryEntry,
  type DocumentTagItem,
  type SelectOption,
  type TabOption,
  type TagFormPayload,
} from '@/components/ui'

type RepertoryTab = 'documents' | 'assets' | 'tags'
type ConfirmTarget = 'assets' | 'tags' | null

interface RepertoryDocument {
  id: string
  title: string
  description: string
  status: 'publicado' | 'em revisão' | 'rascunho'
  thumbnailUrl?: string
  tags: DocumentTagItem[]
  history: DocumentHistoryEntry[]
}

interface RepertoryAsset {
  id: string
  name: string
  type: 'PDF' | 'Imagem' | 'Markdown' | 'JSON'
  size: string
  linkedDoc: string
  updatedAt: string
}

interface RepertoryTag {
  id: string
  name: string
  category: string
  description: string
  documentsCount: number
  createdAt: string
}

const PAGE_SIZE = 5

const tabItems: TabOption[] = [
  { id: 'documents', label: 'documents' },
  { id: 'assets', label: 'assets' },
  { id: 'tags', label: 'tags' },
]

const activeTab = ref<RepertoryTab>('documents')

const documents = ref<RepertoryDocument[]>([
  {
    id: 'doc-1',
    title: 'Manual de Identidade Prismon',
    description:
      'Diretrizes visuais, uso de tipografia Funnel Display e Noto Sans, contrastes e regras de composição do ecossistema Prismon.',
    status: 'publicado',
    tags: [
      { id: 't-1', label: 'design system' },
      { id: 't-2', label: 'marca' },
      { id: 't-3', label: 'tokens' },
      { id: 't-4', label: 'tipografia' },
      { id: 't-5', label: 'diretrizes' },
    ],
    history: [
      {
        id: 'h-1',
        title: 'Revisão de tokens semânticos',
        summary: 'Atualização das superfícies neutras e estados de foco.',
        author: 'Ana Paula',
        date: '18 nov 2026',
      },
      {
        id: 'h-2',
        title: 'Publicação inicial do manual',
        summary: 'Estrutura base de identidade e grid editorial.',
        author: 'Lucas Andrade',
        date: '04 nov 2026',
      },
    ],
  },
  {
    id: 'doc-2',
    title: 'Playbook de Workflows IA',
    description:
      'Padrões de orquestração multiagente, gatilhos de revisão humana e boas práticas para fluxos automatizados de análise documental.',
    status: 'publicado',
    tags: [
      { id: 't-6', label: 'workflows' },
      { id: 't-7', label: 'automação' },
      { id: 't-8', label: 'agentes' },
    ],
    history: [
      {
        id: 'h-3',
        title: 'Inclusão de etapa de validação',
        summary: 'Adicionado checklist de aprovação antes do disparo final.',
        author: 'Mariana Costa',
        date: '19 nov 2026',
      },
    ],
  },
  {
    id: 'doc-3',
    title: 'Especificação de Tokens Semânticos',
    description:
      'Mapeamento completo entre tokens primitivos e semânticos para superfícies, bordas, ícones, espaçamentos e animações.',
    status: 'em revisão',
    tags: [
      { id: 't-3', label: 'tokens' },
      { id: 't-1', label: 'design system' },
      { id: 't-9', label: 'arquitetura' },
    ],
    history: [
      {
        id: 'h-4',
        title: 'Padronização de durações',
        summary: 'Definidos tokens de transição para modais, sheets e drawers.',
        author: 'Ana Paula',
        date: '15 nov 2026',
      },
    ],
  },
  {
    id: 'doc-4',
    title: 'Guia de Prompts Corporativos',
    description:
      'Biblioteca de prompts validados para triagem de contratos, síntese executiva e resposta assistida no chatbot Prismon.',
    status: 'publicado',
    tags: [
      { id: 't-10', label: 'prompts' },
      { id: 't-11', label: 'chatbot' },
      { id: 't-12', label: 'governança' },
    ],
    history: [
      {
        id: 'h-5',
        title: 'Novos templates jurídicos',
        summary: 'Adicionados prompts para extração de cláusulas críticas.',
        author: 'Rafael Souza',
        date: '12 nov 2026',
      },
    ],
  },
  {
    id: 'doc-5',
    title: 'Checklist de Acessibilidade UI',
    description:
      'Critérios WCAG AA de navegação por teclado, atributos ARIA, foco visível e suporte a prefers-reduced-motion nos componentes.',
    status: 'em revisão',
    tags: [
      { id: 't-13', label: 'acessibilidade' },
      { id: 't-1', label: 'design system' },
      { id: 't-14', label: 'qualidade' },
    ],
    history: [
      {
        id: 'h-6',
        title: 'Auditoria de DataTable e Sheet',
        summary: 'Validada leitura em leitores de tela e atalho Escape.',
        author: 'Clara Mendes',
        date: '10 nov 2026',
      },
    ],
  },
  {
    id: 'doc-6',
    title: 'Arquitetura de Repertório & Assets',
    description:
      'Definição do ciclo de vida de documentos, versionamento de anexos e taxonomia compartilhada entre repertório e chatbot.',
    status: 'rascunho',
    tags: [
      { id: 't-9', label: 'arquitetura' },
      { id: 't-15', label: 'repertório' },
      { id: 't-12', label: 'governança' },
    ],
    history: [
      {
        id: 'h-7',
        title: 'Rascunho inicial',
        summary: 'Esboço do modelo de vínculo entre documentos e assets.',
        author: 'Lucas Andrade',
        date: '21 nov 2026',
      },
    ],
  },
])

const assets = ref<RepertoryAsset[]>([
  {
    id: 'asset-1',
    name: 'prismon-brand-guidelines.pdf',
    type: 'PDF',
    size: '4,2 MB',
    linkedDoc: 'Manual de Identidade Prismon',
    updatedAt: '18 nov 2026',
  },
  {
    id: 'asset-2',
    name: 'workflow-diagram-v3.png',
    type: 'Imagem',
    size: '1,8 MB',
    linkedDoc: 'Playbook de Workflows IA',
    updatedAt: '19 nov 2026',
  },
  {
    id: 'asset-3',
    name: 'semantic-tokens.json',
    type: 'JSON',
    size: '84 KB',
    linkedDoc: 'Especificação de Tokens Semânticos',
    updatedAt: '15 nov 2026',
  },
  {
    id: 'asset-4',
    name: 'prompt-templates-ptbr.md',
    type: 'Markdown',
    size: '126 KB',
    linkedDoc: 'Guia de Prompts Corporativos',
    updatedAt: '12 nov 2026',
  },
  {
    id: 'asset-5',
    name: 'a11y-audit-matrix.pdf',
    type: 'PDF',
    size: '2,1 MB',
    linkedDoc: 'Checklist de Acessibilidade UI',
    updatedAt: '10 nov 2026',
  },
  {
    id: 'asset-6',
    name: 'repertory-wireframe-hero.png',
    type: 'Imagem',
    size: '960 KB',
    linkedDoc: 'Arquitetura de Repertório & Assets',
    updatedAt: '21 nov 2026',
  },
])

const tagsList = ref<RepertoryTag[]>([
  {
    id: 'tag-1',
    name: 'design system',
    category: 'Design',
    description: 'Componentes, tokens e padrões visuais do Prismon.',
    documentsCount: 3,
    createdAt: '02 nov 2026',
  },
  {
    id: 'tag-2',
    name: 'tokens',
    category: 'Design',
    description: 'Variáveis semânticas de cor, tipografia e movimento.',
    documentsCount: 2,
    createdAt: '04 nov 2026',
  },
  {
    id: 'tag-3',
    name: 'workflows',
    category: 'IA',
    description: 'Fluxos multiagente e rotinas de automação.',
    documentsCount: 1,
    createdAt: '06 nov 2026',
  },
  {
    id: 'tag-4',
    name: 'prompts',
    category: 'IA',
    description: 'Instruções reutilizáveis e guias de contexto.',
    documentsCount: 1,
    createdAt: '08 nov 2026',
  },
  {
    id: 'tag-5',
    name: 'governança',
    category: 'Produto',
    description: 'Políticas de revisão, auditoria e controle de acesso.',
    documentsCount: 2,
    createdAt: '11 nov 2026',
  },
  {
    id: 'tag-6',
    name: 'acessibilidade',
    category: 'Qualidade',
    description: 'Conformidade WCAG e testes de navegação assistiva.',
    documentsCount: 1,
    createdAt: '14 nov 2026',
  },
])

// Documents tab filters & modals
const docSearch = ref('')
const selectedTagFilter = ref('')
const selectedStatusFilter = ref('')
const activeTagFilters = ref<string[]>([])

const isDetailsSheetOpen = ref(false)
const activeDocId = ref<string | null>(null)
const isNewDocModalOpen = ref(false)
const newDocTitleError = ref('')
const isDocTagModalOpen = ref(false)
const docTagNameError = ref('')

// Assets tab state
const assetSearch = ref('')
const assetTypeFilter = ref('')
const assetPage = ref(1)
const selectedAssetKeys = ref<Array<string | number>>([])
const isUploadAssetModalOpen = ref(false)

// Tags tab state
const tagPage = ref(1)
const selectedTagKeys = ref<Array<string | number>>([])
const isNewTagModalOpen = ref(false)
const newTagNameError = ref('')

// Shared confirm dialog state
const confirmState = ref<{
  open: boolean
  target: ConfirmTarget
  title: string
  description: string
  confirmLabel: string
}>({
  open: false,
  target: null,
  title: '',
  description: '',
  confirmLabel: 'Remover',
})

const tagFilterOptions = computed<SelectOption[]>(() => {
  const uniqueLabels = new Set<string>()
  for (const tag of tagsList.value) {
    uniqueLabels.add(tag.name)
  }
  for (const doc of documents.value) {
    for (const tag of doc.tags) {
      uniqueLabels.add(tag.label)
    }
  }
  return Array.from(uniqueLabels)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((label) => ({ label, value: label }))
})

const statusFilterOptions: SelectOption[] = [
  { label: 'todos os status', value: 'todos' },
  { label: 'publicado', value: 'publicado' },
  { label: 'em revisão', value: 'em revisão' },
  { label: 'rascunho', value: 'rascunho' },
]

const assetTypeOptions: SelectOption[] = [
  { label: 'todos os tipos', value: 'todos' },
  { label: 'PDF', value: 'PDF' },
  { label: 'Imagem', value: 'Imagem' },
  { label: 'Markdown', value: 'Markdown' },
  { label: 'JSON', value: 'JSON' },
]

const assetColumns: DataTableColumn[] = [
  { key: 'name', label: 'Arquivo' },
  { key: 'type', label: 'Tipo' },
  { key: 'size', label: 'Tamanho' },
  { key: 'linkedDoc', label: 'Vínculo' },
  { key: 'updatedAt', label: 'Atualizado' },
]

const assetBatchActions: BatchAction[] = [
  { id: 'download', label: 'baixar', icon: 'download' },
  { id: 'delete', label: 'remover', icon: 'delete' },
]

const tagColumns: DataTableColumn[] = [
  { key: 'name', label: 'Nome' },
  { key: 'category', label: 'Categoria' },
  { key: 'description', label: 'Descrição' },
  { key: 'documentsCount', label: 'Documentos', align: 'center' },
  { key: 'createdAt', label: 'Criada em' },
]

const tagBatchActions: BatchAction[] = [{ id: 'delete', label: 'remover', icon: 'delete' }]

const hasActiveDocFilters = computed(
  () =>
    docSearch.value.trim().length > 0 ||
    activeTagFilters.value.length > 0 ||
    (selectedStatusFilter.value !== '' && selectedStatusFilter.value !== 'todos'),
)

const filteredDocuments = computed(() => {
  const query = docSearch.value.trim().toLowerCase()
  const status = selectedStatusFilter.value

  return documents.value.filter((doc) => {
    if (query.length > 0) {
      const matchesTitle = doc.title.toLowerCase().includes(query)
      const matchesDescription = doc.description.toLowerCase().includes(query)
      if (!matchesTitle && !matchesDescription) {
        return false
      }
    }

    if (status && status !== 'todos' && doc.status !== status) {
      return false
    }

    if (activeTagFilters.value.length > 0) {
      const docTagLabels = new Set(doc.tags.map((t) => t.label.toLowerCase()))
      const matchesAllTags = activeTagFilters.value.every((filterTag) =>
        docTagLabels.has(filterTag.toLowerCase()),
      )
      if (!matchesAllTags) {
        return false
      }
    }

    return true
  })
})

const activeDoc = computed(
  () => documents.value.find((doc) => doc.id === activeDocId.value) ?? null,
)

const filteredAssets = computed(() => {
  const query = assetSearch.value.trim().toLowerCase()
  const typeFilter = assetTypeFilter.value

  return assets.value.filter((asset) => {
    if (query.length > 0) {
      const matchesName = asset.name.toLowerCase().includes(query)
      const matchesDoc = asset.linkedDoc.toLowerCase().includes(query)
      if (!matchesName && !matchesDoc) {
        return false
      }
    }

    if (typeFilter && typeFilter !== 'todos' && asset.type !== typeFilter) {
      return false
    }

    return true
  })
})

const totalAssetPages = computed(() =>
  Math.max(1, Math.ceil(filteredAssets.value.length / PAGE_SIZE)),
)

const paginatedAssetRows = computed(() => {
  const start = (assetPage.value - 1) * PAGE_SIZE
  return filteredAssets.value.slice(start, start + PAGE_SIZE) as unknown as Record<
    string,
    unknown
  >[]
})

const totalTagPages = computed(() => Math.max(1, Math.ceil(tagsList.value.length / PAGE_SIZE)))

const paginatedTagRows = computed(() => {
  const start = (tagPage.value - 1) * PAGE_SIZE
  return tagsList.value.slice(start, start + PAGE_SIZE) as unknown as Record<string, unknown>[]
})

watch([assetSearch, assetTypeFilter], () => {
  assetPage.value = 1
})

watch(totalAssetPages, (maxPage) => {
  if (assetPage.value > maxPage) {
    assetPage.value = maxPage
  }
})

watch(totalTagPages, (maxPage) => {
  if (tagPage.value > maxPage) {
    tagPage.value = maxPage
  }
})

function addTagFilter(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return
  }
  if (!activeTagFilters.value.includes(trimmed)) {
    activeTagFilters.value = [...activeTagFilters.value, trimmed]
  }
  selectedTagFilter.value = ''
}

function removeTagFilter(tagLabel: string) {
  activeTagFilters.value = activeTagFilters.value.filter((item) => item !== tagLabel)
}

function clearDocFilters() {
  docSearch.value = ''
  selectedTagFilter.value = ''
  selectedStatusFilter.value = ''
  activeTagFilters.value = []
}

function openDocumentDetails(docId: string) {
  activeDocId.value = docId
  isDetailsSheetOpen.value = true
}

function handleDownloadDocument(docId: string) {
  const target = documents.value.find((doc) => doc.id === docId)
  toast.info(
    target
      ? `Download de "${target.title}" iniciado (demonstração).`
      : 'Download iniciado (demonstração).',
  )
}

function openNewDocModal() {
  newDocTitleError.value = ''
  isNewDocModalOpen.value = true
}

function handleCreateDocument(payload: DocumentFormPayload) {
  const cleanTitle = payload.title.trim()
  if (!cleanTitle) {
    newDocTitleError.value = 'Informe um título para o documento.'
    return
  }

  const newId = `doc-${Date.now()}`
  const description =
    payload.description.trim() || 'Documento adicionado ao repertório local do Prismon.'
  const fileInfo =
    payload.files.length > 0 ? `Arquivo anexado: ${payload.files[0]?.name}` : 'Criado manualmente.'

  const newDoc: RepertoryDocument = {
    id: newId,
    title: cleanTitle,
    description,
    status: 'rascunho',
    tags: [{ id: `tag-${Date.now()}`, label: 'repertório' }],
    history: [
      {
        id: `hist-${Date.now()}`,
        title: 'Documento criado',
        summary: fileInfo,
        author: 'Ana Paula',
        date: 'Agora',
      },
    ],
  }

  documents.value = [newDoc, ...documents.value]
  isNewDocModalOpen.value = false
  newDocTitleError.value = ''
  toast.success(`Documento "${cleanTitle}" adicionado ao repertório.`)
}

function openAddTagToDocModal() {
  docTagNameError.value = ''
  isDocTagModalOpen.value = true
}

function handleAddTagToDoc(payload: TagFormPayload) {
  const doc = activeDoc.value
  const cleanName = payload.name.trim()
  if (!doc) {
    return
  }
  if (!cleanName) {
    docTagNameError.value = 'Informe o nome da tag.'
    return
  }

  const alreadyHasTag = doc.tags.some((tag) => tag.label.toLowerCase() === cleanName.toLowerCase())
  if (alreadyHasTag) {
    docTagNameError.value = 'Esta tag já está vinculada ao documento.'
    return
  }

  const newTag: DocumentTagItem = {
    id: `doc-tag-${Date.now()}`,
    label: cleanName,
  }
  doc.tags = [...doc.tags, newTag]
  doc.history = [
    {
      id: `hist-${Date.now()}`,
      title: `Tag "${cleanName}" adicionada`,
      summary: payload.description.trim() || 'Rótulo vinculado nos detalhes do documento.',
      author: 'Ana Paula',
      date: 'Agora',
    },
    ...doc.history,
  ]

  if (!tagsList.value.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
    tagsList.value = [
      {
        id: `tag-${Date.now()}`,
        name: cleanName,
        category: 'Geral',
        description: payload.description.trim() || 'Tag criada a partir de um documento.',
        documentsCount: 1,
        createdAt: 'Agora',
      },
      ...tagsList.value,
    ]
  }

  isDocTagModalOpen.value = false
  docTagNameError.value = ''
  toast.success(`Tag "${cleanName}" vinculada ao documento.`)
}

function handleRemoveDocTag(tagId: string, explicitDocId?: string) {
  const targetDocId = explicitDocId ?? activeDoc.value?.id
  const doc = documents.value.find((item) => item.id === targetDocId)
  if (!doc) {
    return
  }
  const removed = doc.tags.find((tag) => tag.id === tagId)
  doc.tags = doc.tags.filter((tag) => tag.id !== tagId)
  if (removed) {
    doc.history = [
      {
        id: `hist-${Date.now()}`,
        title: `Tag "${removed.label}" removida`,
        summary: 'Rótulo desvinculado do documento.',
        author: 'Ana Paula',
        date: 'Agora',
      },
      ...doc.history,
    ]
    toast.success(`Tag "${removed.label}" removida do documento.`)
  }
}

function toggleKeySelection(list: Array<string | number>, key: string | number) {
  return list.includes(key) ? list.filter((item) => item !== key) : [...list, key]
}

function toggleAssetSelection(rowKey: string | number) {
  selectedAssetKeys.value = toggleKeySelection(selectedAssetKeys.value, rowKey)
}

function toggleTagSelection(rowKey: string | number) {
  selectedTagKeys.value = toggleKeySelection(selectedTagKeys.value, rowKey)
}

function inferAssetType(fileName: string): RepertoryAsset['type'] {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) return 'PDF'
  if (lower.endsWith('.json')) return 'JSON'
  if (lower.endsWith('.md')) return 'Markdown'
  return 'Imagem'
}

function formatAssetSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function handleMockAssetUpload(files: File[]) {
  if (files.length === 0) {
    return
  }

  const uploaded: RepertoryAsset[] = files.map((file, index) => ({
    id: `asset-${Date.now()}-${index}`,
    name: file.name,
    type: inferAssetType(file.name),
    size: formatAssetSize(file.size || 245760),
    linkedDoc: documents.value[0]?.title ?? 'Repertório geral',
    updatedAt: 'Agora',
  }))

  assets.value = [...uploaded, ...assets.value]
  assetPage.value = 1
  isUploadAssetModalOpen.value = false
  toast.success(
    uploaded.length === 1
      ? `Asset "${uploaded[0]?.name}" enviado com sucesso.`
      : `${uploaded.length} assets enviados com sucesso.`,
  )
}

function handleAssetBatchAction(actionId: string) {
  const count = selectedAssetKeys.value.length
  if (count === 0) {
    return
  }

  if (actionId === 'download') {
    toast.info(`Download em lote de ${count} asset(s) iniciado (demonstração).`)
    return
  }

  if (actionId === 'delete') {
    confirmState.value = {
      open: true,
      target: 'assets',
      title: 'remover assets selecionados',
      description: `Deseja remover ${count} asset(s) selecionado(s) do repertório local? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Remover assets',
    }
  }
}

function openNewTagModal() {
  newTagNameError.value = ''
  isNewTagModalOpen.value = true
}

function handleCreateTag(payload: TagFormPayload) {
  const cleanName = payload.name.trim()
  if (!cleanName) {
    newTagNameError.value = 'Informe um nome para a tag.'
    return
  }

  const duplicate = tagsList.value.some(
    (item) => item.name.toLowerCase() === cleanName.toLowerCase(),
  )
  if (duplicate) {
    newTagNameError.value = 'Já existe uma tag com este nome.'
    return
  }

  const newTag: RepertoryTag = {
    id: `tag-${Date.now()}`,
    name: cleanName,
    category: 'Personalizada',
    description: payload.description.trim() || 'Rótulo cadastrado no repertório.',
    documentsCount: 0,
    createdAt: 'Agora',
  }

  tagsList.value = [newTag, ...tagsList.value]
  tagPage.value = 1
  isNewTagModalOpen.value = false
  newTagNameError.value = ''
  toast.success(`Tag "${cleanName}" criada com sucesso.`)
}

function handleTagBatchAction(actionId: string) {
  const count = selectedTagKeys.value.length
  if (count === 0) {
    return
  }

  if (actionId === 'delete') {
    confirmState.value = {
      open: true,
      target: 'tags',
      title: 'remover tags selecionadas',
      description: `Deseja remover ${count} tag(s) selecionada(s)? Elas deixarão de aparecer na listagem cadastrada.`,
      confirmLabel: 'Remover tags',
    }
  }
}

function executeBatchDeletion() {
  if (confirmState.value.target === 'assets') {
    const selectedSet = new Set(selectedAssetKeys.value)
    const removedCount = selectedSet.size
    assets.value = assets.value.filter((asset) => !selectedSet.has(asset.id))
    selectedAssetKeys.value = []
    confirmState.value.open = false
    toast.success(`${removedCount} asset(s) removido(s) com sucesso.`)
    return
  }

  if (confirmState.value.target === 'tags') {
    const selectedSet = new Set(selectedTagKeys.value)
    const removedCount = selectedSet.size
    tagsList.value = tagsList.value.filter((tag) => !selectedSet.has(tag.id))
    selectedTagKeys.value = []
    confirmState.value.open = false
    toast.success(`${removedCount} tag(s) removida(s) com sucesso.`)
  }
}
</script>

<template>
  <AppShell title="repertório" active-nav="repertory">
    <template #subheader>
      <div class="repertory-view__subheader">
        <Tabs v-model="activeTab" :items="tabItems" aria-label="Seções do repertório" />
      </div>
    </template>

    <div class="repertory-view">
      <!-- Aba 1: Documents -->
      <section v-if="activeTab === 'documents'" class="repertory-view__section">
        <div class="repertory-view__filters-header">
          <h2 class="repertory-view__section-title">filtros</h2>
          <Button variant="primary" size="md" @click="openNewDocModal">novo documento</Button>
        </div>

        <div class="repertory-view__controls">
          <div class="repertory-view__control repertory-view__control--search">
            <SearchInput
              v-model="docSearch"
              placeholder="Título do documento"
              aria-label="Buscar documento por título"
            />
          </div>

          <div class="repertory-view__control repertory-view__control--select">
            <Select
              v-model="selectedTagFilter"
              :options="tagFilterOptions"
              placeholder="selecione as tags"
              aria-label="Filtrar por tag"
              @change="addTagFilter"
            />
          </div>

          <div class="repertory-view__control repertory-view__control--select">
            <Select
              v-model="selectedStatusFilter"
              :options="statusFilterOptions"
              placeholder="status"
              aria-label="Filtrar por status"
            />
          </div>
        </div>

        <div
          v-if="activeTagFilters.length > 0 || hasActiveDocFilters"
          class="repertory-view__active-filters"
        >
          <Tag
            v-for="tagLabel in activeTagFilters"
            :key="tagLabel"
            :label="tagLabel"
            :dismissible="true"
            :dismiss-label="`Remover filtro ${tagLabel}`"
            @dismiss="removeTagFilter(tagLabel)"
          />
          <Button v-if="hasActiveDocFilters" variant="ghost" size="sm" @click="clearDocFilters">
            limpar filtros
          </Button>
        </div>

        <div v-if="filteredDocuments.length > 0" class="repertory-view__grid">
          <DocumentCard
            v-for="doc in filteredDocuments"
            :id="doc.id"
            :key="doc.id"
            :title="doc.title"
            :description="doc.description"
            :tags="doc.tags"
            :thumbnail-url="doc.thumbnailUrl"
            :status="doc.status"
            @select="openDocumentDetails"
            @download="handleDownloadDocument"
            @remove-tag="(docId, tagId) => handleRemoveDocTag(tagId, docId)"
          />
        </div>

        <div v-else class="repertory-view__empty" role="status">
          <Icon name="documents" size="2xl" color="helper" />
          <div class="repertory-view__empty-copy">
            <h3 class="repertory-view__empty-title">nenhum documento encontrado</h3>
            <p class="repertory-view__empty-description">
              Ajuste os termos de busca ou remova os filtros aplicados para visualizar os
              documentos.
            </p>
          </div>
          <Button variant="tertiary" size="md" @click="clearDocFilters">limpar filtros</Button>
        </div>
      </section>

      <!-- Aba 2: Assets -->
      <section v-else-if="activeTab === 'assets'" class="repertory-view__section">
        <div class="repertory-view__assets-bar">
          <div class="repertory-view__assets-filters">
            <div class="repertory-view__control repertory-view__control--search">
              <SearchInput
                v-model="assetSearch"
                placeholder="Buscar asset"
                aria-label="Buscar asset"
              />
            </div>

            <div class="repertory-view__control repertory-view__control--select">
              <Select
                v-model="assetTypeFilter"
                :options="assetTypeOptions"
                placeholder="tipo de arquivo"
                aria-label="Filtrar por tipo de arquivo"
              />
            </div>
          </div>

          <Button variant="primary" icon="upload" @click="isUploadAssetModalOpen = true">
            enviar asset
          </Button>
        </div>

        <DataTable
          v-if="paginatedAssetRows.length > 0"
          title="assets vinculados"
          description="arquivos e anexos utilizados nos documentos do repertório"
          :columns="assetColumns"
          :rows="paginatedAssetRows"
          :selectable="true"
          :selected-row-keys="selectedAssetKeys"
          :show-pagination="true"
          :can-previous="assetPage > 1"
          :can-next="assetPage < totalAssetPages"
          :batch-actions="assetBatchActions"
          @toggle-select="toggleAssetSelection"
          @previous-page="assetPage--"
          @next-page="assetPage++"
          @batch-action="handleAssetBatchAction"
          @clear-selection="selectedAssetKeys = []"
        >
          <template #cell-type="{ value }">
            <Badge :label="String(value)" />
          </template>
        </DataTable>

        <div v-else class="repertory-view__empty" role="status">
          <Icon name="attachment" size="2xl" color="helper" />
          <div class="repertory-view__empty-copy">
            <h3 class="repertory-view__empty-title">nenhum asset encontrado</h3>
            <p class="repertory-view__empty-description">
              Nenhum arquivo corresponde aos filtros atuais.
            </p>
          </div>
          <Button
            variant="tertiary"
            size="md"
            @click="
              () => {
                assetSearch = ''
                assetTypeFilter = ''
              }
            "
          >
            limpar filtros
          </Button>
        </div>
      </section>

      <!-- Aba 3: Tags -->
      <section v-else class="repertory-view__section">
        <DataTable
          title="tags cadastradas"
          description="organize os rótulos usados nos documentos e workflows"
          :columns="tagColumns"
          :rows="paginatedTagRows"
          :selectable="true"
          :selected-row-keys="selectedTagKeys"
          :show-pagination="true"
          :can-previous="tagPage > 1"
          :can-next="tagPage < totalTagPages"
          action-label="nova tag"
          :batch-actions="tagBatchActions"
          @toggle-select="toggleTagSelection"
          @previous-page="tagPage--"
          @next-page="tagPage++"
          @primary-action="openNewTagModal"
          @batch-action="handleTagBatchAction"
          @clear-selection="selectedTagKeys = []"
        >
          <template #cell-category="{ value }">
            <Badge :label="String(value)" />
          </template>
        </DataTable>
      </section>
    </div>

    <!-- Sheet Detalhes do Documento -->
    <Sheet v-model:open="isDetailsSheetOpen" size="md" title="detalhes do documento">
      <div v-if="activeDoc" class="repertory-view__sheet-content">
        <DocumentDetails
          :title="activeDoc.title"
          :description="activeDoc.description"
          :tags="activeDoc.tags"
          :history="activeDoc.history"
          :editable-tags="true"
          :show-add-tag="true"
          @add-tag="openAddTagToDocModal"
          @remove-tag="handleRemoveDocTag"
        >
          <template #header-actions>
            <IconButton
              variant="ghost"
              size="sm"
              icon="download"
              :ariaLabel="`Baixar ${activeDoc.title}`"
              @click="handleDownloadDocument(activeDoc.id)"
            />
          </template>
        </DocumentDetails>

        <footer class="repertory-view__sheet-actions">
          <Button
            variant="tertiary"
            size="md"
            icon="download"
            @click="handleDownloadDocument(activeDoc.id)"
          >
            baixar documento
          </Button>
        </footer>
      </div>
    </Sheet>

    <!-- Modal Novo Documento -->
    <Modal
      v-model:open="isNewDocModalOpen"
      size="lg"
      title="novo documento"
      subtitle="Adicione um documento ao repertório local."
    >
      <DocumentForm
        v-if="isNewDocModalOpen"
        :title-error="newDocTitleError"
        @update:title="newDocTitleError = ''"
        @submit="handleCreateDocument"
        @cancel="isNewDocModalOpen = false"
      />
    </Modal>

    <!-- Modal Adicionar Tag ao Documento -->
    <Modal v-model:open="isDocTagModalOpen" size="sm" title="adicionar tag">
      <TagForm
        v-if="isDocTagModalOpen"
        :name-error="docTagNameError"
        @update:name="docTagNameError = ''"
        @submit="handleAddTagToDoc"
        @cancel="isDocTagModalOpen = false"
      />
    </Modal>

    <!-- Modal Enviar Asset -->
    <Modal v-model:open="isUploadAssetModalOpen" size="sm" title="enviar asset">
      <FileUpload
        label="Selecione um arquivo para o repertório"
        hint="PDF, PNG, JPG, MD ou JSON até 10mb"
        @select="handleMockAssetUpload"
      />
    </Modal>

    <!-- Modal Nova Tag -->
    <Modal v-model:open="isNewTagModalOpen" size="sm" title="nova tag">
      <TagForm
        v-if="isNewTagModalOpen"
        :name-error="newTagNameError"
        @update:name="newTagNameError = ''"
        @submit="handleCreateTag"
        @cancel="isNewTagModalOpen = false"
      />
    </Modal>

    <!-- ConfirmDialog Compartilhado -->
    <ConfirmDialog
      v-model:open="confirmState.open"
      :title="confirmState.title"
      :description="confirmState.description"
      :confirm-label="confirmState.confirmLabel"
      confirm-variant="danger"
      @confirm="executeBatchDeletion"
    />
  </AppShell>
</template>

<style scoped>
.repertory-view {
  --repertory-view-padding-y: var(--spacing-6);
  --repertory-view-padding-x: var(--spacing-6);
  --repertory-view-mobile-padding-y: var(--spacing-5);
  --repertory-view-mobile-padding-x: var(--spacing-4);
  --repertory-view-section-gap: var(--spacing-5);
  --repertory-view-controls-gap: var(--spacing-4);
  --repertory-view-grid-gap: var(--spacing-6);
  --repertory-view-filter-tags-gap: var(--spacing-3);
  --repertory-view-search-basis: 280px;
  --repertory-view-select-basis: 210px;
  --repertory-view-empty-padding-y: var(--spacing-10);
  --repertory-view-empty-padding-x: var(--spacing-6);
  --repertory-view-empty-gap: var(--spacing-4);
  --repertory-view-empty-bg: var(--surface-elevated);
  --repertory-view-border-color: var(--border-subtle-1);
  --repertory-view-border-width: var(--border-width-thin);
  --repertory-view-radius: var(--radius-none);
  --repertory-view-title-color: var(--text-primary);
  --repertory-view-title-font-family: var(--type-heading-03-font-family);
  --repertory-view-title-font-size: var(--type-heading-03-font-size);
  --repertory-view-title-line-height: var(--type-heading-03-line-height);
  --repertory-view-title-font-weight: var(--type-heading-03-font-weight);
  --repertory-view-title-text-transform: var(--type-heading-03-text-transform);
  --repertory-view-empty-title-font-family: var(--type-heading-02-font-family);
  --repertory-view-empty-title-font-size: var(--type-heading-02-font-size);
  --repertory-view-empty-title-line-height: var(--type-heading-02-line-height);
  --repertory-view-empty-title-font-weight: var(--type-heading-02-font-weight);
  --repertory-view-empty-description-color: var(--text-helper);
  --repertory-view-empty-description-font-family: var(--type-body-01-font-family);
  --repertory-view-empty-description-font-size: var(--type-body-01-font-size);
  --repertory-view-empty-description-line-height: var(--type-body-01-line-height);
  --repertory-view-empty-description-font-weight: var(--type-body-01-font-weight);
  --repertory-view-sheet-gap: var(--spacing-6);
  --repertory-view-reset-spacing: var(--spacing-0);

  display: flex;
  flex-direction: column;
  width: 100%;
  padding: var(--repertory-view-padding-y) var(--repertory-view-padding-x);
  box-sizing: border-box;
}

.repertory-view__subheader {
  display: flex;
  align-items: stretch;
  width: 100%;
  min-width: var(--repertory-view-reset-spacing);
}

.repertory-view__section {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-view-section-gap);
  width: 100%;
  min-width: var(--repertory-view-reset-spacing);
}

.repertory-view__filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--repertory-view-controls-gap);
  flex-wrap: wrap;
}

.repertory-view__section-title {
  margin: var(--repertory-view-reset-spacing);
  color: var(--repertory-view-title-color);
  font-family: var(--repertory-view-title-font-family);
  font-size: var(--repertory-view-title-font-size);
  line-height: var(--repertory-view-title-line-height);
  font-weight: var(--repertory-view-title-font-weight);
  text-transform: var(--repertory-view-title-text-transform);
}

.repertory-view__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--repertory-view-controls-gap);
}

.repertory-view__control {
  min-width: var(--repertory-view-reset-spacing);
}

.repertory-view__control--search {
  flex: 1 1 var(--repertory-view-search-basis);
}

.repertory-view__control--select {
  flex: 0 1 var(--repertory-view-select-basis);
  min-width: 180px;
}

.repertory-view__active-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--repertory-view-filter-tags-gap);
}

.repertory-view__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--repertory-view-grid-gap);
  width: 100%;
}

.repertory-view__assets-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--repertory-view-controls-gap);
}

.repertory-view__assets-filters {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: var(--repertory-view-controls-gap);
  min-width: var(--repertory-view-reset-spacing);
}

.repertory-view__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--repertory-view-empty-gap);
  padding: var(--repertory-view-empty-padding-y) var(--repertory-view-empty-padding-x);
  background-color: var(--repertory-view-empty-bg);
  border: var(--repertory-view-border-width) solid var(--repertory-view-border-color);
  border-radius: var(--repertory-view-radius);
}

.repertory-view__empty-copy {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  max-width: 420px;
}

.repertory-view__empty-title {
  margin: var(--repertory-view-reset-spacing);
  color: var(--repertory-view-title-color);
  font-family: var(--repertory-view-empty-title-font-family);
  font-size: var(--repertory-view-empty-title-font-size);
  line-height: var(--repertory-view-empty-title-line-height);
  font-weight: var(--repertory-view-empty-title-font-weight);
  text-transform: lowercase;
}

.repertory-view__empty-description {
  margin: var(--repertory-view-reset-spacing);
  color: var(--repertory-view-empty-description-color);
  font-family: var(--repertory-view-empty-description-font-family);
  font-size: var(--repertory-view-empty-description-font-size);
  line-height: var(--repertory-view-empty-description-line-height);
  font-weight: var(--repertory-view-empty-description-font-weight);
}

.repertory-view__sheet-content {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-view-sheet-gap);
}

.repertory-view__sheet-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--spacing-4);
  border-top: var(--repertory-view-border-width) solid var(--repertory-view-border-color);
}

@media (max-width: 767px) {
  .repertory-view {
    padding: var(--repertory-view-mobile-padding-y) var(--repertory-view-mobile-padding-x);
  }

  .repertory-view__control--search,
  .repertory-view__control--select {
    flex: 1 1 100%;
  }

  .repertory-view__assets-bar {
    align-items: stretch;
  }
}
</style>
