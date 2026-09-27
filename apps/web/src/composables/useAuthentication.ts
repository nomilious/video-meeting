import { onScopeDispose, reactive, readonly, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { api, errorMessage } from '../api/client';
import { saveToken } from '../api/session';
import type { AuthMode, Feedback } from '../types';

export function useAuthentication(mode: Readonly<Ref<AuthMode>>) {
  const router = useRouter();
  const credentials = reactive({ email: '', password: '' });
  const pending = shallowRef(false);
  const feedback = shallowRef<Feedback | null>(null);
  let request: AbortController | undefined;

  function cancel() {
    request?.abort();
    request = undefined;
    pending.value = false;
  }

  watch(
    mode,
    () => {
      cancel();
      credentials.password = '';
      feedback.value = null;
    },
    { flush: 'sync' },
  );
  onScopeDispose(cancel);

  async function submit() {
    if (pending.value) return;
    const controller = new AbortController();
    request = controller;
    pending.value = true;
    feedback.value = null;
    const submittedMode = mode.value;
    try {
      const result = await api.authenticate(
        submittedMode,
        {
          email: credentials.email.trim(),
          password: credentials.password,
        },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      if (submittedMode === 'register') {
        feedback.value = {
          kind: 'success',
          message: 'Аккаунт создан. Теперь войдите в него.',
        };
        credentials.password = '';
        return;
      }
      saveToken(result.gvtToken);
      await router.replace('/meetings');
    } catch (error) {
      if (!controller.signal.aborted)
        feedback.value = { kind: 'error', message: errorMessage(error) };
    } finally {
      if (request === controller) {
        request = undefined;
        pending.value = false;
      }
    }
  }

  return {
    credentials,
    pending: readonly(pending),
    feedback: readonly(feedback),
    submit,
  };
}
