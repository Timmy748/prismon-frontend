<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui'
</script>

<template>
  <RouterView />
  <Toaster position="bottom-right" />
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
</style>
