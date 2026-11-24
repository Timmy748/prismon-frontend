<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button, Modal, TextInput } from '@/components/ui'

interface Props {
  open: boolean
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [payload: { name: string }]
}>()

const nameInput = ref('')
const nameError = ref('')
const isSubmitting = computed(() => props.submitting)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      nameInput.value = ''
      nameError.value = ''
    }
  },
)

function handleModalOpenChange(nextOpen: boolean) {
  if (isSubmitting.value) {
    return
  }
  emit('update:open', nextOpen)
}

function handleClose() {
  if (isSubmitting.value) {
    return
  }
  emit('update:open', false)
}

function handleSubmit() {
  if (isSubmitting.value) {
    return
  }
  const cleanName = nameInput.value.trim()
  if (!cleanName) {
    nameError.value = 'Informe o nome do projeto.'
    return
  }

  emit('create', {
    name: cleanName,
  })
}
</script>

<template>
  <Modal
    :open="open"
    size="md"
    title="criar projeto"
    subtitle="Configure um novo workspace para organizar chats, repertório e workflows."
    @update:open="handleModalOpenChange"
  >
    <form
      id="create-project-form"
      class="project-create-form"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <TextInput
        v-model="nameInput"
        label="Nome do projeto"
        name="project-name"
        placeholder="Ex.: Operações Financeiras IA"
        :disabled="isSubmitting"
        :error="nameError"
        required
        @update:model-value="nameError = ''"
      />
    </form>

    <template #footer>
      <Button variant="tertiary" :disabled="isSubmitting" @click="handleClose">Cancelar</Button>
      <Button type="submit" form="create-project-form" variant="primary" :disabled="isSubmitting">
        {{ isSubmitting ? 'Criando...' : 'Criar projeto' }}
      </Button>
    </template>
  </Modal>
</template>

<style scoped>
.project-create-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}
</style>
