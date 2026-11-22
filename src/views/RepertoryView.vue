<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AppShell } from '@/components/shell'
import DocumentCard from '@/components/repertory/DocumentCard.vue'
import heroRobotImg from '@/assets/images/2da21ad867bb41c5bb1b67c4a94cdda9ac4949e1.jpg'
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  DocumentForm,
  Icon,
  IconButton,
  Modal,
  RepertoryItemDetails,
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
  type RepertoryItemHistoryEntry,
  type RepertoryItemTag,
  type SelectOption,
  type TabOption,
  type TagFormPayload,
} from '@/components/ui'

type RepertoryTab = 'documents' | 'assets' | 'tags'
type RepertoryItemKind = 'document' | 'asset'
type DocumentFormat = 'PDF' | 'DOCX' | 'MD'
type AssetFormat = 'PNG' | 'JPG' | 'WEBP' | 'SVG'
type ItemTagModalTab = 'existing' | 'create'
type ConfirmTarget = 'tags' | null

interface RepertoryDocument {
  id: string
  title: string
  description: string
  status: 'publicado' | 'em revisão' | 'rascunho'
  format: DocumentFormat
  meta: string
  excerpt: string
  thumbnailUrl?: string
  tags: RepertoryItemTag[]
  history: RepertoryItemHistoryEntry[]
}

interface RepertoryAsset {
  id: string
  title: string
  description: string
  format: AssetFormat
  meta: string
  thumbnailUrl: string
  tags: RepertoryItemTag[]
  history: RepertoryItemHistoryEntry[]
}

interface RepertoryTag {
  id: string
  name: string
  category: string
  description: string
  documentsCount: number
  createdAt: string
}

type SvgThumbnailVariant = 'diagram' | 'grid' | 'brand' | 'contrast' | 'flow'

function createPrismonSvgDataUri(
  title: string,
  badge: string,
  variant: SvgThumbnailVariant,
): string {
  const safeTitle = title.replace(/[<>&"']/g, '')
  const safeBadge = badge.replace(/[<>&"']/g, '')

  const shapesByVariant: Record<SvgThumbnailVariant, string> = {
    diagram: `
      <rect x="44" y="48" width="128" height="72" fill="#1b181a" stroke="#f33ff0" stroke-width="2" />
      <rect x="228" y="48" width="128" height="72" fill="#1b181a" stroke="#4f4a4f" stroke-width="2" />
      <rect x="412" y="48" width="144" height="72" fill="#1b181a" stroke="#fb6af9" stroke-width="2" />
      <path d="M172 84 H228 M356 84 H412" stroke="#f33ff0" stroke-width="2" stroke-dasharray="4 4" />
      <circle cx="200" cy="84" r="4" fill="#f33ff0" />
      <circle cx="384" cy="84" r="4" fill="#fb6af9" />
    `,
    grid: `
      <g stroke="#353134" stroke-width="1">
        <line x1="48" y1="32" x2="48" y2="210" />
        <line x1="168" y1="32" x2="168" y2="210" />
        <line x1="288" y1="32" x2="288" y2="210" />
        <line x1="408" y1="32" x2="408" y2="210" />
        <line x1="528" y1="32" x2="528" y2="210" />
        <line x1="32" y1="64" x2="568" y2="64" />
        <line x1="32" y1="128" x2="568" y2="128" />
        <line x1="32" y1="192" x2="568" y2="192" />
      </g>
      <rect x="48" y="64" width="240" height="64" fill="#f33ff0" fill-opacity="0.18" stroke="#f33ff0" stroke-width="2" />
      <rect x="312" y="64" width="216" height="128" fill="#1b181a" stroke="#837c83" stroke-width="1.5" />
    `,
    brand: `
      <circle cx="460" cy="110" r="78" fill="#f33ff0" fill-opacity="0.22" />
      <circle cx="460" cy="110" r="46" fill="#fb6af9" fill-opacity="0.35" stroke="#fb6af9" stroke-width="2" />
      <rect x="44" y="54" width="280" height="16" fill="#ffffff" />
      <rect x="44" y="84" width="210" height="10" fill="#837c83" />
      <rect x="44" y="106" width="160" height="10" fill="#4f4a4f" />
    `,
    contrast: `
      <rect x="44" y="48" width="120" height="112" fill="#ffffff" />
      <rect x="176" y="48" width="120" height="112" fill="#f33ff0" />
      <rect x="308" y="48" width="120" height="112" fill="#353134" />
      <rect x="440" y="48" width="116" height="112" fill="#080708" stroke="#4f4a4f" stroke-width="1.5" />
      <text x="64" y="112" fill="#080708" font-family="sans-serif" font-size="18" font-weight="700">AA 18:1</text>
      <text x="198" y="112" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="700">BRAND</text>
    `,
    flow: `
      <path d="M48 160 C150 60, 240 180, 340 90 S480 60, 552 120" fill="none" stroke="#f33ff0" stroke-width="3" />
      <circle cx="48" cy="160" r="7" fill="#ffffff" stroke="#f33ff0" stroke-width="3" />
      <circle cx="216" cy="126" r="7" fill="#ffffff" stroke="#f33ff0" stroke-width="3" />
      <circle cx="386" cy="84" r="7" fill="#ffffff" stroke="#f33ff0" stroke-width="3" />
      <circle cx="552" cy="120" r="7" fill="#f33ff0" />
    `,
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" width="600" height="320">
      <rect width="600" height="320" fill="#080708" />
      <rect x="16" y="16" width="568" height="288" fill="#1b181a" stroke="#353134" stroke-width="1.5" />
      ${shapesByVariant[variant]}
      <rect x="44" y="236" width="68" height="24" rx="12" fill="#60065e" />
      <text x="78" y="252" text-anchor="middle" fill="#fde7fd" font-family="sans-serif" font-size="11" font-weight="600">${safeBadge}</text>
      <text x="128" y="253" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="600">${safeTitle}</text>
      <text x="44" y="282" fill="#b5b0b5" font-family="sans-serif" font-size="12">prismon media repertory</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const PAGE_SIZE = 5

const tabItems: TabOption[] = [
  { id: 'documents', label: 'documents' },
  { id: 'assets', label: 'assets' },
  { id: 'tags', label: 'tags' },
]

const itemTagTabOptions: TabOption[] = [
  { id: 'existing', label: 'vincular tag existente' },
  { id: 'create', label: 'criar nova tag' },
]

const activeTab = ref<RepertoryTab>('documents')

const documents = ref<RepertoryDocument[]>([
  {
    id: 'doc-1',
    title: 'Manual de Identidade Prismon',
    description:
      'Diretrizes visuais, uso de tipografia Funnel Display e Noto Sans, contrastes e regras de composição do ecossistema Prismon.',
    status: 'publicado',
    format: 'PDF',
    meta: 'PDF • 2,4 MB • 14 páginas',
    excerpt:
      '1. Princípios visuais\nA identidade Prismon equilibra superfícies neutras de alto contraste com acentos cromáticos pontuais (--interactive-brand). Títulos editoriais utilizam Funnel Display em caixa baixa; textos operacionais e tabelas utilizam Noto Sans para máxima legibilidade.',
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
    format: 'MD',
    meta: 'MD • 128 KB • 6 min de leitura',
    excerpt:
      '## Orquestração de agentes\nCada etapa do workflow recebe um contrato explícito de entrada e saída. Operações críticas (exclusão de repertório ou envio externo) exigem checkpoint de aprovação humana antes da execução final.',
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
    format: 'MD',
    meta: 'MD • 96 KB • 5 min de leitura',
    excerpt:
      '# Arquitetura de tokens\nNenhum componente consome cores hexadecimais ou tokens `--color-*` diretamente. Toda estilização deve expor variáveis `--<bloco>-*` apontando exclusivamente para tokens semânticos de superfície, texto, borda e movimento.',
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
    format: 'DOCX',
    meta: 'DOCX • 1,1 MB • 9 páginas',
    excerpt:
      'Template 04 — Síntese Executiva\nContexto: Atue como analista de governança do Prismon. Extraia riscos contratuais, prazos de renovação automática e obrigações de confidencialidade em tópicos objetivos.',
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
    format: 'PDF',
    meta: 'PDF • 1,8 MB • 11 páginas',
    excerpt:
      'Critério 2.4.7 — Foco visível\nTodos os controles interativos exibem `--shadow-focus-ring` em `:focus-visible`. Overlays (Modal, Sheet, Drawer) suportam fechamento via Escape e respeitam `prefers-reduced-motion: reduce`.',
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
    format: 'DOCX',
    meta: 'DOCX • 840 KB • 7 páginas',
    excerpt:
      '3. Taxonomia unificada\nDocumentos textuais (PDF, DOCX, MD) e ativos visuais (PNG, JPG, WEBP, SVG) compartilham o mesmo catálogo de tags, permitindo filtragem cruzada e rastreamento completo no histórico de modificações.',
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
    title: 'Ilustração Hero Robô Prismon',
    description:
      'Arte principal do assistente Prismon utilizada na página inicial, onboarding e apresentações institucionais de produto.',
    format: 'JPG',
    meta: 'JPG • 1376×768 px • 896 KB',
    thumbnailUrl: heroRobotImg,
    tags: [
      { id: 'at-1', label: 'marca' },
      { id: 'at-2', label: 'chatbot' },
      { id: 'at-3', label: 'diretrizes' },
    ],
    history: [
      {
        id: 'ah-1',
        title: 'Exportação final em alta resolução',
        summary: 'Versão otimizada para exibição hero em 16:9.',
        author: 'Ana Paula',
        date: '20 nov 2026',
      },
    ],
  },
  {
    id: 'asset-2',
    title: 'Diagrama de Arquitetura Multiagente',
    description:
      'Esquema vetorial ilustrando a troca de contexto entre o agente de triagem, o buscador semântico e o validador humano.',
    format: 'SVG',
    meta: 'SVG • 1200×640 px • 42 KB',
    thumbnailUrl: createPrismonSvgDataUri('Arquitetura Multiagente', 'SVG', 'diagram'),
    tags: [
      { id: 'at-4', label: 'workflows' },
      { id: 'at-5', label: 'arquitetura' },
      { id: 'at-6', label: 'agentes' },
    ],
    history: [
      {
        id: 'ah-2',
        title: 'Atualização dos nós de validação',
        summary: 'Ajustadas conexões pontilhadas e legenda de estados.',
        author: 'Mariana Costa',
        date: '19 nov 2026',
      },
    ],
  },
  {
    id: 'asset-3',
    title: 'Grid Editorial e Espaçamentos UI',
    description:
      'Prancha de referência demonstrando colunas responsivas, escala de espaçamentos e proporções de cards no repertório.',
    format: 'PNG',
    meta: 'PNG • 1920×1080 px • 1,4 MB',
    thumbnailUrl: createPrismonSvgDataUri('Grid Editorial UI', 'PNG', 'grid'),
    tags: [
      { id: 'at-7', label: 'design system' },
      { id: 'at-8', label: 'tokens' },
    ],
    history: [
      {
        id: 'ah-3',
        title: 'Publicação da prancha v2',
        summary: 'Incluídos breakpoints de 767px para adaptação mobile.',
        author: 'Lucas Andrade',
        date: '17 nov 2026',
      },
    ],
  },
  {
    id: 'asset-4',
    title: 'Capa Institucional Onboarding IA',
    description:
      'Banner leve em WebP para fluxos de boas-vindas e materiais de treinamento interno das equipes operacionais.',
    format: 'WEBP',
    meta: 'WEBP • 1600×900 px • 540 KB',
    thumbnailUrl: createPrismonSvgDataUri('Onboarding Prismon IA', 'WEBP', 'brand'),
    tags: [
      { id: 'at-9', label: 'marca' },
      { id: 'at-10', label: 'prompts' },
    ],
    history: [
      {
        id: 'ah-4',
        title: 'Conversão para WebP',
        summary: 'Redução de 48% no peso mantendo nitidez de borda.',
        author: 'Rafael Souza',
        date: '14 nov 2026',
      },
    ],
  },
  {
    id: 'asset-5',
    title: 'Paleta Semântica e Contrastes WCAG',
    description:
      'Guia visual de combinações aprovadas entre superfícies neutras, texto primário e destaque de marca.',
    format: 'SVG',
    meta: 'SVG • 960×540 px • 28 KB',
    thumbnailUrl: createPrismonSvgDataUri('Contrastes WCAG AA', 'SVG', 'contrast'),
    tags: [
      { id: 'at-11', label: 'acessibilidade' },
      { id: 'at-12', label: 'tokens' },
      { id: 'at-13', label: 'design system' },
    ],
    history: [
      {
        id: 'ah-5',
        title: 'Validação de contraste 18:1',
        summary: 'Aprovado em auditoria interna de acessibilidade.',
        author: 'Clara Mendes',
        date: '11 nov 2026',
      },
    ],
  },
  {
    id: 'asset-6',
    title: 'Fluxo Visual de Triagem Documental',
    description:
      'Representação gráfica das etapas de ingestão, indexação vetorial e revisão de tags no repertório corporativo.',
    format: 'PNG',
    meta: 'PNG • 1440×810 px • 1,1 MB',
    thumbnailUrl: createPrismonSvgDataUri('Triagem Documental', 'PNG', 'flow'),
    tags: [
      { id: 'at-14', label: 'workflows' },
      { id: 'at-15', label: 'repertório' },
      { id: 'at-16', label: 'automação' },
    ],
    history: [
      {
        id: 'ah-6',
        title: 'Revisão com time de produto',
        summary: 'Simplificados rótulos das etapas intermediárias.',
        author: 'Ana Paula',
        date: '09 nov 2026',
      },
    ],
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

const isNewDocModalOpen = ref(false)
const newDocTitleError = ref('')

// Assets tab filters & modals
const assetSearch = ref('')
const selectedAssetTagFilter = ref('')
const selectedAssetFormatFilter = ref('')
const activeAssetTagFilters = ref<string[]>([])

const isNewAssetModalOpen = ref(false)
const newAssetTitleError = ref('')

// Shared Details Sheet & Item Tag modal
const isDetailsSheetOpen = ref(false)
const activeItemId = ref<string | null>(null)
const activeItemKind = ref<RepertoryItemKind>('document')

const isItemTagModalOpen = ref(false)
const itemTagModalTab = ref<ItemTagModalTab>('existing')
const selectedExistingTagName = ref('')
const existingTagSelectError = ref('')
const itemTagNameError = ref('')

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

function collectUniqueTagOptions(items: Array<{ tags: RepertoryItemTag[] }>): SelectOption[] {
  const uniqueLabels = new Set<string>()
  for (const tag of tagsList.value) {
    uniqueLabels.add(tag.name)
  }
  for (const item of items) {
    for (const tag of item.tags) {
      uniqueLabels.add(tag.label)
    }
  }
  return Array.from(uniqueLabels)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((label) => ({ label, value: label }))
}

const tagFilterOptions = computed<SelectOption[]>(() => collectUniqueTagOptions(documents.value))

const assetTagFilterOptions = computed<SelectOption[]>(() => collectUniqueTagOptions(assets.value))

const statusFilterOptions: SelectOption[] = [
  { label: 'todos os status', value: 'todos' },
  { label: 'publicado', value: 'publicado' },
  { label: 'em revisão', value: 'em revisão' },
  { label: 'rascunho', value: 'rascunho' },
]

const assetFormatFilterOptions: SelectOption[] = [
  { label: 'todos os formatos', value: 'todos' },
  { label: 'PNG', value: 'PNG' },
  { label: 'JPG', value: 'JPG' },
  { label: 'WEBP', value: 'WEBP' },
  { label: 'SVG', value: 'SVG' },
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

const hasActiveAssetFilters = computed(
  () =>
    assetSearch.value.trim().length > 0 ||
    activeAssetTagFilters.value.length > 0 ||
    (selectedAssetFormatFilter.value !== '' && selectedAssetFormatFilter.value !== 'todos'),
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

const filteredAssets = computed(() => {
  const query = assetSearch.value.trim().toLowerCase()
  const format = selectedAssetFormatFilter.value

  return assets.value.filter((asset) => {
    if (query.length > 0) {
      const matchesTitle = asset.title.toLowerCase().includes(query)
      const matchesDescription = asset.description.toLowerCase().includes(query)
      if (!matchesTitle && !matchesDescription) {
        return false
      }
    }

    if (format && format !== 'todos' && asset.format !== format) {
      return false
    }

    if (activeAssetTagFilters.value.length > 0) {
      const assetTagLabels = new Set(asset.tags.map((t) => t.label.toLowerCase()))
      const matchesAllTags = activeAssetTagFilters.value.every((filterTag) =>
        assetTagLabels.has(filterTag.toLowerCase()),
      )
      if (!matchesAllTags) {
        return false
      }
    }

    return true
  })
})

const activeDocument = computed(() =>
  activeItemKind.value === 'document'
    ? (documents.value.find((doc) => doc.id === activeItemId.value) ?? null)
    : null,
)

const activeAsset = computed(() =>
  activeItemKind.value === 'asset'
    ? (assets.value.find((asset) => asset.id === activeItemId.value) ?? null)
    : null,
)

const activeItem = computed(() => activeAsset.value ?? activeDocument.value)

const availableTagOptionsForActiveItem = computed<SelectOption[]>(() => {
  const item = activeItem.value
  const linkedLabels = new Set((item?.tags ?? []).map((t) => t.label.toLowerCase()))

  return tagsList.value
    .filter((tag) => !linkedLabels.has(tag.name.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map((tag) => ({ label: tag.name, value: tag.name }))
})

const totalTagPages = computed(() => Math.max(1, Math.ceil(tagsList.value.length / PAGE_SIZE)))

const paginatedTagRows = computed(() => {
  const start = (tagPage.value - 1) * PAGE_SIZE
  return tagsList.value.slice(start, start + PAGE_SIZE) as unknown as Record<string, unknown>[]
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

function addAssetTagFilter(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return
  }
  if (!activeAssetTagFilters.value.includes(trimmed)) {
    activeAssetTagFilters.value = [...activeAssetTagFilters.value, trimmed]
  }
  selectedAssetTagFilter.value = ''
}

function removeAssetTagFilter(tagLabel: string) {
  activeAssetTagFilters.value = activeAssetTagFilters.value.filter((item) => item !== tagLabel)
}

function clearAssetFilters() {
  assetSearch.value = ''
  selectedAssetTagFilter.value = ''
  selectedAssetFormatFilter.value = ''
  activeAssetTagFilters.value = []
}

function openDocumentDetails(docId: string) {
  activeItemKind.value = 'document'
  activeItemId.value = docId
  isDetailsSheetOpen.value = true
}

function openAssetDetails(assetId: string) {
  activeItemKind.value = 'asset'
  activeItemId.value = assetId
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

function handleDownloadAsset(assetId: string) {
  const target = assets.value.find((asset) => asset.id === assetId)
  toast.info(
    target
      ? `Download de "${target.title}" iniciado (demonstração).`
      : 'Download iniciado (demonstração).',
  )
}

function handleDownloadActiveItem() {
  if (!activeItem.value) {
    return
  }
  if (activeItemKind.value === 'asset') {
    handleDownloadAsset(activeItem.value.id)
    return
  }
  handleDownloadDocument(activeItem.value.id)
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function inferDocumentFormat(fileName?: string): DocumentFormat {
  const lower = (fileName ?? '').toLowerCase()
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'MD'
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'DOCX'
  return 'PDF'
}

function inferAssetFormat(fileName?: string): AssetFormat {
  const lower = (fileName ?? '').toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'JPG'
  if (lower.endsWith('.webp')) return 'WEBP'
  if (lower.endsWith('.svg')) return 'SVG'
  return 'PNG'
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

  const description =
    payload.description.trim() || 'Documento adicionado ao repertório local do Prismon.'
  const attachedFile = payload.files[0]
  const format = inferDocumentFormat(attachedFile?.name)
  const sizeLabel = formatFileSize(attachedFile?.size || 327680)
  const fileInfo = attachedFile ? `Arquivo anexado: ${attachedFile.name}` : 'Criado manualmente.'

  const newDoc: RepertoryDocument = {
    id: `doc-${Date.now()}`,
    title: cleanTitle,
    description,
    status: 'rascunho',
    format,
    meta: `${format} • ${sizeLabel} • recém-adicionado`,
    excerpt: description,
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

function openNewAssetModal() {
  newAssetTitleError.value = ''
  isNewAssetModalOpen.value = true
}

function handleCreateAsset(payload: DocumentFormPayload) {
  const cleanTitle = payload.title.trim()
  if (!cleanTitle) {
    newAssetTitleError.value = 'Informe um título para o asset.'
    return
  }

  const description =
    payload.description.trim() || 'Mídia visual cadastrada no repertório local do Prismon.'
  const attachedFile = payload.files[0]
  const format = inferAssetFormat(attachedFile?.name)
  const sizeLabel = formatFileSize(attachedFile?.size || 460800)
  const fileInfo = attachedFile ? `Arquivo anexado: ${attachedFile.name}` : 'Cadastro manual.'

  let thumbnailUrl = createPrismonSvgDataUri(cleanTitle, format, 'brand')
  if (attachedFile && typeof URL.createObjectURL === 'function') {
    try {
      thumbnailUrl = URL.createObjectURL(attachedFile)
    } catch {
      thumbnailUrl = createPrismonSvgDataUri(cleanTitle, format, 'brand')
    }
  }

  const newAsset: RepertoryAsset = {
    id: `asset-${Date.now()}`,
    title: cleanTitle,
    description,
    format,
    meta: `${format} • 1280×720 px • ${sizeLabel}`,
    thumbnailUrl,
    tags: [{ id: `asset-tag-${Date.now()}`, label: 'mídia' }],
    history: [
      {
        id: `ahist-${Date.now()}`,
        title: 'Asset cadastrado',
        summary: fileInfo,
        author: 'Ana Paula',
        date: 'Agora',
      },
    ],
  }

  assets.value = [newAsset, ...assets.value]
  isNewAssetModalOpen.value = false
  newAssetTitleError.value = ''
  toast.success(`Asset "${cleanTitle}" adicionado ao repertório.`)
}

function openAddTagToItemModal() {
  itemTagNameError.value = ''
  existingTagSelectError.value = ''
  selectedExistingTagName.value = ''
  itemTagModalTab.value = availableTagOptionsForActiveItem.value.length > 0 ? 'existing' : 'create'
  isItemTagModalOpen.value = true
}

function linkTagToActiveItem(tagName: string, summary: string, createCatalogDescription?: string) {
  const item = activeItem.value
  if (!item) {
    return false
  }

  const cleanName = tagName.trim()
  const alreadyHasTag = item.tags.some((tag) => tag.label.toLowerCase() === cleanName.toLowerCase())
  if (alreadyHasTag) {
    return false
  }

  const newTag: RepertoryItemTag = {
    id: `item-tag-${Date.now()}`,
    label: cleanName,
  }
  item.tags = [...item.tags, newTag]
  item.history = [
    {
      id: `hist-${Date.now()}`,
      title: `Tag "${cleanName}" adicionada`,
      summary,
      author: 'Ana Paula',
      date: 'Agora',
    },
    ...item.history,
  ]

  const existingCatalogTag = tagsList.value.find(
    (catalogTag) => catalogTag.name.toLowerCase() === cleanName.toLowerCase(),
  )
  if (existingCatalogTag) {
    existingCatalogTag.documentsCount += 1
  } else {
    tagsList.value = [
      {
        id: `tag-${Date.now()}`,
        name: cleanName,
        category: 'Geral',
        description:
          createCatalogDescription?.trim() || 'Tag criada a partir dos detalhes do repertório.',
        documentsCount: 1,
        createdAt: 'Agora',
      },
      ...tagsList.value,
    ]
  }

  const kindLabel = activeItemKind.value === 'asset' ? 'asset' : 'documento'
  isItemTagModalOpen.value = false
  itemTagNameError.value = ''
  existingTagSelectError.value = ''
  selectedExistingTagName.value = ''
  toast.success(`Tag "${cleanName}" vinculada ao ${kindLabel}.`)
  return true
}

function handleLinkExistingTagToItem() {
  const chosen = selectedExistingTagName.value.trim()
  if (!chosen) {
    existingTagSelectError.value = 'Selecione uma tag cadastrada para vincular.'
    return
  }

  const kindLabel = activeItemKind.value === 'asset' ? 'asset' : 'documento'
  const linked = linkTagToActiveItem(
    chosen,
    `Tag existente vinculada nos detalhes do ${kindLabel}.`,
  )
  if (!linked) {
    existingTagSelectError.value = `Esta tag já está vinculada ao ${kindLabel}.`
  }
}

function handleCreateAndLinkTagToItem(payload: TagFormPayload) {
  const cleanName = payload.name.trim()
  if (!cleanName) {
    itemTagNameError.value = 'Informe o nome da tag.'
    return
  }

  const kindLabel = activeItemKind.value === 'asset' ? 'asset' : 'documento'
  const linked = linkTagToActiveItem(
    cleanName,
    payload.description.trim() || `Rótulo criado e vinculado nos detalhes do ${kindLabel}.`,
    payload.description,
  )
  if (!linked) {
    itemTagNameError.value = `Esta tag já está vinculada ao ${kindLabel}.`
  }
}

function handleRemoveItemTag(
  tagId: string,
  explicitKind?: RepertoryItemKind,
  explicitItemId?: string,
) {
  const kind = explicitKind ?? activeItemKind.value
  const targetId = explicitItemId ?? activeItemId.value
  const targetItem =
    kind === 'asset'
      ? assets.value.find((item) => item.id === targetId)
      : documents.value.find((item) => item.id === targetId)

  if (!targetItem) {
    return
  }

  const removed = targetItem.tags.find((tag) => tag.id === tagId)
  targetItem.tags = targetItem.tags.filter((tag) => tag.id !== tagId)
  if (removed) {
    const kindLabel = kind === 'asset' ? 'asset' : 'documento'
    targetItem.history = [
      {
        id: `hist-${Date.now()}`,
        title: `Tag "${removed.label}" removida`,
        summary: `Rótulo desvinculado do ${kindLabel}.`,
        author: 'Ana Paula',
        date: 'Agora',
      },
      ...targetItem.history,
    ]
    toast.success(`Tag "${removed.label}" removida do ${kindLabel}.`)
  }
}

function toggleTagSelection(rowKey: string | number) {
  selectedTagKeys.value = selectedTagKeys.value.includes(rowKey)
    ? selectedTagKeys.value.filter((item) => item !== rowKey)
    : [...selectedTagKeys.value, rowKey]
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
            :format="doc.format"
            :status="doc.status"
            tags-aria-label="Tags do documento"
            @select="openDocumentDetails"
            @download="handleDownloadDocument"
            @remove-tag="(docId, tagId) => handleRemoveItemTag(tagId, 'document', docId)"
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
        <div class="repertory-view__filters-header">
          <h2 class="repertory-view__section-title">filtros</h2>
          <Button variant="primary" size="md" icon="upload" @click="openNewAssetModal">
            novo asset
          </Button>
        </div>

        <div class="repertory-view__controls">
          <div class="repertory-view__control repertory-view__control--search">
            <SearchInput
              v-model="assetSearch"
              placeholder="Título do asset"
              aria-label="Buscar asset por título"
            />
          </div>

          <div class="repertory-view__control repertory-view__control--select">
            <Select
              v-model="selectedAssetTagFilter"
              :options="assetTagFilterOptions"
              placeholder="selecione as tags"
              aria-label="Filtrar asset por tag"
              @change="addAssetTagFilter"
            />
          </div>

          <div class="repertory-view__control repertory-view__control--select">
            <Select
              v-model="selectedAssetFormatFilter"
              :options="assetFormatFilterOptions"
              placeholder="formato"
              aria-label="Filtrar asset por formato"
            />
          </div>
        </div>

        <div
          v-if="activeAssetTagFilters.length > 0 || hasActiveAssetFilters"
          class="repertory-view__active-filters"
        >
          <Tag
            v-for="tagLabel in activeAssetTagFilters"
            :key="tagLabel"
            :label="tagLabel"
            :dismissible="true"
            :dismiss-label="`Remover filtro ${tagLabel}`"
            @dismiss="removeAssetTagFilter(tagLabel)"
          />
          <Button v-if="hasActiveAssetFilters" variant="ghost" size="sm" @click="clearAssetFilters">
            limpar filtros
          </Button>
        </div>

        <div v-if="filteredAssets.length > 0" class="repertory-view__grid">
          <DocumentCard
            v-for="asset in filteredAssets"
            :id="asset.id"
            :key="asset.id"
            :title="asset.title"
            :description="asset.description"
            :tags="asset.tags"
            :thumbnail-url="asset.thumbnailUrl"
            :format="asset.format"
            tags-aria-label="Tags do asset"
            @select="openAssetDetails"
            @download="handleDownloadAsset"
            @remove-tag="(assetId, tagId) => handleRemoveItemTag(tagId, 'asset', assetId)"
          />
        </div>

        <div v-else class="repertory-view__empty" role="status">
          <Icon name="attachment" size="2xl" color="helper" />
          <div class="repertory-view__empty-copy">
            <h3 class="repertory-view__empty-title">nenhum asset encontrado</h3>
            <p class="repertory-view__empty-description">
              Ajuste os termos de busca ou remova os filtros aplicados para visualizar os assets.
            </p>
          </div>
          <Button variant="tertiary" size="md" @click="clearAssetFilters">limpar filtros</Button>
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

    <!-- Sheet Detalhes do Item (Documento ou Asset) -->
    <Sheet
      v-model:open="isDetailsSheetOpen"
      size="md"
      :title="activeItemKind === 'asset' ? 'detalhes do asset' : 'detalhes do documento'"
    >
      <template #preview>
        <div
          v-if="activeItem"
          :class="[
            'repertory-view__preview-stage',
            activeItemKind === 'asset'
              ? 'repertory-view__preview-stage--asset'
              : 'repertory-view__preview-stage--document',
          ]"
        >
          <template v-if="activeItemKind === 'asset' && activeAsset">
            <img
              :src="activeAsset.thumbnailUrl"
              :alt="`Pré-visualização de ${activeAsset.title}`"
              class="repertory-view__preview-image"
            />
            <footer class="repertory-view__preview-footer">
              <div class="repertory-view__preview-footer-left">
                <Badge :label="activeAsset.format" />
                <span class="repertory-view__preview-title">{{ activeAsset.title }}</span>
              </div>
              <span class="repertory-view__preview-meta">{{ activeAsset.meta }}</span>
            </footer>
          </template>

          <template v-else-if="activeDocument">
            <header class="repertory-view__preview-doc-header">
              <div class="repertory-view__preview-footer-left">
                <Icon name="documents" size="md" color="helper" />
                <span class="repertory-view__preview-title">{{ activeDocument.title }}</span>
              </div>
              <div class="repertory-view__preview-doc-badges">
                <span class="repertory-view__preview-meta">{{ activeDocument.meta }}</span>
                <Badge :label="activeDocument.format" />
              </div>
            </header>
            <div class="repertory-view__preview-doc-body">
              <p class="repertory-view__preview-excerpt">{{ activeDocument.excerpt }}</p>
              <p class="repertory-view__preview-doc-note">{{ activeDocument.description }}</p>
            </div>
          </template>
        </div>
      </template>

      <div v-if="activeItem" class="repertory-view__sheet-content">
        <RepertoryItemDetails
          :title="activeItem.title"
          :description="activeItem.description"
          :tags="activeItem.tags"
          :history="activeItem.history"
          :editable-tags="true"
          :show-add-tag="true"
          @add-tag="openAddTagToItemModal"
          @remove-tag="(tagId) => handleRemoveItemTag(tagId)"
        >
          <template #header-actions>
            <IconButton
              variant="ghost"
              size="sm"
              icon="download"
              :ariaLabel="`Baixar ${activeItem.title}`"
              @click="handleDownloadActiveItem"
            />
          </template>
        </RepertoryItemDetails>
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
        accept=".pdf,.doc,.docx,.md,.markdown"
        file-label="Suba seu documento (PDF, DOCX, MD)"
        file-hint="PDF, DOCX ou Markdown até 10mb"
        title-placeholder="Ex.: Manual de Governança IA"
        :title-error="newDocTitleError"
        @update:title="newDocTitleError = ''"
        @submit="handleCreateDocument"
        @cancel="isNewDocModalOpen = false"
      />
    </Modal>

    <!-- Modal Novo Asset -->
    <Modal
      v-model:open="isNewAssetModalOpen"
      size="lg"
      title="novo asset"
      subtitle="Adicione uma imagem ou mídia visual ao repertório local."
    >
      <DocumentForm
        v-if="isNewAssetModalOpen"
        accept=".png,.jpg,.jpeg,.webp,.svg,image/*"
        file-label="Suba seu asset (PNG, JPG, WEBP, SVG)"
        file-hint="PNG, JPG, WEBP ou SVG até 10mb"
        title-placeholder="Ex.: Ilustração Hero Prismon"
        description-placeholder="Descreva onde esta mídia é utilizada no ecossistema Prismon."
        :title-error="newAssetTitleError"
        @update:title="newAssetTitleError = ''"
        @submit="handleCreateAsset"
        @cancel="isNewAssetModalOpen = false"
      />
    </Modal>

    <!-- Modal Adicionar Tag ao Item (Vincular existente ou Criar nova) -->
    <Modal
      v-model:open="isItemTagModalOpen"
      size="lg"
      title="adicionar tag"
      subtitle="Vincule uma tag existente ou crie um novo rótulo para este item."
    >
      <div v-if="isItemTagModalOpen" class="repertory-view__tag-modal">
        <div class="repertory-view__tag-modal-tabs">
          <Tabs
            v-model="itemTagModalTab"
            :items="itemTagTabOptions"
            aria-label="Opções para adicionar tag"
          />
        </div>

        <form
          v-if="itemTagModalTab === 'existing'"
          class="repertory-view__existing-tag-form"
          @submit.prevent="handleLinkExistingTagToItem"
        >
          <template v-if="availableTagOptionsForActiveItem.length > 0">
            <Select
              v-model="selectedExistingTagName"
              label="Tag cadastrada"
              placeholder="selecione uma tag"
              :options="availableTagOptionsForActiveItem"
              :error="existingTagSelectError"
              aria-label="Selecionar tag existente"
              @update:model-value="existingTagSelectError = ''"
            />

            <div class="repertory-view__tag-modal-actions">
              <Button variant="tertiary" @click="isItemTagModalOpen = false"> Cancelar </Button>
              <Button type="submit" variant="primary">Vincular tag</Button>
            </div>
          </template>

          <div v-else class="repertory-view__empty" role="status">
            <Icon name="tag" size="xl" color="helper" />
            <div class="repertory-view__empty-copy">
              <h3 class="repertory-view__empty-title">todas as tags já vinculadas</h3>
              <p class="repertory-view__empty-description">
                Todas as tags cadastradas já fazem parte deste item. Crie uma nova tag na aba ao
                lado.
              </p>
            </div>
            <Button variant="tertiary" size="md" @click="itemTagModalTab = 'create'">
              criar nova tag
            </Button>
          </div>
        </form>

        <TagForm
          v-else
          :name-error="itemTagNameError"
          @update:name="itemTagNameError = ''"
          @submit="handleCreateAndLinkTagToItem"
          @cancel="isItemTagModalOpen = false"
        />
      </div>
    </Modal>

    <!-- Modal Nova Tag -->
    <Modal v-model:open="isNewTagModalOpen" size="lg" title="nova tag">
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
.repertory-view__subheader {
  --repertory-view-subheader-padding-top: var(--spacing-3);
  --repertory-view-subheader-padding-x: var(--spacing-6);
  --repertory-view-subheader-padding-bottom: var(--spacing-0);
  --repertory-view-subheader-reset-spacing: var(--spacing-0);

  display: flex;
  align-items: stretch;
  width: 100%;
  min-width: var(--repertory-view-subheader-reset-spacing);
  padding: var(--repertory-view-subheader-padding-top) var(--repertory-view-subheader-padding-x)
    var(--repertory-view-subheader-padding-bottom);
  box-sizing: border-box;
}

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
  --repertory-view-modal-gap: var(--spacing-5);
  --repertory-view-reset-spacing: var(--spacing-0);

  display: flex;
  flex-direction: column;
  width: 100%;
  padding: var(--repertory-view-padding-y) var(--repertory-view-padding-x);
  box-sizing: border-box;
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

.repertory-view__preview-stage {
  --repertory-preview-bg: var(--surface-elevated);
  --repertory-preview-doc-bg: var(--surface-subtle);
  --repertory-preview-placeholder-bg: var(--surface-placeholder);
  --repertory-preview-border-color: var(--border-subtle-1);
  --repertory-preview-border-width: var(--border-width-thin);
  --repertory-preview-padding: var(--spacing-5);
  --repertory-preview-gap: var(--spacing-4);
  --repertory-preview-title-color: var(--text-primary);
  --repertory-preview-title-font-family: var(--type-heading-02-font-family);
  --repertory-preview-title-font-size: var(--type-heading-02-font-size);
  --repertory-preview-title-line-height: var(--type-heading-02-line-height);
  --repertory-preview-title-font-weight: var(--type-heading-02-font-weight);
  --repertory-preview-meta-color: var(--text-helper);
  --repertory-preview-meta-font-family: var(--type-label-01-font-family);
  --repertory-preview-meta-font-size: var(--type-label-01-font-size);
  --repertory-preview-meta-line-height: var(--type-label-01-line-height);
  --repertory-preview-meta-font-weight: var(--type-label-01-font-weight);
  --repertory-preview-body-color: var(--text-secondary);
  --repertory-preview-body-font-family: var(--type-body-02-font-family);
  --repertory-preview-body-font-size: var(--type-body-02-font-size);
  --repertory-preview-body-line-height: var(--type-body-02-line-height);
  --repertory-preview-body-font-weight: var(--type-body-02-font-weight);

  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--repertory-preview-bg);
  border: var(--repertory-preview-border-width) solid var(--repertory-preview-border-color);
  box-sizing: border-box;
  overflow: hidden;
}

.repertory-view__preview-image {
  display: block;
  width: 100%;
  max-height: min(62dvh, 480px);
  object-fit: cover;
  background-color: var(--repertory-preview-placeholder-bg);
}

.repertory-view__preview-footer,
.repertory-view__preview-doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--repertory-preview-gap);
  padding: var(--spacing-4) var(--repertory-preview-padding);
  background-color: var(--repertory-preview-bg);
}

.repertory-view__preview-footer {
  border-top: var(--repertory-preview-border-width) solid var(--repertory-preview-border-color);
}

.repertory-view__preview-doc-header {
  border-bottom: var(--repertory-preview-border-width) solid var(--repertory-preview-border-color);
}

.repertory-view__preview-footer-left,
.repertory-view__preview-doc-badges {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: var(--spacing-0);
}

.repertory-view__preview-title {
  color: var(--repertory-preview-title-color);
  font-family: var(--repertory-preview-title-font-family);
  font-size: var(--repertory-preview-title-font-size);
  line-height: var(--repertory-preview-title-line-height);
  font-weight: var(--repertory-preview-title-font-weight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repertory-view__preview-meta {
  color: var(--repertory-preview-meta-color);
  font-family: var(--repertory-preview-meta-font-family);
  font-size: var(--repertory-preview-meta-font-size);
  line-height: var(--repertory-preview-meta-line-height);
  font-weight: var(--repertory-preview-meta-font-weight);
}

.repertory-view__preview-doc-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-6) var(--repertory-preview-padding);
  min-height: 280px;
  max-height: min(62dvh, 480px);
  overflow-y: auto;
  background-color: var(--repertory-preview-doc-bg);
}

.repertory-view__preview-excerpt,
.repertory-view__preview-doc-note {
  margin: var(--repertory-view-reset-spacing);
  color: var(--repertory-preview-body-color);
  font-family: var(--repertory-preview-body-font-family);
  font-size: var(--repertory-preview-body-font-size);
  line-height: var(--repertory-preview-body-line-height);
  font-weight: var(--repertory-preview-body-font-weight);
  white-space: pre-line;
}

.repertory-view__preview-doc-note {
  color: var(--repertory-preview-meta-color);
}

.repertory-view__tag-modal {
  --repertory-view-tag-modal-gap: var(--spacing-5);
  --repertory-view-tag-modal-border-color: var(--border-subtle-1);
  --repertory-view-tag-modal-border-width: var(--border-width-thin);
  --repertory-view-tag-modal-actions-gap: var(--spacing-3);

  display: flex;
  flex-direction: column;
  gap: var(--repertory-view-tag-modal-gap);
  width: 100%;
}

.repertory-view__tag-modal-tabs {
  display: flex;
  border-bottom: var(--repertory-view-tag-modal-border-width) solid
    var(--repertory-view-tag-modal-border-color);
}

.repertory-view__existing-tag-form {
  display: flex;
  flex-direction: column;
  gap: var(--repertory-view-tag-modal-gap);
}

.repertory-view__tag-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--repertory-view-tag-modal-actions-gap);
}

@media (max-width: 767px) {
  .repertory-view__subheader {
    --repertory-view-subheader-padding-top: var(--spacing-2);
    --repertory-view-subheader-padding-x: var(--spacing-4);
  }

  .repertory-view {
    padding: var(--repertory-view-mobile-padding-y) var(--repertory-view-mobile-padding-x);
  }

  .repertory-view__control--search,
  .repertory-view__control--select {
    flex: 1 1 100%;
  }
}
</style>
