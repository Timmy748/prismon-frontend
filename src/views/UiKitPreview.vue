<script setup lang="ts">
import { ref } from 'vue'
import {
  ICON_PATHS,
  Icon,
  Button,
  IconButton,
  Badge,
  Tag,
  TextInput,
  TextArea,
  Select,
  SearchInput,
  FileUpload,
  Tabs,
  Breadcrumb,
  Sidebar,
  ListItem,
  NavList,
  ProfileCard,
  Modal,
  ConfirmDialog,
  Sheet,
  Drawer,
  Notification,
  DataTable,
  Pagination,
  BatchActionBar,
  ChatMessage,
  AiPromptInput,
  FileAttachmentCard,
  WorkflowCard,
  WorkflowStepsAccordion,
  ScrollContainer,
  DocumentDetails,
  ModificationEvent,
  DocumentForm,
  TagForm,
  type IconName,
  type ButtonVariant,
  type ButtonSize,
  type IconButtonSize,
  type IconButtonVariant,
  type SelectOption,
  type TabOption,
  type BreadcrumbItem,
  type DataTableColumn,
  type BatchAction,
  type AiAttachmentItem,
  type WorkflowStep,
  type DocumentTagItem,
  type DocumentHistoryEntry,
  type DocumentFormPayload,
  type TagFormPayload,
} from '@/components/ui'

interface NavSection {
  id: string
  label: string
  icon: IconName
}

const SECTIONS: NavSection[] = [
  { id: 'icons', label: 'Ícones', icon: 'robot' },
  { id: 'buttons', label: 'Botões', icon: 'send' },
  { id: 'badges', label: 'Badges & Tags', icon: 'tag' },
  { id: 'forms', label: 'Formulários', icon: 'text' },
  { id: 'navigation', label: 'Navegação', icon: 'folder' },
  { id: 'overlays', label: 'Overlays & Feedback', icon: 'setting' },
  { id: 'data-table', label: 'Data Table', icon: 'documents' },
  { id: 'ai', label: 'Chat IA & Workflows', icon: 'chat' },
  { id: 'layout', label: 'Layout & Scroll', icon: 'folder' },
  { id: 'documents', label: 'Documentos', icon: 'upload' },
]

const sidebarCollapsed = ref(false)
const activeSection = ref('icons')

function scrollToSection(id: string) {
  activeSection.value = id
  const target = document.getElementById(id)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Icons
const allIconNames = Object.keys(ICON_PATHS) as IconName[]

// Buttons
const buttonVariants: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'ghost', 'danger']
const buttonSizes: ButtonSize[] = ['sm', 'md', 'lg']
const iconButtonSizes: IconButtonSize[] = ['sm', 'md', 'lg']
const iconButtonVariants: IconButtonVariant[] = [
  'primary',
  'secondary',
  'tertiary',
  'ghost',
  'danger',
]

// Tags
const initialTags = ['design system', 'documentação', 'workflow', 'repertório']
const activeTags = ref<string[]>([...initialTags])

function dismissTag(label: string) {
  activeTags.value = activeTags.value.filter((item) => item !== label)
}

function resetTags() {
  activeTags.value = [...initialTags]
}

// Forms
const textValue = ref('')
const textErrorValue = ref('valor inválido')
const textAreaValue = ref('')
const selectValue = ref('gpt-4o')
const inlineSelectValue = ref('medium')
const searchValue = ref('')
const selectedUploadNames = ref<string[]>([])

const modelOptions: SelectOption[] = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'Gemini 2.5 Pro', value: 'gemini-pro' },
  { label: 'Claude 3.7 Sonnet', value: 'claude-sonnet' },
]

const effortOptions: SelectOption[] = [
  { label: 'Baixo', value: 'low' },
  { label: 'Médio', value: 'medium' },
  { label: 'Alto', value: 'high' },
]

function handleUploadSelect(files: File[]) {
  selectedUploadNames.value = files.map((file) => file.name)
}

// Navigation
const activeTab = ref('documents')
const tabItems: TabOption[] = [
  { id: 'documents', label: 'documents' },
  { id: 'assets', label: 'assets' },
  { id: 'tags', label: 'tags' },
]

const breadcrumbItems: BreadcrumbItem[] = [
  { id: 'home', label: 'Repertório', href: '#navigation' },
  { id: 'brand', label: 'Marca', href: '#navigation' },
  { id: 'current', label: 'Manual 2026' },
]

// Overlays
const modalSmOpen = ref(false)
const modalLgOpen = ref(false)
const confirmPrimaryOpen = ref(false)
const confirmDangerOpen = ref(false)
const sheetOpen = ref(false)
const drawerOpen = ref(false)
const lastOverlayFeedback = ref('Nenhuma ação disparada ainda.')

function handleConfirmPrimary() {
  confirmPrimaryOpen.value = false
  lastOverlayFeedback.value = 'ConfirmDialog primário confirmado.'
}

function handleConfirmDanger() {
  confirmDangerOpen.value = false
  lastOverlayFeedback.value = 'ConfirmDialog danger confirmado.'
}

// Data Table
const tableColumns: DataTableColumn[] = [
  { key: 'name', label: 'Nome' },
  { key: 'role', label: 'Cargo' },
  { key: 'category', label: 'Categoria' },
  { key: 'updatedAt', label: 'Atualizado' },
]

const tableRows = [
  { id: 1, name: 'Ana Silva', role: 'Admin', category: 'Design', updatedAt: '22/11/2026' },
  { id: 2, name: 'Bruno Costa', role: 'Editor', category: 'Produto', updatedAt: '21/11/2026' },
  { id: 3, name: 'Carla Dias', role: 'Membro', category: 'Engenharia', updatedAt: '20/11/2026' },
  { id: 4, name: 'Diego Lima', role: 'Editor', category: 'IA', updatedAt: '19/11/2026' },
]

const selectedRowKeys = ref<Array<string | number>>([1])
const tablePage = ref(1)

const batchActions: BatchAction[] = [
  { id: 'change-role', label: 'trocar cargo', icon: 'repeat' },
  { id: 'remove', label: 'remover', icon: 'delete' },
]

function toggleTableRow(rowKey: string | number) {
  if (selectedRowKeys.value.includes(rowKey)) {
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== rowKey)
  } else {
    selectedRowKeys.value = [...selectedRowKeys.value, rowKey]
  }
}

function handleBatchAction(actionId: string) {
  lastOverlayFeedback.value = `Ação em massa "${actionId}" executada para ${selectedRowKeys.value.length} item(ns).`
}

// Chat AI & Workflows
const chatMessages = ref<Array<{ id: number; role: 'human' | 'ai'; content: string }>>([
  { id: 1, role: 'human', content: 'Crie um resumo dos documentos de identidade visual.' },
  {
    id: 2,
    role: 'ai',
    content:
      'Os documentos definem tipografia com Funnel Display + Noto Sans, superfícies neutras claras e acento rosa (#F33FF0) com glow nos botões.',
  },
])

const aiPrompt = ref('')
const aiAttachments = ref<AiAttachmentItem[]>([
  { id: 'att-1', filename: 'manual-marca.pdf', fileSize: '66 KB' },
  { id: 'att-2', filename: 'referencias-ui.png', fileSize: '1.4 MB' },
])

function handleRemoveAiAttachment(attachmentId: string) {
  aiAttachments.value = aiAttachments.value.filter((item) => item.id !== attachmentId)
}

function handleAiSubmit(message: string) {
  chatMessages.value.push({
    id: Date.now(),
    role: 'human',
    content: message,
  })
  aiPrompt.value = ''
}

const selectedWorkflowId = ref('wf-1')
const workflowList = [
  {
    id: 'wf-1',
    name: 'Análise de Repertório',
    version: 'Versão: 1.0.0',
    category: 'pesquisa',
    description:
      'Extrai padrões visuais, referências e diretrizes de documentos anexados ao projeto.',
  },
  {
    id: 'wf-2',
    name: 'Revisão Editorial',
    version: 'Versão: 1.2.0',
    category: 'conteúdo',
    description: 'Valida consistência de tom de voz, terminologia e estrutura antes da publicação.',
  },
]

const workflowSteps: WorkflowStep[] = [
  { id: 'step-1', title: 'Etapa 1' },
  { id: 'step-2', title: 'Etapa 2' },
]

const stepConfig = ref<Record<string, { model: string; effort: string }>>({
  'step-1': { model: 'gpt-4o', effort: 'medium' },
  'step-2': { model: 'gemini-pro', effort: 'high' },
})

function updateStepModel(stepId: string, value: string) {
  const current = stepConfig.value[stepId] ?? { model: 'gpt-4o', effort: 'medium' }
  stepConfig.value[stepId] = { ...current, model: value }
}

function updateStepEffort(stepId: string, value: string) {
  const current = stepConfig.value[stepId] ?? { model: 'gpt-4o', effort: 'medium' }
  stepConfig.value[stepId] = { ...current, effort: value }
}

// Documents
const documentTags = ref<DocumentTagItem[]>([
  { id: 't1', label: 'identidade' },
  { id: 't2', label: 'ui kit' },
  { id: 't3', label: 'tcc' },
  { id: 't4', label: 'design system' },
  { id: 't5', label: 'documentação' },
  { id: 't6', label: 'tokens semânticos' },
  { id: 't7', label: 'arquitetura bem' },
  { id: 't8', label: 'componentização' },
  { id: 't9', label: 'repertório visual' },
])

const documentHistory: DocumentHistoryEntry[] = [
  {
    id: 'h1',
    title: 'Alteração de título e descrição',
    summary: 'Modificou título de "Guia antigo" para "Guia de UI Prismon" e atualizou a descrição.',
    author: 'Timmy Chen',
    date: '22/11/2026',
  },
  {
    id: 'h2',
    title: 'Classificação por tags',
    summary: 'Adicionou tags de classificação do repertório.',
    author: 'Ana Silva',
    date: '20/11/2026',
  },
]

const docFormTitle = ref('')
const docFormDescription = ref('')
const tagFormName = ref('')
const tagFormDescription = ref('')
const formStatusMessage = ref('')

function handleRemoveDocTag(tagId: string) {
  documentTags.value = documentTags.value.filter((tag) => tag.id !== tagId)
}

function handleAddDocTag() {
  const nextIndex = documentTags.value.length + 1
  documentTags.value = [...documentTags.value, { id: `t-${Date.now()}`, label: `tag ${nextIndex}` }]
}

function handleDocFormSubmit(payload: DocumentFormPayload) {
  formStatusMessage.value = `Documento "${payload.title || 'Sem título'}" pronto (${payload.files.length} arquivo(s)).`
}

function handleTagFormSubmit(payload: TagFormPayload) {
  formStatusMessage.value = `Tag "${payload.name || 'Sem nome'}" pronta para salvar.`
}
</script>

<template>
  <div class="preview">
    <div class="preview__sidebar">
      <Sidebar
        title="prismon"
        :collapsed="sidebarCollapsed"
        @toggle="sidebarCollapsed = !sidebarCollapsed"
      >
        <NavList :title="sidebarCollapsed ? undefined : 'ui kit'">
          <ListItem
            v-for="section in SECTIONS"
            :key="section.id"
            :label="section.label"
            :icon="section.icon"
            :collapsed="sidebarCollapsed"
            :active="activeSection === section.id"
            @click="scrollToSection(section.id)"
          />
        </NavList>

        <template #footer>
          <ProfileCard
            v-if="!sidebarCollapsed"
            username="Timmy Chen"
            role="Designer"
            @settings-click="confirmPrimaryOpen = true"
          />
        </template>
      </Sidebar>
    </div>

    <main class="preview__main">
      <header class="preview__header">
        <h1 class="type-expressive-heading-05 preview__title">prismon ui kit</h1>
        <p class="type-body-02 preview__subtitle">
          Preview interativo dos 34 componentes e tokens implementados a partir do Figma.
        </p>
      </header>

      <!-- 1. ICONS -->
      <section id="icons" class="preview__section">
        <div class="preview__section-header">
          <h2 class="type-heading-04 preview__section-title">ícones</h2>
          <span class="type-body-compact-01 preview__section-meta">
            24 SVGs extraídos do Figma (`Icon`)
          </span>
        </div>

        <div class="preview__icon-grid">
          <div v-for="iconName in allIconNames" :key="iconName" class="preview__icon-card">
            <Icon :name="iconName" size="xl" color="primary" />
            <span class="type-label-01 preview__icon-name">{{ iconName }}</span>
          </div>
        </div>
      </section>

      <!-- 2. BUTTONS -->
      <section id="buttons" class="preview__section">
        <div class="preview__section-header">
          <h2 class="type-heading-04 preview__section-title">botões</h2>
          <span class="type-body-compact-01 preview__section-meta">
            `Button` (sm / md / lg + glow nas variantes) e `IconButton`
          </span>
        </div>

        <div class="preview__stack">
          <div v-for="size in buttonSizes" :key="size" class="preview__card">
            <span class="type-label-01 preview__card-label">Tamanho: {{ size }}</span>
            <div class="preview__row">
              <Button
                v-for="variant in buttonVariants"
                :key="variant"
                :variant="variant"
                :size="size"
              >
                {{ variant }}
              </Button>
              <Button variant="primary" :size="size" icon="arrow-right">com ícone</Button>
              <Button variant="primary" :size="size" disabled>disabled</Button>
              <Button variant="ghost" :size="size" disabled>ghost disabled</Button>
            </div>
          </div>

          <div v-for="iconSize in iconButtonSizes" :key="iconSize" class="preview__card">
            <span class="type-label-01 preview__card-label">IconButton ({{ iconSize }})</span>
            <div class="preview__row">
              <IconButton
                v-for="variant in iconButtonVariants"
                :key="variant"
                :variant="variant"
                :size="iconSize"
                icon="send"
                :ariaLabel="`Botão de ícone ${variant} ${iconSize}`"
              />
              <IconButton
                variant="primary"
                :size="iconSize"
                icon="delete"
                :ariaLabel="`Botão desabilitado ${iconSize}`"
                disabled
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 3. BADGES & TAGS -->
      <section id="badges" class="preview__section">
        <div class="preview__section-header">
          <h2 class="type-heading-04 preview__section-title">badges &amp; tags</h2>
          <span class="type-body-compact-01 preview__section-meta">`Badge` e `Tag`</span>
        </div>

        <div class="preview__card">
          <div class="preview__stack">
            <div class="preview__row">
              <Badge label="categoria" />
              <Badge label="pesquisa" />
              <Badge label="v1.0.0" />
            </div>

            <div class="preview__row">
              <Tag label="tag padrão" />
              <Tag
                v-for="label in activeTags"
                :key="label"
                :label="label"
                dismissible
                @dismiss="dismissTag(label)"
              />
              <Button
                v-if="activeTags.length < initialTags.length"
                variant="ghost"
                size="sm"
                @click="resetTags"
              >
                restaurar tags
              </Button>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. FORMS -->
      <section id="forms" class="preview__section">
        <div class="preview__section-header">
          <h2 class="type-heading-04 preview__section-title">formulários</h2>
          <span class="type-body-compact-01 preview__section-meta">
            `TextInput`, `TextArea`, `Select` (default / inline), `SearchInput` e `FileUpload`
          </span>
        </div>

        <div class="preview__card preview__form-grid">
          <TextInput
            v-model="textValue"
            label="Label padrão"
            placeholder="place holder"
            helpText="help text"
          />
          <TextInput
            v-model="textErrorValue"
            label="Estado de erro"
            placeholder="place holder"
            error="Campo obrigatório ou inválido"
          />
          <TextInput
            modelValue="Somente leitura"
            label="Desabilitado"
            helpText="Campo bloqueado"
            disabled
          />
          <SearchInput v-model="searchValue" placeholder="search" />
          <Select
            v-model="selectValue"
            label="Select padrão"
            helpText="Escolha um modelo"
            :options="modelOptions"
          />
          <Select
            v-model="inlineSelectValue"
            variant="inline"
            label="Select inline"
            :options="effortOptions"
          />
        </div>

        <div class="preview__card preview__split">
          <TextArea
            v-model="textAreaValue"
            label="Descrição"
            placeholder="Digite sua descrição..."
            helpText="Texto auxiliar do textarea"
          />
          <div class="preview__stack">
            <FileUpload label="Suba seu arquivo" multiple @select="handleUploadSelect" />
            <span v-if="selectedUploadNames.length > 0" class="type-helper-text-01 preview__hint">
              Selecionados: {{ selectedUploadNames.join(', ') }}
            </span>
          </div>
        </div>
      </section>

      <!-- 5. NAVIGATION -->
      <section id="navigation" class="preview__section">
        <div class="preview__section-header">
          <h2 class="type-heading-04 preview__section-title">navegação</h2>
          <span class="type-body-compact-01 preview__section-meta">
            `Tabs`, `Breadcrumb`, `NavList` (vertical / horizontal), `ListItem`, `ProfileCard` e
            `Sidebar` (à esquerda)
          </span>
        </div>

        <div class="preview__card preview__stack">
          <Breadcrumb :items="breadcrumbItems" />
          <Tabs v-model="activeTab" :items="tabItems" ariaLabel="Seções do repertório" />
          <span class="type-helper-text-01 preview__hint">Aba ativa: {{ activeTab }}</span>

          <div class="preview__split">
            <div class="preview__nav-vertical-demo">
              <NavList title="listas verticais" collapsible>
                <ListItem label="Conversas" icon="chat" active />
                <ListItem label="Documentos" icon="documents" />
                <ListItem label="Membros" icon="members" hasTrailingAction />
                <ListItem label="Chaves de API" icon="api-keys" />
                <ListItem label="Workflows" icon="robot" />
                <ListItem label="Tags" icon="tag" />
                <ListItem label="Configurações" icon="setting" />
              </NavList>
            </div>

            <div class="preview__stack">
              <NavList title="lista horizontal" orientation="horizontal">
                <ListItem label="Chat" icon="chat" active />
                <ListItem label="Chaves" icon="api-keys" />
                <ListItem label="Tags" icon="tag" />
                <ListItem label="Documentos" icon="documents" />
                <ListItem label="Membros" icon="members" />
                <ListItem label="Workflows" icon="robot" />
                <ListItem label="Configurações" icon="setting" />
              </NavList>

              <ProfileCard username="Username" role="Role" />
            </div>
          </div>
        </div>
      </section>

      <!-- 6. OVERLAYS & FEEDBACK -->
      <section id="overlays" class="preview__section">
        <div class="preview__section-header">
          <h2 class="type-heading-04 preview__section-title">overlays &amp; feedback</h2>
          <span class="type-body-compact-01 preview__section-meta">
            `Modal`, `ConfirmDialog`, `Sheet`, `Drawer` e `Notification`
          </span>
        </div>

        <div class="preview__card preview__stack">
          <div class="preview__row">
            <Button variant="primary" @click="modalSmOpen = true">Abrir Modal (sm)</Button>
            <Button variant="secondary" @click="modalLgOpen = true">Abrir Modal (lg)</Button>
            <Button variant="tertiary" @click="confirmPrimaryOpen = true">ConfirmDialog</Button>
            <Button variant="danger" @click="confirmDangerOpen = true">ConfirmDialog Danger</Button>
            <Button variant="tertiary" @click="sheetOpen = true">Abrir Sheet</Button>
            <Button variant="tertiary" @click="drawerOpen = true">Abrir Drawer</Button>
          </div>
          <span class="type-helper-text-01 preview__hint">{{ lastOverlayFeedback }}</span>

          <div class="preview__split">
            <Notification
              title="Notificação"
              message="Documento sincronizado com o repositório de conhecimento."
              icon="documents"
            />
            <Notification
              variant="danger"
              title="Notificação"
              message="Não foi possível processar o arquivo enviado. Tente novamente."
              icon="close"
            />
          </div>
        </div>
      </section>

      <!-- 7. DATA TABLE -->
      <section id="data-table" class="preview__section">
        <div class="preview__section-header">
          <h2 class="type-heading-04 preview__section-title">data table</h2>
          <span class="type-body-compact-01 preview__section-meta">
            Clique nas linhas para selecionar e testar a `BatchActionBar` + `Pagination`
          </span>
        </div>

        <div class="preview__card preview__stack">
          <DataTable
            title="membros"
            description="Clique em qualquer linha para alternar seleção."
            :columns="tableColumns"
            :rows="tableRows"
            selectable
            :selectedRowKeys="selectedRowKeys"
            showPagination
            :canPrevious="tablePage > 1"
            :canNext="tablePage < 3"
            actionLabel="adicionar membro"
            actionIcon="add-member"
            :batchActions="batchActions"
            @toggle-select="toggleTableRow"
            @previous-page="tablePage = Math.max(1, tablePage - 1)"
            @next-page="tablePage = Math.min(3, tablePage + 1)"
            @primary-action="lastOverlayFeedback = 'Ação principal da tabela clicada.'"
            @batch-action="handleBatchAction"
            @clear-selection="selectedRowKeys = []"
          >
            <template #cell-category="{ value }">
              <Badge :label="String(value)" />
            </template>
          </DataTable>

          <div class="preview__row">
            <span class="type-label-01 preview__card-label">Componentes isolados:</span>
            <Pagination :canPrevious="true" :canNext="true" />
          </div>
          <BatchActionBar
            :selectedCount="2"
            :actions="batchActions"
            @action="handleBatchAction"
            @cancel="lastOverlayFeedback = 'BatchActionBar isolada cancelada.'"
          />
        </div>
      </section>

      <!-- 8. CHAT AI & WORKFLOWS -->
      <section id="ai" class="preview__section">
        <div class="preview__section-header">
          <h2 class="type-heading-04 preview__section-title">chat ia &amp; workflows</h2>
          <span class="type-body-compact-01 preview__section-meta">
            `ChatMessage`, `AiPromptInput`, `FileAttachmentCard`, `WorkflowCard` e
            `WorkflowStepsAccordion`
          </span>
        </div>

        <div class="preview__card preview__stack">
          <div class="preview__chat-feed">
            <ChatMessage
              v-for="msg in chatMessages"
              :key="msg.id"
              :role="msg.role"
              :content="msg.content"
            />
          </div>

          <div class="preview__row">
            <FileAttachmentCard filename="manual-marca.pdf" fileSize="66 KB" />
            <FileAttachmentCard filename="referencias-ui.png" fileSize="1.4 MB" />
          </div>

          <AiPromptInput
            v-model="aiPrompt"
            :attachments="aiAttachments"
            @submit="handleAiSubmit"
            @attach="lastOverlayFeedback = 'Ação anexar arquivo clicada no AiPromptInput.'"
            @select-workflow="modalLgOpen = true"
            @remove-attachment="handleRemoveAiAttachment"
          />

          <div class="preview__split">
            <div class="preview__stack">
              <WorkflowCard
                v-for="workflow in workflowList"
                :key="workflow.id"
                :name="workflow.name"
                :version="workflow.version"
                :description="workflow.description"
                :selected="selectedWorkflowId === workflow.id"
                @select="selectedWorkflowId = workflow.id"
              >
                <template #badge>
                  <Badge :label="workflow.category" />
                </template>
              </WorkflowCard>
            </div>

            <WorkflowStepsAccordion :steps="workflowSteps" :defaultOpenIds="['step-1']">
              <template #step="{ step }">
                <Select
                  label="Modelo"
                  :modelValue="stepConfig[step.id]?.model ?? 'gpt-4o'"
                  :options="modelOptions"
                  @update:modelValue="updateStepModel(step.id, $event)"
                />
                <Select
                  label="Esforço"
                  :modelValue="stepConfig[step.id]?.effort ?? 'medium'"
                  :options="effortOptions"
                  @update:modelValue="updateStepEffort(step.id, $event)"
                />
              </template>
            </WorkflowStepsAccordion>
          </div>
        </div>
      </section>

      <!-- 9. LAYOUT -->
      <section id="layout" class="preview__section">
        <div class="preview__section-header">
          <h2 class="type-heading-04 preview__section-title">layout & scroll</h2>
          <span class="type-body-compact-01 preview__section-meta">
            `ScrollContainer` (horizontal / vertical, exclusivo)
          </span>
        </div>

        <div class="preview__split">
          <div class="preview__card preview__stack">
            <span class="type-label-01 preview__card-label">
              ScrollContainer horizontal (roda do mouse ou clique e arraste com o mouse)
            </span>
            <div class="preview__scroll-demo">
              <ScrollContainer
                direction="horizontal"
                gap="md"
                ariaLabel="Exemplo de rolagem horizontal"
              >
                <Tag v-for="tag in documentTags" :key="tag.id" :label="tag.label" />
              </ScrollContainer>
            </div>
          </div>

          <div class="preview__card preview__stack">
            <span class="type-label-01 preview__card-label">
              ScrollContainer vertical (roda do mouse ou clique e arraste com o mouse)
            </span>
            <div class="preview__vertical-scroll-demo">
              <ScrollContainer
                direction="vertical"
                gap="md"
                ariaLabel="Exemplo de rolagem vertical"
              >
                <ModificationEvent
                  v-for="item in [1, 2, 3, 4]"
                  :key="item"
                  :title="`Evento de modificação #${item}`"
                  summary="Registro de exemplo para demonstrar rolagem vertical com máscaras dinâmicas nas bordas."
                  author="Timmy Chen"
                  date="22/11/2026"
                />
              </ScrollContainer>
            </div>
          </div>
        </div>
      </section>

      <!-- 10. DOCUMENTS -->
      <section id="documents" class="preview__section">
        <div class="preview__section-header">
          <h2 class="type-heading-04 preview__section-title">documentos</h2>
          <span class="type-body-compact-01 preview__section-meta">
            `DocumentDetails`, `ModificationEvent`, `DocumentForm` e `TagForm`
          </span>
        </div>

        <div class="preview__split">
          <div class="preview__stack">
            <div class="preview__card">
              <DocumentDetails
                title="Título do documento"
                description="Uma imagem que retrata a cena com iluminação natural e foco bem definido, com cores equilibradas e harmonia visual."
                :tags="documentTags"
                :history="documentHistory"
                editableTags
                @add-tag="handleAddDocTag"
                @remove-tag="handleRemoveDocTag"
              />
            </div>

            <div class="preview__card">
              <span class="type-label-01 preview__card-label">ModificationEvent (isolado)</span>
              <ModificationEvent
                title="Revisão de metadados"
                summary="Padronizou os metadados do documento conforme a ontologia do projeto."
                author="Lucas Almeida"
                date="21/11/2026"
              />
            </div>
          </div>

          <div class="preview__stack">
            <div class="preview__card">
              <DocumentForm
                v-model:title="docFormTitle"
                v-model:description="docFormDescription"
                titlePlaceholder="Ex.: Manual de marca"
                descriptionPlaceholder="Resumo do documento"
                @submit="handleDocFormSubmit"
                @cancel="formStatusMessage = 'DocumentForm cancelado.'"
              />
            </div>

            <div class="preview__card">
              <TagForm
                v-model:name="tagFormName"
                v-model:description="tagFormDescription"
                namePlaceholder="Ex.: Design System"
                descriptionPlaceholder="Quando aplicar esta tag"
                @submit="handleTagFormSubmit"
                @cancel="formStatusMessage = 'TagForm cancelado.'"
              />
            </div>

            <span v-if="formStatusMessage" class="type-helper-text-01 preview__hint">
              {{ formStatusMessage }}
            </span>
          </div>
        </div>
      </section>
    </main>

    <!-- Live Overlays -->
    <Modal
      v-model:open="modalSmOpen"
      title="Modal Title"
      subtitle="label"
      size="sm"
      @close="lastOverlayFeedback = 'Modal sm fechado.'"
    >
      <p class="type-body-01">
        Conteúdo de exemplo dentro do Modal padrão (`360px`) com backdrop blur e transição de
        escala.
      </p>
    </Modal>

    <Modal
      v-model:open="modalLgOpen"
      title="workflows"
      subtitle="Escolha qual workflow deseja usar."
      size="lg"
      @close="lastOverlayFeedback = 'Modal de workflows fechado.'"
    >
      <div class="preview__stack">
        <WorkflowCard
          v-for="workflow in workflowList"
          :key="workflow.id"
          :name="workflow.name"
          :version="workflow.version"
          :description="workflow.description"
          :selected="selectedWorkflowId === workflow.id"
          @select="selectedWorkflowId = workflow.id"
        >
          <template #badge>
            <Badge :label="workflow.category" />
          </template>
        </WorkflowCard>
      </div>
    </Modal>

    <ConfirmDialog
      v-model:open="confirmPrimaryOpen"
      title="Deseja sair da conta?"
      description="Caso saia será necessário realizar o login novamente para continuar."
      confirmLabel="Sair"
      @confirm="handleConfirmPrimary"
      @cancel="lastOverlayFeedback = 'ConfirmDialog primário cancelado.'"
    />

    <ConfirmDialog
      v-model:open="confirmDangerOpen"
      title="Excluir documento?"
      description="Esta ação removerá o documento permanentemente do repertório."
      confirmLabel="Excluir"
      confirmVariant="danger"
      @confirm="handleConfirmDanger"
      @cancel="lastOverlayFeedback = 'ConfirmDialog danger cancelado.'"
    />

    <Sheet
      v-model:open="sheetOpen"
      title="detalhes do documento"
      @close="lastOverlayFeedback = 'Sheet fechado.'"
    >
      <DocumentDetails
        title="Título do documento"
        description="Visualização do componente DocumentDetails composto dentro do Sheet lateral."
        :tags="documentTags"
        :history="documentHistory"
        editableTags
        @add-tag="handleAddDocTag"
        @remove-tag="handleRemoveDocTag"
      />
    </Sheet>

    <Drawer v-model:open="drawerOpen" @close="lastOverlayFeedback = 'Drawer fechado.'">
      <div class="preview__stack">
        <h3 class="type-heading-03">gaveta inferior</h3>
        <p class="type-body-01">Conteúdo exibido no Drawer com handle central.</p>
        <Button variant="primary" @click="drawerOpen = false">Fechar drawer</Button>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.preview {
  --preview-bg: var(--surface-base);
  --preview-card-bg: var(--surface-elevated);
  --preview-border-color: var(--border-subtle-1);
  --preview-border-width: var(--border-width-thin);
  --preview-text-primary: var(--text-primary);
  --preview-text-secondary: var(--text-secondary);
  --preview-text-helper: var(--text-helper);
  --preview-gap-sm: var(--spacing-3);
  --preview-gap-md: var(--spacing-5);
  --preview-gap-lg: var(--spacing-6);
  --preview-gap-xl: var(--spacing-8);

  display: flex;
  min-height: 100vh;
  background-color: var(--preview-bg);
}

.preview__sidebar {
  position: sticky;
  top: var(--spacing-0);
  height: 100vh;
  flex-shrink: 0;
}

.preview__main {
  flex: 1;
  min-width: var(--spacing-0);
  padding: var(--spacing-7);
  display: flex;
  flex-direction: column;
  gap: var(--preview-gap-xl);
}

.preview__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.preview__title {
  margin: var(--spacing-0);
  color: var(--preview-text-primary);
}

.preview__subtitle {
  margin: var(--spacing-0);
  color: var(--preview-text-secondary);
}

.preview__section {
  display: flex;
  flex-direction: column;
  gap: var(--preview-gap-md);
  scroll-margin-top: var(--spacing-6);
}

.preview__section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--preview-gap-sm);
  padding-bottom: var(--spacing-3);
  border-bottom: var(--preview-border-width) solid var(--preview-border-color);
}

.preview__section-title {
  margin: var(--spacing-0);
  color: var(--preview-text-primary);
}

.preview__section-meta {
  color: var(--preview-text-helper);
}

.preview__card {
  min-width: var(--spacing-0);
  background-color: var(--preview-card-bg);
  border: var(--preview-border-width) solid var(--preview-border-color);
  padding: var(--spacing-6);
}

.preview__card-label {
  display: block;
  margin-bottom: var(--spacing-3);
  color: var(--preview-text-helper);
}

.preview__stack {
  min-width: var(--spacing-0);
  display: flex;
  flex-direction: column;
  gap: var(--preview-gap-md);
}

.preview__scroll-demo {
  max-width: 420px;
  width: 100%;
  min-width: var(--spacing-0);
}

.preview__vertical-scroll-demo {
  height: 220px;
  width: 100%;
  min-width: var(--spacing-0);
}

.preview__nav-vertical-demo {
  width: 100%;
  min-width: var(--spacing-0);
}

.preview__nav-vertical-demo > :deep(.nav-list) {
  max-height: 210px;
}

.preview__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--preview-gap-md);
}

.preview__split {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: var(--preview-gap-lg);
  align-items: start;
}

.preview__split > * {
  min-width: var(--spacing-0);
}

.preview__form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--preview-gap-md);
  align-items: start;
}

.preview__icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--spacing-12), 1fr));
  gap: var(--preview-gap-sm);
}

.preview__icon-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background-color: var(--preview-card-bg);
  border: var(--preview-border-width) solid var(--preview-border-color);
}

.preview__icon-name {
  color: var(--preview-text-secondary);
  text-align: center;
}

.preview__chat-feed {
  display: flex;
  flex-direction: column;
  gap: var(--preview-gap-sm);
  align-items: flex-start;
}

.preview__hint {
  color: var(--preview-text-helper);
}
</style>
