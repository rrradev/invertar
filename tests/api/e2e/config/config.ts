import { Dispatcher, request } from 'undici';
import { UserRole } from '@repo/types/users/roles';
import { ErrorResponse, SuccessResponse } from '@repo/types/trpc/response';

export const baseUrl = process.env.BASE_USER ?? 'http://localhost:3000';

export async function req<T extends ErrorResponse | SuccessResponse>(
  method: 'GET' | 'POST' = 'POST',
  procedure: string,
  input?: unknown,
  token?: string
): Promise<T> {

  if (procedure.startsWith('/')) {
    procedure = procedure.slice(1);
  }

  const url = `${baseUrl}/trpc/${procedure}`;

  const headers: Record<string, string> = {};

  if (method !== 'GET' && input !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: Omit<Dispatcher.RequestOptions, 'origin' | 'path' | 'method'> &
    Partial<Pick<Dispatcher.RequestOptions, 'method'>> = {
    method,
    headers,
  };

  if (method !== 'GET' && input !== undefined) {
    options.body = JSON.stringify(input);
  }

  const res = await request(url, options);
  const json = (await res.body.json()) as { result?: { data: T }; error?: any };

  if (json.error) {
    return json.error;
  }

  return json.result!.data;
}

export async function getToken(userRole: UserRole) {
  switch (userRole) {
    case UserRole.SUPER_ADMIN:
      return getSuperAdminToken();
    default:
      throw new Error('Not implemented!');
  }

  async function getSuperAdminToken() {
    const res = await req<SuccessResponse<{ token: string }>>(
      'POST',
      'auth.login',
      {
        username: process.env.SUPERADMIN_USERNAME,
        password: process.env.SUPERADMIN_PASSWORD,
        organizationName: process.env.SUPERADMIN_ORGANIZATION,
      }
    );

    if (!res.token) {
      throw new Error('Failed to retrieve Super Admin Token');
    }
    return res.token;
  }
}
