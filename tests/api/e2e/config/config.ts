import { request } from 'undici';

export async function req<T>(
  method: 'GET' | 'POST' = 'POST',
  url: string,
  input?: unknown,
): Promise<T> {
  const options: any = { method };

  if (method === 'GET') {
    input = undefined;
  } else if (input !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(input);
  }
  const res = await request(url, options);
  const json = await res.body.json() as { result?: { data: T }, error?: any };

  if (json.error) return json.error;

  return json.result!.data;
}
