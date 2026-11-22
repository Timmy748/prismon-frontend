<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Toaster } from '@/components/ui'

const route = useRoute()
const showGlobalToaster = computed(() => route?.name !== 'ui-kit-preview')
</script>

<template>
  <RouterView />
  <Toaster v-if="showGlobalToaster" position="bottom-right" />
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: var(--spacing-0);
  padding: var(--spacing-0);
  background-color: var(--surface-base);
  color: var(--text-primary);
  font-family: var(--font-family-sans);
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
  overscroll-behavior: none;
}

button,
a,
[role='button'] {
  touch-action: manipulation;
}

button,
[role='button'] {
  user-select: none;
  -webkit-user-select: none;
}

@media (pointer: coarse) {
  input,
  textarea,
  select {
    font-size: 16px;
  }
}

#app {
  transition: filter var(--duration-modal) var(--easing-out);
}

body[data-overlay-open='true'] #app {
  filter: blur(var(--blur-overlay));
}

@media (prefers-reduced-motion: reduce) {
  #app {
    transition: none;
  }

  body[data-overlay-open='true'] #app {
    filter: none;
  }
}
</style>
