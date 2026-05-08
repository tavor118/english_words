import type { Word } from '../types';

const FILE_NAME = 'words.json';
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => TokenClient;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

interface TokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: TokenResponse) => void;
  error_callback?: (error: { type: string; message?: string }) => void;
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: '' | 'consent' | 'select_account' }) => void;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface DriveFile {
  id: string;
  modifiedTime: string;
}

let tokenClient: TokenClient | null = null;
let accessToken: string | null = null;
let tokenExpiresAt = 0;

export function getClientId(): string | undefined {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
}

export function isConfigured(): boolean {
  return !!getClientId();
}

function waitForGis(): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.google?.accounts?.oauth2) return resolve();
      if (Date.now() - start > 10000) return reject(new Error('Google Identity Services failed to load'));
      setTimeout(tick, 50);
    };
    tick();
  });
}

async function ensureTokenClient(): Promise<TokenClient> {
  if (tokenClient) return tokenClient;
  const clientId = getClientId();
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID is not set');
  await waitForGis();
  tokenClient = window.google!.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: () => {},
  });
  return tokenClient;
}

function requestToken(prompt: '' | 'consent'): Promise<string> {
  return new Promise((resolve, reject) => {
    ensureTokenClient()
      .then((client) => {
        (client as unknown as { callback: (r: TokenResponse) => void }).callback = (response) => {
          if (response.error || !response.access_token) {
            reject(new Error(response.error || 'No access token returned'));
            return;
          }
          accessToken = response.access_token;
          tokenExpiresAt = Date.now() + (response.expires_in ?? 3600) * 1000 - 60_000;
          resolve(response.access_token);
        };
        (client as unknown as { error_callback: (e: { type: string }) => void }).error_callback = (err) => {
          reject(new Error(err.type || 'Authorization failed'));
        };
        client.requestAccessToken({ prompt });
      })
      .catch(reject);
  });
}

export async function signIn(): Promise<void> {
  await requestToken('consent');
}

export function signOut(): void {
  if (accessToken && window.google?.accounts.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiresAt = 0;
}

export function isSignedIn(): boolean {
  return !!accessToken && Date.now() < tokenExpiresAt;
}

async function getValidToken(): Promise<string> {
  if (isSignedIn()) return accessToken!;
  return requestToken('');
}

async function driveFetch(path: string, init?: RequestInit, baseUrl = DRIVE_API): Promise<Response> {
  const token = await getValidToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    accessToken = null;
    tokenExpiresAt = 0;
    const retryToken = await getValidToken();
    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        Authorization: `Bearer ${retryToken}`,
      },
    });
  }
  return res;
}

async function findFile(): Promise<DriveFile | null> {
  const res = await driveFetch(
    `/files?spaces=appDataFolder&q=${encodeURIComponent(`name='${FILE_NAME}' and trashed=false`)}&fields=files(id,modifiedTime)`
  );
  if (!res.ok) throw new Error(`Drive list failed: ${res.status}`);
  const data = (await res.json()) as { files: DriveFile[] };
  return data.files[0] ?? null;
}

interface RemoteState {
  words: Word[];
  modifiedTime: string;
}

export async function downloadWords(): Promise<RemoteState | null> {
  const file = await findFile();
  if (!file) return null;
  const res = await driveFetch(`/files/${file.id}?alt=media`);
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  const words = (await res.json()) as Word[];
  return { words, modifiedTime: file.modifiedTime };
}

export async function uploadWords(words: Word[]): Promise<string> {
  const existing = await findFile();
  const body = JSON.stringify(words);

  if (!existing) {
    const boundary = `boundary_${Math.random().toString(36).slice(2)}`;
    const metadata = JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] });
    const multipart =
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      'Content-Type: application/json\r\n\r\n' +
      `${body}\r\n` +
      `--${boundary}--`;
    const res = await driveFetch(
      '/files?uploadType=multipart&fields=id,modifiedTime',
      {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: multipart,
      },
      UPLOAD_API
    );
    if (!res.ok) throw new Error(`Drive create failed: ${res.status}`);
    const data = (await res.json()) as DriveFile;
    return data.modifiedTime;
  }

  const res = await driveFetch(
    `/files/${existing.id}?uploadType=media&fields=id,modifiedTime`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    },
    UPLOAD_API
  );
  if (!res.ok) throw new Error(`Drive update failed: ${res.status}`);
  const data = (await res.json()) as DriveFile;
  return data.modifiedTime;
}
