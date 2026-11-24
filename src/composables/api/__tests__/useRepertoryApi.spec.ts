import { AxiosError, AxiosHeaders } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient, resolveApiUrl, uploadFileToPresignedUrl } from '@/api/client'
import { ApiRequestError } from '@/api/errors'
import type {
  AssetSchema,
  AssetUploadSchema,
  DocumentSchema,
  DocumentUploadSchema,
  ResourceEventSchema,
  TagSchema,
} from '@/api/types/repertory'
import { useRepertoryApi } from '@/composables/api/useRepertoryApi'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    post: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    put: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  },
  uploadFileToPresignedUrl: vi.fn<(...args: unknown[]) => Promise<void>>(),
  resolveApiUrl: vi.fn<(path: string) => string>(
    (path: string) => `/api${path.startsWith('/') ? path : `/${path}`}`,
  ),
}))

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)
const mockedPut = vi.mocked(apiClient.put)
const mockedDelete = vi.mocked(apiClient.delete)
const mockedUpload = vi.mocked(uploadFileToPresignedUrl)
const mockedResolveApiUrl = vi.mocked(resolveApiUrl)

function makeTagDto(overrides: Partial<TagSchema> = {}): TagSchema {
  return {
    id: 10,
    project_id: 12,
    label: 'Jurídico',
    description: 'Documentos contratuais e pareceres',
    color: '#F33FF0',
    ...overrides,
  }
}

function makeDocumentDto(overrides: Partial<DocumentSchema> = {}): DocumentSchema {
  return {
    id: 44,
    project_id: 12,
    file: 'projects/12/documents/44/contrato-q4.pdf',
    file_extension: 'pdf',
    content_type: 'application/pdf',
    created_by_member_id: 3,
    name: 'Contrato Fornecedor Q4',
    description: 'Cláusulas revisadas de SLA',
    status: 'published',
    created_at: '2026-11-22T12:00:00Z',
    updated_at: '2026-11-22T15:30:00Z',
    tags: [makeTagDto()],
    ...overrides,
  }
}

function makeAssetDto(overrides: Partial<AssetSchema> = {}): AssetSchema {
  return {
    id: 8,
    project_id: 12,
    created_by_member_id: 5,
    file: 'projects/12/assets/8/brand-mark.png',
    name: 'Brand Mark Dark',
    file_extension: null,
    content_type: 'image/png',
    type: 'image',
    description: 'Logo principal do workspace',
    status: 'active',
    created_at: '2026-11-20T09:00:00Z',
    updated_at: '2026-11-21T10:00:00Z',
    tags: [makeTagDto({ id: 2, label: 'Marca', color: '#22C55E' })],
    ...overrides,
  }
}

function createAxiosError(status: number, data: unknown): AxiosError {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  })
}

describe('useRepertoryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('documents', () => {
    it('lists documents with cleaned query params and maps DTOs to domain models', async () => {
      const dto = makeDocumentDto({ status: 'pending', description: null })
      mockedGet.mockResolvedValueOnce({
        data: {
          items: [dto],
          limit: 20,
          more: true,
          cursor: 'next-cursor-1',
        },
      })

      const api = useRepertoryApi()
      const page = await api.listDocuments(12, {
        name: 'Contrato',
        status: null,
        cursor: undefined,
        limit: 20,
      })

      expect(mockedGet).toHaveBeenCalledWith('/projects/12/documents', {
        params: { name: 'Contrato', limit: 20 },
      })
      expect(page).toEqual({
        items: [
          {
            id: 44,
            projectId: 12,
            title: 'Contrato Fornecedor Q4',
            description: '',
            status: 'pending',
            statusLabel: 'Pendente',
            format: 'PDF',
            contentType: 'application/pdf',
            filePath: 'projects/12/documents/44/contrato-q4.pdf',
            fileExtension: 'pdf',
            createdAt: '2026-11-22T12:00:00Z',
            updatedAt: '2026-11-22T15:30:00Z',
            createdAtLabel: expect.any(String),
            tags: [{ id: 10, label: 'Jurídico', color: '#F33FF0' }],
          },
        ],
        limit: 20,
        hasMore: true,
        nextCursor: 'next-cursor-1',
      })
      expect(page.items[0]?.createdAtLabel).not.toBe('—')
    })

    it('performs 2-step document creation and forwards exact presigned upload arguments', async () => {
      const file = new File(['%PDF-1.4'], 'manual-seguranca.pdf', {
        type: 'application/pdf',
      })
      const uploadResponse: DocumentUploadSchema = {
        ...makeDocumentDto({
          id: 99,
          name: 'Manual de Segurança',
          status: 'uploading',
          tags: [],
        }),
        upload_url: 'https://storage.example.com/presigned/doc-99',
        method: 'PUT',
        required_headers: {
          'x-amz-acl': 'private',
          'Content-Type': 'application/pdf',
        },
        expires_at: '2026-11-22T23:59:59Z',
      }
      mockedPost.mockResolvedValueOnce({ data: uploadResponse })
      mockedUpload.mockResolvedValueOnce(undefined)

      const api = useRepertoryApi()
      const created = await api.createDocument(12, {
        name: 'Manual de Segurança',
        description: 'Política interna',
        file,
      })

      expect(mockedPost).toHaveBeenCalledWith('/projects/12/documents', {
        name: 'Manual de Segurança',
        original_filename: 'manual-seguranca.pdf',
        description: 'Política interna',
        content_type: 'application/pdf',
      })
      expect(mockedUpload).toHaveBeenCalledTimes(1)
      expect(mockedUpload).toHaveBeenCalledWith(
        uploadResponse.upload_url,
        file,
        uploadResponse.method,
        uploadResponse.required_headers,
      )
      expect(created.id).toBe(99)
      expect(created.status).toBe('uploading')
      expect(created.statusLabel).toBe('Enviando')
    })

    it('performs 2-step document file replacement with optional metadata', async () => {
      const file = new File(['# v2'], 'especificacao-v2.md', {
        type: 'text/markdown',
      })
      const uploadResponse: DocumentUploadSchema = {
        ...makeDocumentDto({
          id: 44,
          name: 'Especificação v2',
          file_extension: 'md',
          content_type: 'text/markdown',
          status: 'draft',
        }),
        upload_url: 'https://storage.example.com/presigned/replace-doc-44',
        method: 'POST',
        required_headers: { 'x-upload-token': 'abc-123' },
        expires_at: '2026-11-23T01:00:00Z',
      }
      mockedPost.mockResolvedValueOnce({ data: uploadResponse })
      mockedUpload.mockResolvedValueOnce(undefined)

      const api = useRepertoryApi()
      const updated = await api.replaceDocumentFile(12, 44, file, {
        name: 'Especificação v2',
      })

      expect(mockedPost).toHaveBeenCalledWith('/projects/12/documents/44/uploads', {
        original_filename: 'especificacao-v2.md',
        content_type: 'text/markdown',
        name: 'Especificação v2',
      })
      expect(mockedUpload).toHaveBeenCalledWith(
        uploadResponse.upload_url,
        file,
        uploadResponse.method,
        uploadResponse.required_headers,
      )
      expect(updated.title).toBe('Especificação v2')
      expect(updated.format).toBe('MD')
      expect(updated.statusLabel).toBe('Rascunho')
    })

    it('updates and deletes a document', async () => {
      mockedPut.mockResolvedValueOnce({
        data: makeDocumentDto({ name: 'Novo Título', status: 'archived' }),
      })
      mockedDelete.mockResolvedValueOnce({ data: undefined })

      const api = useRepertoryApi()
      const updated = await api.updateDocument(12, 44, {
        name: 'Novo Título',
        description: null,
      })
      await api.deleteDocument(12, 44)

      expect(mockedPut).toHaveBeenCalledWith('/projects/12/documents/44', {
        name: 'Novo Título',
        description: null,
      })
      expect(updated.title).toBe('Novo Título')
      expect(updated.statusLabel).toBe('Arquivado')
      expect(mockedDelete).toHaveBeenCalledWith('/projects/12/documents/44')
    })

    it('maps document history events cleanly', async () => {
      const eventDto: ResourceEventSchema = {
        id: 501,
        project_id: 12,
        resource_type: 'document',
        resource_id: 44,
        author_member_id: 7,
        event_type: 'status_changed',
        data: { from: 'draft', to: 'published' },
        created_at: '2026-11-22T14:00:00Z',
      }
      mockedGet.mockResolvedValueOnce({
        data: {
          items: [eventDto],
          limit: 10,
          more: false,
          cursor: null,
        },
      })

      const api = useRepertoryApi()
      const history = await api.listDocumentHistory(12, 44, { limit: 10 })

      expect(mockedGet).toHaveBeenCalledWith('/projects/12/documents/44/history', {
        params: { limit: 10 },
      })
      expect(history.items).toEqual([
        {
          id: 501,
          title: 'Status alterado',
          summary: 'Status alterado de draft para published.',
          author: 'Membro #7',
          date: expect.any(String),
        },
      ])
    })

    it('resolves document file URL, fetches blob, and triggers browser download', async () => {
      const blob = new Blob(['pdf-bytes'], { type: 'application/pdf' })
      mockedGet.mockResolvedValueOnce({ data: blob })
      mockedGet.mockResolvedValueOnce({
        data: blob,
        headers: { 'content-disposition': 'attachment; filename="contrato-final.pdf"' },
      })

      const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:doc-44')
      const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

      const api = useRepertoryApi()
      expect(api.getDocumentFileUrl(12, 44)).toBe('/api/projects/12/documents/44/file')
      expect(mockedResolveApiUrl).toHaveBeenCalledWith('/projects/12/documents/44/file')

      const fetchedBlob = await api.fetchDocumentFileBlob(12, 44)
      expect(fetchedBlob).toBe(blob)
      expect(mockedGet).toHaveBeenNthCalledWith(1, '/projects/12/documents/44/file', {
        responseType: 'blob',
      })

      await api.downloadDocumentFile(12, 44)
      expect(createObjectUrlSpy).toHaveBeenCalledWith(blob)
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:doc-44')
    })
  })

  describe('assets', () => {
    it('lists assets with fileUrl and inferred format', async () => {
      mockedGet.mockResolvedValueOnce({
        data: {
          items: [makeAssetDto()],
          limit: 15,
          more: false,
          cursor: null,
        },
      })

      const api = useRepertoryApi()
      const page = await api.listAssets(12, { type: 'image', status: 'active' })

      expect(mockedGet).toHaveBeenCalledWith('/projects/12/assets', {
        params: { type: 'image', status: 'active' },
      })
      expect(page.items[0]).toMatchObject({
        id: 8,
        projectId: 12,
        title: 'Brand Mark Dark',
        type: 'image',
        status: 'active',
        statusLabel: 'Ativo',
        format: 'PNG',
        fileUrl: '/api/projects/12/assets/8/file',
      })
    })

    it('performs 2-step asset creation inferring asset type from file when omitted', async () => {
      const file = new File(['png-bytes'], 'hero-robot.png', { type: 'image/png' })
      const uploadResponse: AssetUploadSchema = {
        ...makeAssetDto({ id: 71, name: 'Hero Robot', status: 'uploading' }),
        upload_url: 'https://storage.example.com/presigned/asset-71',
        method: 'PUT',
        required_headers: { 'x-amz-meta-project': '12' },
        expires_at: '2026-11-22T23:59:59Z',
      }
      mockedPost.mockResolvedValueOnce({ data: uploadResponse })
      mockedUpload.mockResolvedValueOnce(undefined)

      const api = useRepertoryApi()
      const created = await api.createAsset(12, {
        name: 'Hero Robot',
        description: 'Banner principal',
        file,
      })

      expect(mockedPost).toHaveBeenCalledWith('/projects/12/assets', {
        name: 'Hero Robot',
        type: 'image',
        original_filename: 'hero-robot.png',
        description: 'Banner principal',
        content_type: 'image/png',
      })
      expect(mockedUpload).toHaveBeenCalledWith(
        uploadResponse.upload_url,
        file,
        uploadResponse.method,
        uploadResponse.required_headers,
      )
      expect(created.id).toBe(71)
      expect(created.fileUrl).toBe('/api/projects/12/assets/71/file')
    })

    it('performs 2-step asset file replacement and supports update/delete/history/blob', async () => {
      const file = new File(['svg-bytes'], 'logo.svg', { type: 'image/svg+xml' })
      const uploadResponse: AssetUploadSchema = {
        ...makeAssetDto({
          id: 8,
          content_type: 'image/svg+xml',
          file_extension: null,
        }),
        upload_url: 'https://storage.example.com/presigned/replace-asset-8',
        method: 'PUT',
        required_headers: { 'Content-Type': 'image/svg+xml' },
        expires_at: '2026-11-22T23:59:59Z',
      }
      mockedPost.mockResolvedValueOnce({ data: uploadResponse })
      mockedUpload.mockResolvedValueOnce(undefined)
      mockedPut.mockResolvedValueOnce({
        data: makeAssetDto({ name: 'Logo Atualizado', type: 'vector' }),
      })
      mockedGet.mockResolvedValueOnce({
        data: {
          items: [
            {
              id: 901,
              project_id: 12,
              resource_type: 'asset',
              resource_id: 8,
              author_member_id: 2,
              event_type: 'file_replaced',
              data: { original_filename: 'logo.svg' },
              created_at: '2026-11-22T18:00:00Z',
            },
          ],
          limit: 20,
          more: false,
          cursor: null,
        },
      })
      const blob = new Blob(['svg-bytes'], { type: 'image/svg+xml' })
      mockedGet.mockResolvedValueOnce({ data: blob })
      mockedDelete.mockResolvedValueOnce({ data: undefined })

      const api = useRepertoryApi()
      const replaced = await api.replaceAssetFile(12, 8, file)
      expect(mockedPost).toHaveBeenCalledWith('/projects/12/assets/8/uploads', {
        original_filename: 'logo.svg',
        content_type: 'image/svg+xml',
      })
      expect(mockedUpload).toHaveBeenCalledWith(
        uploadResponse.upload_url,
        file,
        uploadResponse.method,
        uploadResponse.required_headers,
      )
      expect(replaced.format).toBe('SVG')

      const updated = await api.updateAsset(12, 8, {
        name: 'Logo Atualizado',
        type: 'vector',
      })
      expect(updated.title).toBe('Logo Atualizado')
      expect(updated.type).toBe('vector')

      const history = await api.listAssetHistory(12, 8)
      expect(history.items[0]).toMatchObject({
        id: 901,
        title: 'Arquivo substituído',
        summary: 'Arquivo: logo.svg.',
        author: 'Membro #2',
      })

      expect(api.getAssetFileUrl(12, 8)).toBe('/api/projects/12/assets/8/file')
      expect(await api.fetchAssetFileBlob(12, 8)).toBe(blob)

      await api.deleteAsset(12, 8)
      expect(mockedDelete).toHaveBeenCalledWith('/projects/12/assets/8')
    })
  })

  describe('tags', () => {
    it('supports project tag CRUD', async () => {
      const tagDto = makeTagDto()
      mockedGet.mockResolvedValueOnce({ data: { items: [tagDto] } })
      mockedPost.mockResolvedValueOnce({ data: tagDto })
      mockedPut.mockResolvedValueOnce({
        data: makeTagDto({ label: 'Compliance', color: '#00AAFF' }),
      })
      mockedDelete.mockResolvedValueOnce({ data: undefined })

      const api = useRepertoryApi()

      const listed = await api.listProjectTags(12)
      expect(mockedGet).toHaveBeenCalledWith('/projects/12/tags')
      expect(listed).toEqual([
        {
          id: 10,
          projectId: 12,
          label: 'Jurídico',
          description: 'Documentos contratuais e pareceres',
          color: '#F33FF0',
        },
      ])

      const created = await api.createTag(12, {
        label: 'Jurídico',
        description: 'Documentos contratuais e pareceres',
        color: '#F33FF0',
      })
      expect(mockedPost).toHaveBeenCalledWith('/projects/12/tags', {
        label: 'Jurídico',
        description: 'Documentos contratuais e pareceres',
        color: '#F33FF0',
      })
      expect(created.id).toBe(10)

      const updated = await api.updateTag(12, 10, {
        label: 'Compliance',
        color: '#00AAFF',
      })
      expect(mockedPut).toHaveBeenCalledWith('/projects/12/tags/10', {
        label: 'Compliance',
        color: '#00AAFF',
      })
      expect(updated.label).toBe('Compliance')

      await api.deleteTag(12, 10)
      expect(mockedDelete).toHaveBeenCalledWith('/projects/12/tags/10')
    })

    it('lists, attaches, and detaches tags on documents and assets', async () => {
      const tagDto = makeTagDto({ id: 5, label: 'Revisado' })
      mockedGet.mockResolvedValue({ data: { items: [tagDto] } })
      mockedPut.mockResolvedValue({ data: undefined })
      mockedDelete.mockResolvedValue({ data: undefined })

      const api = useRepertoryApi()

      const docTags = await api.listDocumentTags(12, 44)
      expect(mockedGet).toHaveBeenCalledWith('/projects/12/documents/44/tags')
      expect(docTags[0]?.label).toBe('Revisado')

      await api.attachTagToDocument(12, 44, 5)
      expect(mockedPut).toHaveBeenCalledWith('/projects/12/documents/44/tags/5')

      await api.detachTagFromDocument(12, 44, 5)
      expect(mockedDelete).toHaveBeenCalledWith('/projects/12/documents/44/tags/5')

      const assetTags = await api.listAssetTags(12, 8)
      expect(mockedGet).toHaveBeenCalledWith('/projects/12/assets/8/tags')
      expect(assetTags[0]?.id).toBe(5)

      await api.attachTagToAsset(12, 8, 5)
      expect(mockedPut).toHaveBeenCalledWith('/projects/12/assets/8/tags/5')

      await api.detachTagFromAsset(12, 8, 5)
      expect(mockedDelete).toHaveBeenCalledWith('/projects/12/assets/8/tags/5')
    })
  })

  describe('error propagation', () => {
    it('wraps 422 validation errors into ApiRequestError with fieldErrors', async () => {
      mockedPost.mockRejectedValueOnce(
        createAxiosError(422, {
          detail: [
            {
              loc: ['body', 'label'],
              msg: 'Field must not be empty',
              type: 'value_error',
            },
          ],
        }),
      )

      const api = useRepertoryApi()
      await expect(
        api.createTag(12, { label: '', description: 'Desc', color: '#FFFFFF' }),
      ).rejects.toSatisfy((error: unknown) => {
        expect(error).toBeInstanceOf(ApiRequestError)
        const apiError = error as ApiRequestError
        expect(apiError.status).toBe(422)
        expect(apiError.fieldErrors).toEqual({ label: 'Field must not be empty' })
        return true
      })
    })

    it('wraps presigned storage upload failures in step 2 into ApiRequestError', async () => {
      const file = new File(['data'], 'report.pdf', { type: 'application/pdf' })
      const uploadResponse: DocumentUploadSchema = {
        ...makeDocumentDto(),
        upload_url: 'https://storage.example.com/presigned/fail',
        method: 'PUT',
        required_headers: {},
        expires_at: '2026-11-22T23:59:59Z',
      }
      mockedPost.mockResolvedValueOnce({ data: uploadResponse })
      mockedUpload.mockRejectedValueOnce(createAxiosError(403, { detail: 'Presigned URL expired' }))

      const api = useRepertoryApi()
      await expect(api.createDocument(12, { name: 'Report', file })).rejects.toMatchObject({
        name: 'ApiRequestError',
        status: 403,
        message: 'Presigned URL expired',
      })
    })
  })
})
