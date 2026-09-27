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

async function request<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(
      0,
      'Не удалось подключиться к серверу. Попробуйте ещё раз.',
    );
  }
  signal?.throwIfAborted();
  if (!response.ok) {
    const message =
      response.status === 401
        ? path === '/auth/login'
          ? 'Неверный email или пароль.'
          : 'Срок входа истёк. Войдите снова.'
        : response.status === 409
          ? 'Пользователь с таким email уже существует.'
          : response.status === 422
            ? path === '/auth/register'
              ? 'Проверьте email и пароль. Пароль: от 8 символов, до 72 байт UTF-8.'
              : 'Проверьте введённые данные.'
            : response.status === 404
              ? 'Встреча не найдена.'
              : 'Сервер не смог выполнить запрос. Попробуйте ещё раз.';
    if (response.status === 401 && !path.startsWith('/auth/login'))
      clearToken();
    throw new ApiError(response.status, message);
  }
  try {
    return (await response.json()) as T;
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(
      response.status,
      'Сервер вернул некорректный ответ. Попробуйте ещё раз.',
    );
  }
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось выполнить запрос.';

export const api = {
  authenticate: (
    mode: AuthMode,
    credentials: Credentials,
    signal?: AbortSignal,
  ) => request<Token>(`/auth/${mode}`, credentials, signal),
  me: (signal?: AbortSignal) => request<User>('/auth/me', undefined, signal),
  meetings: (signal?: AbortSignal) =>
    request<Meeting[]>('/meetings', undefined, signal),
  createMeeting: (meeting: MeetingCreate, signal?: AbortSignal) =>
    request<Meeting>('/meetings', meeting, signal),
};
