import { Dispatcher, request } from 'undici';
import { UserRole } from '@repo/types/users/roles';
import { ErrorResponse, SuccessResponse } from '@repo/types/trpc/response';
import { parsedEnv } from '../../../utils/envSchema';

export async function req<T extends ErrorResponse | SuccessResponse>(
  method: 'GET' | 'POST' = 'POST',
  procedure: string,
  input?: unknown,
  token?: string
): Promise<T> {

  if (procedure.startsWith('/')) {
    procedure = procedure.slice(1);
  }

  const url = `${parsedEnv.BASE_URL}/trpc/${procedure}`;

  const headers: Record<string, string> = {};
  headers['Content-Type'] = 'application/json';
  
  if (token) {
    headers['cookie'] = `accessToken=${token}`;
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
    console.log('Error:', json.error);
    return json.error;
  }

  console.log('Success:', json.result!.data);
  return json.result!.data;
}

export async function getToken(userRole: UserRole) {
  switch (userRole) {
    case UserRole.SUPER_ADMIN:
      return getSuperAdminToken();
    case UserRole.ADMIN:
      return getAdminToken();
    case UserRole.USER:
      return getUserToken();
    default:
      throw new Error('Not implemented!');
  }

  async function getSuperAdminToken() {
    const res = await req<SuccessResponse<{ accessToken: string }>>(
      'POST',
      'auth.login',
      {
        username: parsedEnv.SUPERADMIN_USERNAME,
        password: parsedEnv.SUPERADMIN_PASSWORD,
        organizationName: parsedEnv.SUPERADMIN_ORGANIZATION,
      }
    );

    if (!res.accessToken) {
      throw new Error('Failed to retrieve Super Admin Token');
    }
    return res.accessToken;
  }

  async function getAdminToken() {
    const res = await req<SuccessResponse<{ accessToken: string }>>(
      'POST',
      'auth.login',
      {
        username: parsedEnv.ADMIN_USERNAME,
        password: parsedEnv.ADMIN_PASSWORD,
        organizationName: parsedEnv.ADMIN_ORGANIZATION,
      }
    );

    if (!res.accessToken) {
      throw new Error('Failed to retrieve Admin Token');
    }
    return res.accessToken;
  }

  async function getUserToken() {
    const res = await req<SuccessResponse<{ accessToken: string }>>(
      'POST',
      'auth.login',
      {
        username: parsedEnv.USER_USERNAME,
        password: parsedEnv.USER_PASSWORD,
        organizationName: parsedEnv.USER_ORGANIZATION,
      }
    );

    if (!res.accessToken) {
      throw new Error('Failed to retrieve User Token');
    }
    return res.accessToken;
  }
}
