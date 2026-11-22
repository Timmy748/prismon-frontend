<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button, Modal, TextInput, toast } from '@/components/ui'
import heroRobotImg from '@/assets/images/2da21ad867bb41c5bb1b67c4a94cdda9ac4949e1.jpg'

export type AuthMode = 'login' | 'register'

interface Props {
  initialMode?: AuthMode
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: undefined,
})

const route = useRoute()
const router = useRouter()

function resolveModeFromRoute(): AuthMode | null {
  if (route?.name === 'register' || route?.path === '/cadastro') {
    return 'register'
  }
  if (route?.name === 'login' || route?.path === '/login') {
    return 'login'
  }
  return null
}

const mode = ref<AuthMode>(resolveModeFromRoute() ?? props.initialMode ?? 'register')

const form = reactive({
  username: '',
  email: '',
  password: '',
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
})

const forgotModalOpen = ref(false)
const recoveryEmail = ref('')
const recoveryError = ref('')

const isRegister = computed(() => mode.value === 'register')

const headerTitle = computed(() =>
  isRegister.value ? 'Bem vindo ao prismon' : 'Bem vindo de volta',
)

const headerSubtitle = computed(() =>
  isRegister.value ? 'Crie uma conta para explorar.' : 'Entre na sua conta para continuar.',
)

const submitLabel = computed(() => (isRegister.value ? 'criar conta' : 'entrar'))

const switchPrompt = computed(() =>
  isRegister.value ? 'já possui conta?' : 'ainda não possui conta?',
)

const switchActionLabel = computed(() => (isRegister.value ? 'login' : 'criar conta'))

function clearErrors() {
  errors.username = ''
  errors.email = ''
  errors.password = ''
}

watch(
  () => [route?.name, route?.path, props.initialMode] as const,
  () => {
    const routeMode = resolveModeFromRoute()
    const nextMode = routeMode ?? props.initialMode
    if (nextMode && nextMode !== mode.value) {
      mode.value = nextMode
      clearErrors()
    }
  },
)

function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.includes('@') && !trimmed.startsWith('@') && !trimmed.endsWith('@')
}

function validateForm(): boolean {
  clearErrors()
  let valid = true

  if (isRegister.value && form.username.trim().length === 0) {
    errors.username = 'Informe seu nome de usuário.'
    valid = false
  }

  if (form.email.trim().length === 0) {
    errors.email = 'Informe seu email.'
    valid = false
  } else if (!isValidEmail(form.email)) {
    errors.email = 'Informe um email válido contendo @.'
    valid = false
  }

  if (form.password.length === 0) {
    errors.password = 'Informe sua senha.'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = 'A senha deve ter no mínimo 6 caracteres.'
    valid = false
  }

  return valid
}

function handleSubmit() {
  if (!validateForm()) {
    toast.error('Revise os campos obrigatórios antes de continuar.')
    return
  }

  if (isRegister.value) {
    toast.success('Conta criada com sucesso! Bem-vindo ao prismon.')
  } else {
    toast.success('Login realizado com sucesso!')
  }

  void router.push('/chat')
}

function toggleMode() {
  const nextMode: AuthMode = isRegister.value ? 'login' : 'register'
  mode.value = nextMode
  clearErrors()

  const targetPath = nextMode === 'register' ? '/cadastro' : '/login'
  const hasTargetRoute = router.getRoutes().some((record) => record.path === targetPath)
  if (hasTargetRoute && route.path !== targetPath) {
    void router.push(targetPath)
  }
}

function handleExploreUiKit() {
  void router.push('/ui-kit')
}

function openForgotModal() {
  recoveryEmail.value = form.email.trim()
  recoveryError.value = ''
  forgotModalOpen.value = true
}

function resetForgotModal() {
  recoveryEmail.value = ''
  recoveryError.value = ''
}

function closeForgotModal() {
  forgotModalOpen.value = false
  resetForgotModal()
}

function handleForgotSubmit() {
  const trimmed = recoveryEmail.value.trim()
  if (trimmed.length === 0 || !isValidEmail(trimmed)) {
    recoveryError.value = 'Informe um email válido contendo @.'
    toast.error('Informe um email válido para recuperação.')
    return
  }

  toast.info(`Enviamos um link de recuperação para ${trimmed}.`)
  closeForgotModal()
}
</script>

<template>
  <main class="auth-view" :class="`auth-view--${mode}`">
    <section class="auth-view__panel" aria-label="Autenticação Prismon">
      <div class="auth-view__form-box">
        <Transition name="auth-view-switch" mode="out-in">
          <div :key="mode" class="auth-view__content">
            <header class="auth-view__header">
              <h1 class="auth-view__title">{{ headerTitle }}</h1>
              <p class="auth-view__subtitle">{{ headerSubtitle }}</p>
            </header>

            <form class="auth-view__form" novalidate @submit.prevent="handleSubmit">
              <div class="auth-view__fields">
                <TextInput
                  v-if="isRegister"
                  v-model="form.username"
                  label="username"
                  name="username"
                  placeholder="Digite seu nome"
                  help-text="Use seu nome ou apelido público"
                  autocomplete="username"
                  :error="errors.username"
                  @update:model-value="errors.username = ''"
                />

                <TextInput
                  v-model="form.email"
                  label="email"
                  name="email"
                  type="email"
                  placeholder="Digite seu email"
                  :help-text="isRegister ? 'Enviaremos avisos do workspace' : undefined"
                  autocomplete="email"
                  :error="errors.email"
                  @update:model-value="errors.email = ''"
                />

                <TextInput
                  v-model="form.password"
                  label="senha"
                  name="password"
                  type="password"
                  placeholder="Digite sua senha"
                  :help-text="isRegister ? 'Mínimo de 6 caracteres' : undefined"
                  :autocomplete="isRegister ? 'new-password' : 'current-password'"
                  :error="errors.password"
                  @update:model-value="errors.password = ''"
                />
              </div>

              <div v-if="!isRegister" class="auth-view__forgot-row">
                <button type="button" class="auth-view__forgot-link" @click="openForgotModal">
                  esqueci minha senha
                </button>
              </div>

              <div class="auth-view__actions">
                <Button type="submit" variant="primary" size="md" :full-width="true">
                  {{ submitLabel }}
                </Button>

                <p class="auth-view__switch">
                  <span class="auth-view__switch-text">{{ switchPrompt }}</span>
                  <button type="button" class="auth-view__switch-link" @click="toggleMode">
                    {{ switchActionLabel }}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </Transition>

        <div class="auth-view__explore">
          <Button variant="ghost" size="sm" @click="handleExploreUiKit"> Explorar UI Kit </Button>
        </div>
      </div>
    </section>

    <aside class="auth-view__media" aria-label="Ilustração Prismon">
      <img :src="heroRobotImg" alt="Ilustração do robô Prismon" class="auth-view__image" />
    </aside>

    <Modal
      v-model:open="forgotModalOpen"
      size="sm"
      title="recuperar senha"
      subtitle="Informe seu email para receber as instruções de acesso."
      @close="resetForgotModal"
    >
      <form
        id="auth-forgot-form"
        class="auth-view__modal-form"
        novalidate
        @submit.prevent="handleForgotSubmit"
      >
        <TextInput
          v-model="recoveryEmail"
          label="email"
          name="recovery-email"
          type="email"
          placeholder="Digite seu email"
          autocomplete="email"
          :error="recoveryError"
          @update:model-value="recoveryError = ''"
        />
      </form>

      <template #footer>
        <Button variant="tertiary" size="sm" @click="closeForgotModal">cancelar</Button>
        <Button type="submit" form="auth-forgot-form" variant="primary" size="sm">
          enviar link
        </Button>
      </template>
    </Modal>
  </main>
</template>

<style scoped>
.auth-view {
  --auth-view-bg: var(--surface-base);
  --auth-view-panel-bg: var(--surface-elevated);
  --auth-view-panel-padding-y: var(--spacing-8);
  --auth-view-panel-padding-x: var(--spacing-7);
  --auth-view-form-max-width: 360px;
  --auth-view-box-gap: var(--spacing-7);
  --auth-view-content-gap: var(--spacing-6);
  --auth-view-header-gap: var(--spacing-2);
  --auth-view-form-gap: var(--spacing-5);
  --auth-view-fields-gap: var(--spacing-4);
  --auth-view-actions-gap: var(--spacing-4);
  --auth-view-title-color: var(--text-primary);
  --auth-view-title-font-family: var(--type-heading-05-font-family);
  --auth-view-title-font-size: var(--type-heading-05-font-size);
  --auth-view-title-line-height: var(--type-heading-05-line-height);
  --auth-view-title-font-weight: var(--type-heading-05-font-weight);
  --auth-view-title-text-transform: var(--type-heading-05-text-transform);
  --auth-view-subtitle-color: var(--text-tertiary);
  --auth-view-subtitle-font-family: var(--type-body-02-font-family);
  --auth-view-subtitle-font-size: var(--type-body-02-font-size);
  --auth-view-subtitle-line-height: var(--type-body-02-line-height);
  --auth-view-subtitle-font-weight: var(--type-body-02-font-weight);
  --auth-view-subtitle-text-transform: var(--type-body-02-text-transform);
  --auth-view-meta-color: var(--text-tertiary);
  --auth-view-meta-font-family: var(--type-body-01-font-family);
  --auth-view-meta-font-size: var(--type-body-01-font-size);
  --auth-view-meta-line-height: var(--type-body-01-line-height);
  --auth-view-meta-font-weight: var(--type-body-01-font-weight);
  --auth-view-link-color: var(--text-brand);
  --auth-view-link-color-hover: var(--text-brand-strong);
  --auth-view-focus-ring: var(--shadow-focus-ring);
  --auth-view-media-bg: var(--surface-base);
  --auth-view-media-height: 100%;
  --auth-view-border-color: var(--border-subtle-1);
  --auth-view-border-width: var(--border-width-thin);
  --auth-view-radius: var(--radius-none);
  --auth-view-switch-duration: var(--duration-fast);
  --auth-view-switch-easing: var(--easing-out);
  --auth-view-switch-offset: var(--spacing-2);
  --auth-view-transition-duration: var(--duration-fast);
  --auth-view-transition-easing: var(--easing-hover);
  --auth-view-press-scale: var(--scale-press);

  display: grid;
  grid-template-columns: minmax(420px, 532px) 1fr;
  min-height: 100dvh;
  width: 100%;
  background-color: var(--auth-view-bg);
  overflow-x: hidden;
}

.auth-view__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: var(--spacing-0);
  padding: var(--auth-view-panel-padding-y) var(--auth-view-panel-padding-x);
  background-color: var(--auth-view-panel-bg);
  border-right: var(--auth-view-border-width) solid var(--auth-view-border-color);
}

.auth-view__form-box {
  display: flex;
  flex-direction: column;
  gap: var(--auth-view-box-gap);
  width: 100%;
  max-width: var(--auth-view-form-max-width);
}

.auth-view__content {
  display: flex;
  flex-direction: column;
  gap: var(--auth-view-content-gap);
}

.auth-view__header {
  display: flex;
  flex-direction: column;
  gap: var(--auth-view-header-gap);
}

.auth-view__title {
  margin: var(--spacing-0);
  color: var(--auth-view-title-color);
  font-family: var(--auth-view-title-font-family);
  font-size: var(--auth-view-title-font-size);
  line-height: var(--auth-view-title-line-height);
  font-weight: var(--auth-view-title-font-weight);
  text-transform: var(--auth-view-title-text-transform);
}

.auth-view__subtitle {
  margin: var(--spacing-0);
  color: var(--auth-view-subtitle-color);
  font-family: var(--auth-view-subtitle-font-family);
  font-size: var(--auth-view-subtitle-font-size);
  line-height: var(--auth-view-subtitle-line-height);
  font-weight: var(--auth-view-subtitle-font-weight);
  text-transform: var(--auth-view-subtitle-text-transform);
}

.auth-view__form {
  display: flex;
  flex-direction: column;
  gap: var(--auth-view-form-gap);
}

.auth-view__fields {
  display: flex;
  flex-direction: column;
  gap: var(--auth-view-fields-gap);
}

.auth-view__forgot-row {
  display: flex;
  justify-content: flex-end;
  margin-top: calc(var(--spacing-3) * -1);
}

.auth-view__forgot-link,
.auth-view__switch-link {
  padding: var(--spacing-0);
  border: var(--border-width-none);
  border-radius: var(--auth-view-radius);
  background-color: var(--surface-transparent);
  color: var(--auth-view-link-color);
  font-family: var(--auth-view-meta-font-family);
  font-size: var(--auth-view-meta-font-size);
  line-height: var(--auth-view-meta-line-height);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition:
    color var(--auth-view-transition-duration) var(--auth-view-transition-easing),
    transform var(--auth-view-transition-duration) var(--auth-view-switch-easing);
}

.auth-view__forgot-link:focus-visible,
.auth-view__switch-link:focus-visible {
  outline: none;
  box-shadow: var(--auth-view-focus-ring);
}

.auth-view__forgot-link:active,
.auth-view__switch-link:active {
  transform: scale(var(--auth-view-press-scale));
}

.auth-view__actions {
  display: flex;
  flex-direction: column;
  gap: var(--auth-view-actions-gap);
}

.auth-view__switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  margin: var(--spacing-0);
  color: var(--auth-view-meta-color);
  font-family: var(--auth-view-meta-font-family);
  font-size: var(--auth-view-meta-font-size);
  line-height: var(--auth-view-meta-line-height);
  font-weight: var(--auth-view-meta-font-weight);
}

.auth-view__explore {
  display: flex;
  justify-content: center;
}

.auth-view__media {
  position: relative;
  min-width: var(--spacing-0);
  min-height: var(--spacing-0);
  height: var(--auth-view-media-height);
  background-color: var(--auth-view-media-bg);
  overflow: hidden;
}

.auth-view__image {
  position: absolute;
  inset: var(--spacing-0);
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-view__modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

@media (hover: hover) and (pointer: fine) {
  .auth-view__forgot-link:hover,
  .auth-view__switch-link:hover {
    color: var(--auth-view-link-color-hover);
    text-decoration: underline;
  }
}

.auth-view-switch-enter-active,
.auth-view-switch-leave-active {
  transition:
    opacity var(--auth-view-switch-duration) var(--auth-view-switch-easing),
    transform var(--auth-view-switch-duration) var(--auth-view-switch-easing);
}

.auth-view-switch-enter-from {
  opacity: var(--opacity-hidden);
  transform: translateY(var(--auth-view-switch-offset));
}

.auth-view-switch-leave-to {
  opacity: var(--opacity-hidden);
  transform: translateY(calc(var(--auth-view-switch-offset) * -1));
}

@media (max-width: 767px) {
  .auth-view {
    --auth-view-panel-padding-y: var(--spacing-6);
    --auth-view-panel-padding-x: var(--spacing-5);
    --auth-view-media-height: 168px;

    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .auth-view__media {
    order: -1;
    border-bottom: var(--auth-view-border-width) solid var(--auth-view-border-color);
  }

  .auth-view__panel {
    justify-content: flex-start;
    border-right: var(--border-width-none);
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-view {
    --auth-view-switch-offset: var(--spacing-0);
    --auth-view-press-scale: 1;
  }
}
</style>
