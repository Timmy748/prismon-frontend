import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/api/client'
import { ApiRequestError } from '@/api/errors'
import { mapApiKeyFromApi, mapCreateApiKeyToApi } from '@/api/mappers/apiKeyMapper'
import { formatApiDate } from '@/api/mappers/formatters'
import {
  getMemberRoleLabel,
  getMemberStatusLabel,
  mapChangeMemberRoleToApi,
  mapInviteMemberToApi,
  mapMemberFromApi,
} from '@/api/mappers/memberMapper'
import {
  mapCreateProjectToApi,
  mapProjectFromApi,
  mapUpdateProjectToApi,
} from '@/api/mappers/projectMapper'
import type { ApiKeyHintSchema } from '@/api/types/apiKeys'
import type { PageSchema } from '@/api/types/common'
import type { MemberSchema } from '@/api/types/members'
import type { ProjectSchema } from '@/api/types/projects'
import { useApiKeysApi } from '@/composables/api/useApiKeysApi'
import { useMembersApi } from '@/composables/api/useMembersApi'
import { useProjectsApi } from '@/composables/api/useProjectsApi'

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn<(...args: unknown[]) => Promise<{ data: unknown }>>(),
    post: vi.fn<(...args: unknown[]) => Promise<{ data: unknown }>>(),
    put: vi.fn<(...args: unknown[]) => Promise<{ data: unknown }>>(),
    patch: vi.fn<(...args: unknown[]) => Promise<{ data: unknown }>>(),
    delete: vi.fn<(...args: unknown[]) => Promise<{ data: unknown }>>(),
  },
}))

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)
const mockedPut = vi.mocked(apiClient.put)
const mockedPatch = vi.mocked(apiClient.patch)
const mockedDelete = vi.mocked(apiClient.delete)

function createAxiosError(status: number, data?: unknown): AxiosError {
  const headers = new AxiosHeaders()
  const response: AxiosResponse = {
    data,
    status,
    statusText: 'Error',
    headers,
    config: { headers },
  }
  return new AxiosError(
    `Request failed with status ${status}`,
    'ERR_BAD_REQUEST',
    response.config,
    undefined,
    response,
  )
}

describe('Workspace entities API layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Projects mapper and composable', () => {
    const projectDto: ProjectSchema = {
      id: 42,
      name: 'Prismon Core',
      owner_id: 7,
      created_at: '2026-01-15T10:30:00Z',
      updated_at: '2026-02-01T12:00:00Z',
    }

    it('maps Project DTOs and inputs deterministically', () => {
      expect(mapProjectFromApi(projectDto)).toEqual({
        id: 42,
        name: 'Prismon Core',
        ownerId: 7,
        createdAt: '2026-01-15T10:30:00Z',
        updatedAt: '2026-02-01T12:00:00Z',
        createdAtLabel: formatApiDate('2026-01-15T10:30:00Z'),
      })

      expect(mapCreateProjectToApi({ name: '  Novo Projeto  ' })).toEqual({
        name: 'Novo Projeto',
      })
      expect(mapUpdateProjectToApi({ name: '  Atualizado ' })).toEqual({
        name: 'Atualizado',
      })
      expect(mapUpdateProjectToApi({ name: null })).toEqual({ name: null })
      expect(mapUpdateProjectToApi({})).toEqual({})
    })

    it('lists projects with cursor pagination and cleaned query params', async () => {
      const page: PageSchema<ProjectSchema> = {
        items: [projectDto],
        limit: 20,
        more: true,
        cursor: 'cursor-next-2',
      }
      mockedGet.mockResolvedValueOnce({ data: page })

      const { listProjects } = useProjectsApi()
      const result = await listProjects({
        name: '  Prismon  ',
        limit: 20,
        cursor: 'cursor-1',
      })

      expect(mockedGet).toHaveBeenCalledWith('/projects', {
        params: {
          name: 'Prismon',
          limit: 20,
          cursor: 'cursor-1',
        },
      })
      expect(result).toEqual({
        items: [mapProjectFromApi(projectDto)],
        limit: 20,
        hasMore: true,
        nextCursor: 'cursor-next-2',
      })
    })

    it('omits empty or null query params when listing projects', async () => {
      mockedGet.mockResolvedValueOnce({
        data: { items: [], limit: 10, more: false, cursor: null },
      })

      const { listProjects } = useProjectsApi()
      await listProjects({ name: '   ', cursor: null })

      expect(mockedGet).toHaveBeenCalledWith('/projects', undefined)
    })

    it('creates, updates, and deletes a project', async () => {
      mockedPost.mockResolvedValueOnce({ data: projectDto })
      mockedPut.mockResolvedValueOnce({
        data: { ...projectDto, name: 'Prismon v2' },
      })
      mockedDelete.mockResolvedValueOnce({ data: undefined })

      const { createProject, updateProject, deleteProject } = useProjectsApi()

      const created = await createProject({ name: 'Prismon Core' })
      expect(mockedPost).toHaveBeenCalledWith('/projects', { name: 'Prismon Core' })
      expect(created.id).toBe(42)

      const updated = await updateProject(42, { name: 'Prismon v2' })
      expect(mockedPut).toHaveBeenCalledWith('/projects/42', { name: 'Prismon v2' })
      expect(updated.name).toBe('Prismon v2')

      await deleteProject(42)
      expect(mockedDelete).toHaveBeenCalledWith('/projects/42')
    })

    it('propagates structured ApiRequestError on project errors', async () => {
      mockedPost.mockRejectedValueOnce(
        createAxiosError(422, {
          detail: [
            {
              loc: ['body', 'name'],
              msg: 'Field required',
              type: 'missing',
            },
          ],
        }),
      )

      const { createProject } = useProjectsApi()

      await expect(createProject({ name: '' })).rejects.toSatisfy((error: unknown) => {
        expect(error).toBeInstanceOf(ApiRequestError)
        const apiError = error as ApiRequestError
        expect(apiError.status).toBe(422)
        expect(apiError.fieldErrors).toEqual({ name: 'Field required' })
        expect(apiError.message).toBe('name: Field required')
        return true
      })
    })
  })

  describe('Members mapper and composable', () => {
    const memberDto: MemberSchema = {
      id: 10,
      project_id: 42,
      user_id: 99,
      role: 'director',
      status: 'active',
      created_at: '2026-03-04T15:00:00Z',
      updated_at: '2026-03-05T09:00:00Z',
    }

    it('maps Member DTOs, labels, and inputs deterministically', () => {
      expect(getMemberRoleLabel('owner')).toBe('Proprietário')
      expect(getMemberRoleLabel('director')).toBe('Diretor')
      expect(getMemberRoleLabel('member')).toBe('Membro')
      expect(getMemberRoleLabel('collaborator')).toBe('Colaborador')

      expect(getMemberStatusLabel('pending')).toBe('Pendente')
      expect(getMemberStatusLabel('active')).toBe('Ativo')
      expect(getMemberStatusLabel('removed')).toBe('Removido')

      expect(mapMemberFromApi(memberDto)).toEqual({
        id: 10,
        projectId: 42,
        userId: 99,
        userLabel: 'Usuário #99',
        role: 'director',
        roleLabel: 'Diretor',
        status: 'active',
        statusLabel: 'Ativo',
        createdAt: '2026-03-04T15:00:00Z',
        updatedAt: '2026-03-05T09:00:00Z',
        createdAtLabel: formatApiDate('2026-03-04T15:00:00Z', 'compact'),
      })

      expect(mapInviteMemberToApi({ userId: 99 })).toEqual({ user_id: 99 })
      expect(mapChangeMemberRoleToApi({ role: 'collaborator' })).toEqual({
        new_role: 'collaborator',
      })
    })

    it('lists, invites, accepts, refuses, updates role, and removes members', async () => {
      const pendingMember: MemberSchema = { ...memberDto, status: 'pending', role: 'member' }
      const page: PageSchema<MemberSchema> = {
        items: [memberDto],
        limit: 15,
        more: false,
        cursor: null,
      }

      mockedGet.mockResolvedValueOnce({ data: page })
      mockedPost.mockResolvedValueOnce({ data: pendingMember })
      mockedPatch
        .mockResolvedValueOnce({ data: { ...pendingMember, status: 'active' } })
        .mockResolvedValueOnce({ data: { ...pendingMember, status: 'removed' } })
        .mockResolvedValueOnce({ data: { ...memberDto, role: 'collaborator' } })
      mockedDelete.mockResolvedValueOnce({ data: undefined })

      const {
        listMembers,
        inviteMember,
        acceptProjectInvite,
        refuseProjectInvite,
        changeMemberRole,
        removeMember,
      } = useMembersApi()

      const listed = await listMembers(42, { limit: 15, cursor: 'abc' })
      expect(mockedGet).toHaveBeenCalledWith('/projects/42/members', {
        params: { limit: 15, cursor: 'abc' },
      })
      expect(listed.items).toHaveLength(1)
      expect(listed.hasMore).toBe(false)
      expect(listed.nextCursor).toBeNull()

      const invited = await inviteMember(42, { userId: 99 })
      expect(mockedPost).toHaveBeenCalledWith('/projects/42/members', { user_id: 99 })
      expect(invited.statusLabel).toBe('Pendente')

      const accepted = await acceptProjectInvite(42)
      expect(mockedPatch).toHaveBeenNthCalledWith(1, '/projects/42/members/accept')
      expect(accepted.status).toBe('active')

      const refused = await refuseProjectInvite(42)
      expect(mockedPatch).toHaveBeenNthCalledWith(2, '/projects/42/members/refuse')
      expect(refused.status).toBe('removed')

      const updatedRole = await changeMemberRole(42, 10, { role: 'collaborator' })
      expect(mockedPatch).toHaveBeenNthCalledWith(3, '/projects/42/members/10', {
        new_role: 'collaborator',
      })
      expect(updatedRole.roleLabel).toBe('Colaborador')

      await removeMember(42, 10)
      expect(mockedDelete).toHaveBeenCalledWith('/projects/42/members/10')
    })

    it('wraps member API errors with parseApiError', async () => {
      mockedPatch.mockRejectedValueOnce(
        createAxiosError(403, { detail: 'Apenas diretores podem alterar cargos.' }),
      )

      const { changeMemberRole } = useMembersApi()

      await expect(changeMemberRole(42, 10, { role: 'director' })).rejects.toSatisfy(
        (error: unknown) => {
          expect(error).toBeInstanceOf(ApiRequestError)
          const apiError = error as ApiRequestError
          expect(apiError.status).toBe(403)
          expect(apiError.message).toBe('Apenas diretores podem alterar cargos.')
          return true
        },
      )
    })
  })

  describe('API Keys mapper and composable', () => {
    const keyDto: ApiKeyHintSchema = {
      id: 501,
      provider: 'openrouter',
      api_hint: 'sk-or-••••9a2f',
      created_at: '2026-03-10T08:15:00Z',
    }

    it('maps ApiKey DTOs and creation payloads cleanly', () => {
      expect(mapApiKeyFromApi(keyDto, 'project')).toEqual({
        id: 501,
        provider: 'openrouter',
        hint: 'sk-or-••••9a2f',
        scope: 'project',
        createdAt: '2026-03-10T08:15:00Z',
        createdAtLabel: formatApiDate('2026-03-10T08:15:00Z', 'compact'),
      })

      expect(
        mapCreateApiKeyToApi({
          provider: 'openrouter',
          apiKey: '  sk-or-v1-secret-value  ',
        }),
      ).toEqual({
        provider: 'openrouter',
        api_key: 'sk-or-v1-secret-value',
      })
    })

    it('handles project and member API key endpoints with scopes and pagination', async () => {
      const projectPage: PageSchema<ApiKeyHintSchema> = {
        items: [keyDto],
        limit: 10,
        more: true,
        cursor: 'proj-cursor-2',
      }
      const memberPage: PageSchema<ApiKeyHintSchema> = {
        items: [{ ...keyDto, id: 502, api_hint: 'sk-or-••••11cc' }],
        limit: 10,
        more: false,
        cursor: null,
      }

      mockedGet
        .mockResolvedValueOnce({ data: projectPage })
        .mockResolvedValueOnce({ data: memberPage })
      mockedPost
        .mockResolvedValueOnce({ data: keyDto })
        .mockResolvedValueOnce({ data: { ...keyDto, id: 502 } })
      mockedDelete.mockResolvedValueOnce({ data: undefined })

      const {
        listProjectApiKeys,
        createProjectApiKey,
        listMemberApiKeys,
        createMemberApiKey,
        deleteProjectApiKey,
      } = useApiKeysApi()

      const projectKeys = await listProjectApiKeys(42, { limit: 10 })
      expect(mockedGet).toHaveBeenNthCalledWith(1, '/projects/42/api-keys', {
        params: { limit: 10 },
      })
      expect(projectKeys.items[0]?.scope).toBe('project')
      expect(projectKeys.hasMore).toBe(true)
      expect(projectKeys.nextCursor).toBe('proj-cursor-2')

      const createdProjectKey = await createProjectApiKey(42, {
        provider: 'openrouter',
        apiKey: 'sk-or-v1-proj',
      })
      expect(mockedPost).toHaveBeenNthCalledWith(1, '/projects/42/api-keys', {
        provider: 'openrouter',
        api_key: 'sk-or-v1-proj',
      })
      expect(createdProjectKey.scope).toBe('project')

      const memberKeys = await listMemberApiKeys(42)
      expect(mockedGet).toHaveBeenNthCalledWith(2, '/projects/42/members/me/api-keys', undefined)
      expect(memberKeys.items[0]?.scope).toBe('member')
      expect(memberKeys.items[0]?.hint).toBe('sk-or-••••11cc')

      const createdMemberKey = await createMemberApiKey(42, {
        provider: 'openrouter',
        apiKey: 'sk-or-v1-member',
      })
      expect(mockedPost).toHaveBeenNthCalledWith(2, '/projects/42/members/me/api-keys', {
        provider: 'openrouter',
        api_key: 'sk-or-v1-member',
      })
      expect(createdMemberKey.scope).toBe('member')

      await deleteProjectApiKey(42, 501)
      expect(mockedDelete).toHaveBeenCalledWith('/projects/42/api-keys/501')
    })

    it('propagates ApiRequestError when deleting or fetching API keys fails', async () => {
      mockedDelete.mockRejectedValueOnce(createAxiosError(404))

      const { deleteProjectApiKey } = useApiKeysApi()

      await expect(deleteProjectApiKey(42, 999)).rejects.toSatisfy((error: unknown) => {
        expect(error).toBeInstanceOf(ApiRequestError)
        const apiError = error as ApiRequestError
        expect(apiError.status).toBe(404)
        expect(apiError.message).toBe('Recurso não encontrado.')
        return true
      })
    })
  })
})
