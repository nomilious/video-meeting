import type { components } from './schema';
import type { AuthMode } from '../types';
import { clearToken, getToken } from './session';

export type Meeting = components['schemas']['MeetingResponse'];
export type MeetingCreate = components['schemas']['MeetingCreate'];
type Credentials = components['schemas']['Credentials'];
type Token = components['schemas']['TokenResponse'];
type User = components['schemas']['UserResponse'];

const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function responseErrorMessage(status: number, path: string): string {
  switch (status) {
    case 401:
      if (path === '/auth/login') {
        return 'Неверный email или пароль.';
      }
      return 'Срок входа истёк. Войдите снова.';

    case 409:
      return 'Пользователь с таким email уже существует.';

    case 422:
      if (path === '/auth/register') {
        return 'Проверьте email и пароль. Пароль: от 8 символов, до 72 байт UTF-8.';
      }
      return 'Проверьте введённые данные.';

    case 404:
      return 'Встреча не найдена.';

    default:
      return 'Сервер не смог выполнить запрос. Попробуйте ещё раз.';
  }
}

async function request<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const headers = new Headers();
  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    throw new ApiError(0, 'Не удалось подключиться к серверу. Попробуйте ещё раз.');
  }

  signal?.throwIfAborted();

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/login')) {
      clearToken();
    }

    throw new ApiError(response.status, responseErrorMessage(response.status, path));
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    throw new ApiError(response.status, 'Сервер вернул некорректный ответ. Попробуйте ещё раз.');
  }
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось выполнить запрос.';

export const api = {
  authenticate: (mode: AuthMode, credentials: Credentials, signal?: AbortSignal) =>
    request<Token>(`/auth/${mode}`, credentials, signal),
  me: (signal?: AbortSignal) => request<User>('/auth/me', undefined, signal),
  meetings: (signal?: AbortSignal) => request<Meeting[]>('/meetings', undefined, signal),
  createMeeting: (meeting: MeetingCreate, signal?: AbortSignal) =>
    request<Meeting>('/meetings', meeting, signal),
};
