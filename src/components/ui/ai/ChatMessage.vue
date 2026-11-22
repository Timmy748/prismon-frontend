<script setup lang="ts">
import { computed } from 'vue'

export type ChatMessageRole = 'human' | 'ai'

interface Props {
  role: ChatMessageRole
  content?: string
}

const props = defineProps<Props>()

const messageClasses = computed(() => ['chat-message', `chat-message--${props.role}`])
</script>

<template>
  <div :class="messageClasses">
    <div class="chat-message__content">
      <slot>{{ content }}</slot>
    </div>
  </div>
</template>

<style scoped>
.chat-message {
  --chat-message-bg: var(--surface-transparent);
  --chat-message-color: var(--text-secondary);
  --chat-message-border-color: var(--border-transparent);
  --chat-message-border-width: var(--border-width-thin);
  --chat-message-padding: var(--spacing-4);
  --chat-message-radius: var(--radius-none);
  --chat-message-font-family: var(--type-body-compact-01-font-family);
  --chat-message-font-size: var(--type-body-compact-01-font-size);
  --chat-message-line-height: var(--type-body-compact-01-line-height);
  --chat-message-font-weight: var(--type-body-compact-01-font-weight);
  --chat-message-text-transform: var(--type-body-compact-01-text-transform);

  box-sizing: border-box;
  padding: var(--chat-message-padding);
  background-color: var(--chat-message-bg);
  color: var(--chat-message-color);
  border: var(--chat-message-border-width) solid var(--chat-message-border-color);
  border-radius: var(--chat-message-radius);
  font-family: var(--chat-message-font-family);
  font-size: var(--chat-message-font-size);
  line-height: var(--chat-message-line-height);
  font-weight: var(--chat-message-font-weight);
  text-transform: var(--chat-message-text-transform);
}

.chat-message--human {
  --chat-message-bg: var(--surface-elevated);
  --chat-message-border-color: var(--border-subtle-1);
}

.chat-message--ai {
  --chat-message-bg: var(--surface-transparent);
  --chat-message-border-color: var(--border-transparent);
}

.chat-message__content {
  overflow-wrap: break-word;
}
</style>
