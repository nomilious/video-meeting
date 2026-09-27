import { computed, onMounted, onScopeDispose, readonly, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { api, ApiError, errorMessage } from '../api/client';
import type { Meeting, MeetingCreate } from '../api/client';
import { clearToken } from '../api/session';
import type { Feedback, LoadStatus } from '../types';

export function useMeetings() {
  const router = useRouter();
  const meetings = shallowRef<readonly Meeting[]>([]);
  const email = shallowRef('');
  const status = shallowRef<LoadStatus>('loading');
  const pending = shallowRef(false);
  const feedback = shallowRef<Feedback | null>(null);
  const controller = new AbortController();
  onScopeDispose(() => controller.abort());

  async function reportError(error: unknown) {
    if (controller.signal.aborted) return;
    if (error instanceof ApiError && error.status === 401) {
      clearToken();
      await router.replace('/auth/Login');
      return;
    }
    feedback.value = { kind: 'error', message: errorMessage(error) };
  }

  async function load() {
    if (controller.signal.aborted) return;
    status.value = 'loading';
    feedback.value = null;
    try {
      const [user, items] = await Promise.all([
        api.me(controller.signal),
        api.meetings(controller.signal),
      ]);
      if (controller.signal.aborted) return;
      email.value = user.email;
      meetings.value = items;
      status.value = 'ready';
    } catch (error) {
      if (controller.signal.aborted) return;
      status.value = 'error';
      await reportError(error);
    }
  }

  async function create(meeting: MeetingCreate): Promise<boolean> {
    if (pending.value || controller.signal.aborted) return false;
    pending.value = true;
    feedback.value = null;
    try {
      const created = await api.createMeeting(meeting, controller.signal);
      if (controller.signal.aborted) return false;
      meetings.value = [...meetings.value, created].sort(
        (a, b) => Date.parse(a.date) - Date.parse(b.date),
      );
      feedback.value = { kind: 'success', message: 'Встреча создана.' };
      return true;
    } catch (error) {
      await reportError(error);
      return false;
    } finally {
      pending.value = false;
    }
  }

  async function logout() {
    controller.abort();
    clearToken();
    await router.replace('/auth/Login');
  }

  onMounted(load);
  return {
    meetings: computed(() => meetings.value),
    email: readonly(email),
    status: readonly(status),
    pending: readonly(pending),
    feedback: readonly(feedback),
    load,
    create,
    logout,
  };
}
