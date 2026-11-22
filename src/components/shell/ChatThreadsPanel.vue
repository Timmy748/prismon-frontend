<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Button,
  ConfirmDialog,
  Dropdown,
  Icon,
  IconButton,
  ListItem,
  Modal,
  NavList,
  ScrollContainer,
  SearchInput,
  TextInput,
  toast,
  type DropdownItem,
} from '@/components/ui'
import { useWorkspaceState, type ChatThread } from '@/stores/workspaceState'

interface Props {
  collapsed?: boolean
  inDrawer?: boolean
}

withDefaults(defineProps<Props>(), {
  collapsed: false,
  inDrawer: false,
})

const emit = defineEmits<{
  'thread-selected': []
  'new-chat': []
}>()

const route = useRoute()
const router = useRouter()

const {
  filteredThreads,
  activeThreadId,
  threadSearch,
  selectThread,
  startNewChat,
  renameThread,
  deleteThread,
} = useWorkspaceState()

const isTodayOpen = ref(true)

const threadMenuItems: DropdownItem[] = [
  { id: 'rename', label: 'Editar nome', icon: 'edit' },
  { id: 'delete', label: 'Deletar', icon: 'delete', variant: 'danger' },
]

const isRenameModalOpen = ref(false)
const pendingRenameThreadId = ref<string | null>(null)
const renameTitleInput = ref('')
const renameError = ref('')

const isDeleteConfirmOpen = ref(false)
const pendingDeleteThreadId = ref<string | null>(null)

const pendingDeleteThreadTitle = computed(() => {
  const found = filteredThreads.value.find((item) => item.id === pendingDeleteThreadId.value)
  return found?.title ?? ''
})

async function handleSelectThread(threadId: string) {
  selectThread(threadId)
  emit('thread-selected')
  if (route?.path !== '/chat' && router.hasRoute('chat')) {
    await router.push('/chat')
  }
}

async function handleStartNewChat() {
  startNewChat()
  emit('new-chat')
  if (route?.path !== '/chat' && router.hasRoute('chat')) {
    await router.push('/chat')
  }
}

function openRenameModal(thread: ChatThread) {
  pendingRenameThreadId.value = thread.id
  renameTitleInput.value = thread.title
  renameError.value = ''
  isRenameModalOpen.value = true
}

function closeRenameModal() {
  isRenameModalOpen.value = false
  pendingRenameThreadId.value = null
  renameTitleInput.value = ''
  renameError.value = ''
}

function handleSaveRename() {
  const targetId = pendingRenameThreadId.value
  const cleanTitle = renameTitleInput.value.trim()
  if (!cleanTitle) {
    renameError.value = 'Informe um nome para a conversa.'
    return
  }
  if (targetId && renameThread(targetId, cleanTitle)) {
    toast.success('Nome da conversa atualizado.')
  }
  closeRenameModal()
}

function askDeleteThread(threadId: string) {
  pendingDeleteThreadId.value = threadId
  isDeleteConfirmOpen.value = true
}

function confirmDeleteThread() {
  const targetId = pendingDeleteThreadId.value
  isDeleteConfirmOpen.value = false
  pendingDeleteThreadId.value = null
  if (!targetId) {
    return
  }
  deleteThread(targetId)
  toast.info('Conversa removida da lista local.')
}

function handleThreadMenuAction(thread: ChatThread, actionId: string) {
  if (actionId === 'rename') {
    openRenameModal(thread)
    return
  }
  if (actionId === 'delete') {
    askDeleteThread(thread.id)
  }
}
</script>

<template>
  <div :class="['chat-threads', inDrawer ? 'chat-threads--drawer' : undefined]">
    <div v-if="!inDrawer" class="chat-threads__divider" aria-hidden="true" />

    <div v-if="!collapsed" class="chat-threads__content">
      <div class="chat-threads__header">
        <h2 class="chat-threads__title">conversas</h2>
      </div>

      <div class="chat-threads__controls">
        <SearchInput
          v-model="threadSearch"
          placeholder="buscar conversas"
          ariaLabel="Buscar conversas"
        />
      </div>

      <div class="chat-threads__group-header">
        <button
          type="button"
          class="chat-threads__group-toggle"
          :aria-expanded="isTodayOpen"
          @click="isTodayOpen = !isTodayOpen"
        >
          <span class="chat-threads__group-title">hoje</span>
          <span
            :class="[
              'chat-threads__group-chevron',
              !isTodayOpen ? 'chat-threads__group-chevron--collapsed' : undefined,
            ]"
          >
            <Icon name="arrow-down" size="md" />
          </span>
        </button>
      </div>

      <ScrollContainer
        v-if="isTodayOpen"
        direction="vertical"
        gap="none"
        class="chat-threads__scroll"
        ariaLabel="Lista de conversas"
      >
        <div class="chat-threads__lists">
          <ListItem
            v-for="thread in filteredThreads"
            :key="thread.id"
            :label="thread.title"
            :active="thread.id === activeThreadId"
            :marquee-on-hover="true"
            @click="handleSelectThread(thread.id)"
          >
            <template #trailing>
              <Dropdown
                :items="threadMenuItems"
                align="right"
                placement="right-start"
                :aria-label="`Ações de ${thread.title}`"
                @select="(actionId) => handleThreadMenuAction(thread, actionId)"
              >
                <template #trigger="{ toggle, open: menuOpen, menuId }">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    icon="more-vertical"
                    :ariaLabel="`Opções da conversa ${thread.title}`"
                    :aria-expanded="menuOpen"
                    :aria-controls="menuId"
                    @click.stop="toggle"
                  />
                </template>
              </Dropdown>
            </template>
          </ListItem>

          <p v-if="filteredThreads.length === 0" class="chat-threads__empty">
            Nenhuma conversa encontrada.
          </p>
        </div>
      </ScrollContainer>
    </div>

    <div v-else class="chat-threads__collapsed">
      <IconButton
        variant="primary"
        size="sm"
        icon="plus"
        ariaLabel="Nova conversa"
        @click="handleStartNewChat"
      />
      <ScrollContainer
        direction="vertical"
        gap="none"
        class="chat-threads__collapsed-scroll"
        ariaLabel="Conversas"
      >
        <NavList>
          <ListItem
            v-for="thread in filteredThreads"
            :key="thread.id"
            :label="thread.title"
            icon="chat"
            :collapsed="true"
            :active="thread.id === activeThreadId"
            @click="handleSelectThread(thread.id)"
          />
        </NavList>
      </ScrollContainer>
    </div>

    <Modal
      v-model:open="isRenameModalOpen"
      size="lg"
      title="renomear conversa"
      subtitle="Defina um novo título para localizar esta conversa facilmente."
      @close="closeRenameModal"
    >
      <form
        id="rename-thread-form"
        class="chat-threads__rename-form"
        @submit.prevent="handleSaveRename"
      >
        <TextInput
          v-model="renameTitleInput"
          label="Nome da conversa"
          name="thread-title"
          placeholder="Ex.: revisão de contrato q4"
          :error="renameError"
          @update:model-value="renameError = ''"
        />
      </form>

      <template #footer>
        <Button variant="tertiary" @click="closeRenameModal">Cancelar</Button>
        <Button type="submit" form="rename-thread-form" variant="primary">Salvar nome</Button>
      </template>
    </Modal>

    <ConfirmDialog
      v-model:open="isDeleteConfirmOpen"
      title="remover conversa"
      :description="
        pendingDeleteThreadTitle
          ? `Remover &quot;${pendingDeleteThreadTitle}&quot; da lista local de conversas?`
          : 'Esta conversa simulada será removida da lista local.'
      "
      confirm-label="Remover"
      confirm-variant="danger"
      @confirm="confirmDeleteThread"
    />
  </div>
</template>

<style scoped>
.chat-threads {
  --chat-threads-gap: var(--spacing-3);
  --chat-threads-divider-color: var(--border-subtle-1);
  --chat-threads-divider-height: var(--border-width-thin);
  --chat-threads-title-color: var(--text-primary);
  --chat-threads-title-font-family: var(--type-heading-compact-01-font-family);
  --chat-threads-title-font-size: var(--type-heading-compact-01-font-size);
  --chat-threads-title-line-height: var(--type-heading-compact-01-line-height);
  --chat-threads-title-font-weight: var(--type-heading-compact-01-font-weight);
  --chat-threads-title-text-transform: var(--type-heading-compact-01-text-transform);
  --chat-threads-empty-color: var(--text-helper);
  --chat-threads-empty-font-family: var(--type-body-compact-01-font-family);
  --chat-threads-empty-font-size: var(--type-body-compact-01-font-size);
  --chat-threads-empty-line-height: var(--type-body-compact-01-line-height);
  --chat-threads-empty-font-weight: var(--type-body-compact-01-font-weight);
  --chat-threads-scroll-height: 240px;
  --chat-threads-shadow-focus: var(--shadow-focus-ring);
  --chat-threads-transition-duration: var(--duration-normal);
  --chat-threads-transition-easing: var(--easing-out);

  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: var(--spacing-0);
  width: 100%;
  gap: var(--chat-threads-gap);
  overflow: hidden;
}

.chat-threads--drawer {
  flex: 0 0 auto;
  overflow: visible;
}

.chat-threads__divider {
  width: 100%;
  height: var(--chat-threads-divider-height);
  background-color: var(--chat-threads-divider-color);
  flex-shrink: 0;
}

.chat-threads__content {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: var(--spacing-0);
  gap: var(--chat-threads-gap);
  overflow: hidden;
}

.chat-threads--drawer .chat-threads__content {
  flex: 0 0 auto;
  overflow: visible;
}

.chat-threads__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: var(--spacing-0) var(--spacing-3);
  gap: var(--spacing-2);
}

.chat-threads__title,
.chat-threads__group-title {
  margin: var(--spacing-0);
  color: var(--chat-threads-title-color);
  font-family: var(--chat-threads-title-font-family);
  font-size: var(--chat-threads-title-font-size);
  line-height: var(--chat-threads-title-line-height);
  font-weight: var(--chat-threads-title-font-weight);
  text-transform: var(--chat-threads-title-text-transform);
}

.chat-threads__controls {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: var(--spacing-3);
}

.chat-threads__group-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: var(--spacing-0) var(--spacing-3);
}

.chat-threads__group-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-0);
  border: var(--border-width-none) solid var(--border-transparent);
  background-color: var(--surface-transparent);
  cursor: pointer;
}

.chat-threads__group-toggle:focus-visible {
  outline: none;
  box-shadow: var(--chat-threads-shadow-focus);
}

.chat-threads__group-chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--chat-threads-title-color);
  transition: transform var(--chat-threads-transition-duration)
    var(--chat-threads-transition-easing);
}

.chat-threads__group-chevron--collapsed {
  transform: rotate(-90deg);
}

.chat-threads__scroll {
  flex: 1 1 0;
  min-height: var(--spacing-0);
  height: auto;
  max-height: 100%;
}

.chat-threads--drawer .chat-threads__scroll {
  flex: 0 0 auto;
  height: var(--chat-threads-scroll-height);
  min-height: var(--chat-threads-scroll-height);
  max-height: 38dvh;
}

.chat-threads__lists {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--spacing-0);
}

.chat-threads__lists :deep(.list-item) {
  --list-item-padding: var(--spacing-2) var(--spacing-3);
  --list-item-gap: var(--spacing-2);
}

.chat-threads__empty {
  margin: var(--spacing-0);
  padding: var(--spacing-3);
  color: var(--chat-threads-empty-color);
  font-family: var(--chat-threads-empty-font-family);
  font-size: var(--chat-threads-empty-font-size);
  line-height: var(--chat-threads-empty-line-height);
  font-weight: var(--chat-threads-empty-font-weight);
}

.chat-threads__collapsed {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1 1 0;
  min-height: var(--spacing-0);
  gap: var(--spacing-3);
  width: 100%;
  overflow: hidden;
}

.chat-threads__collapsed-scroll {
  flex: 1 1 0;
  min-height: var(--spacing-0);
  width: 100%;
}

.chat-threads__rename-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}
</style>
