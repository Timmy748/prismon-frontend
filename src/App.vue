<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
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
}
</style>
