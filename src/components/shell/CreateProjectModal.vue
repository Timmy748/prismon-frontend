<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Button,
  Modal,
  Select,
  TextArea,
  TextInput,
  toast,
  type SelectOption,
} from '@/components/ui'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  create: [payload: { name: string; description: string; role: string }]
}>()

const nameInput = ref('')
const descriptionInput = ref('')
const roleInput = ref('Administradora')
const nameError = ref('')

const roleOptions: SelectOption[] = [
  { label: 'Administradora', value: 'Administradora' },
  { label: 'Editora', value: 'Editora' },
  { label: 'Visualizadora', value: 'Visualizadora' },
]

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      nameInput.value = ''
      descriptionInput.value = ''
      roleInput.value = 'Administradora'
      nameError.value = ''
    }
  },
)

function handleClose() {
  emit('update:open', false)
}

function handleSubmit() {
  const cleanName = nameInput.value.trim()
  if (!cleanName) {
    nameError.value = 'Informe o nome do projeto.'
    return
  }

  emit('create', {
    name: cleanName,
    description: descriptionInput.value.trim(),
    role: roleInput.value,
  })
  toast.success(`Projeto "${cleanName}" criado e selecionado.`)
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    size="lg"
    title="criar projeto"
    subtitle="Configure um novo workspace para organizar chats, repertório e workflows."
    @update:open="emit('update:open', $event)"
  >
    <form id="create-project-form" class="project-create-form" @submit.prevent="handleSubmit">
      <TextInput
        v-model="nameInput"
        label="Nome do projeto"
        name="project-name"
        placeholder="Ex.: Operações Financeiras IA"
        :error="nameError"
        required
        @update:model-value="nameError = ''"
      />
      <TextArea
        v-model="descriptionInput"
        label="Descrição"
        name="project-description"
        :rows="3"
        placeholder="Descreva o objetivo e escopo deste projeto."
      />
      <Select
        v-model="roleInput"
        label="Seu papel inicial"
        name="project-role"
        :options="roleOptions"
      />
    </form>

    <template #footer>
      <Button variant="tertiary" @click="handleClose">Cancelar</Button>
      <Button type="submit" form="create-project-form" variant="primary">Criar projeto</Button>
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
