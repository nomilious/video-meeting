const tokenKey = 'gvtToken';

export const getToken = () => sessionStorage.getItem(tokenKey);
export const clearToken = () => sessionStorage.removeItem(tokenKey);

export function saveToken(token: string) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Сервер не вернул токен авторизации.');
  }

  sessionStorage.setItem(tokenKey, token);
}
