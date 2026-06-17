const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ');

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
export const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY ?? '';
export const GOOGLE_APP_ID = import.meta.env.VITE_GOOGLE_APP_ID ?? '';

let gapiLoaded = false;
let gisLoaded = false;
let accessToken: string | null = null;

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void;
};

let tokenClient: TokenClient | null = null;
let onTokenReady: ((token: string) => void) | null = null;

export function isGoogleConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function loadGoogleScripts(): Promise<void> {
  return Promise.all([loadGapi(), loadGis()]).then(() => undefined);
}

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function loadGapi(): Promise<void> {
  if (gapiLoaded) return;
  await loadScript('https://apis.google.com/js/api.js', 'gapi-script');
  await new Promise<void>((resolve) => {
    gapi.load('client:picker', () => {
      gapiLoaded = true;
      resolve();
    });
  });
}

async function loadGis(): Promise<void> {
  if (gisLoaded) return;
  await loadScript('https://accounts.google.com/gsi/client', 'gis-script');
  gisLoaded = true;
}

export async function initGoogleClient(): Promise<void> {
  await loadGoogleScripts();
  if (!GOOGLE_CLIENT_ID) return;

  await gapi.client.init({
    apiKey: GOOGLE_API_KEY || undefined,
    discoveryDocs: [
      'https://sheets.googleapis.com/$discovery/rest?version=v4',
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    ],
  });

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.error) {
        console.error(resp);
        return;
      }
      accessToken = resp.access_token;
      gapi.client.setToken({ access_token: resp.access_token });
      onTokenReady?.(resp.access_token);
    },
  }) as TokenClient;
}

export function requestAccessToken(prompt: '' | 'consent' = ''): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google client not initialized'));
      return;
    }
    onTokenReady = resolve;
    tokenClient.requestAccessToken({ prompt });
  });
}

export function signOutGoogle(): void {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => undefined);
  }
  accessToken = null;
  gapi.client.setToken(null);
}

export function extractSpreadsheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

export function openSpreadsheetPicker(): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = getAccessToken();
    if (!token) {
      reject(new Error('Not signed in'));
      return;
    }
    const picker = new google.picker.PickerBuilder()
      .setAppId(GOOGLE_APP_ID || GOOGLE_CLIENT_ID.split('-')[0] || '')
      .setOAuthToken(token)
      .addView(google.picker.ViewId.SPREADSHEETS)
      .setCallback((data: { action: string; docs?: { id: string }[] }) => {
        if (data.action === google.picker.Action.PICKED && data.docs?.[0]) {
          resolve(data.docs[0].id);
        } else if (data.action === google.picker.Action.CANCEL) {
          reject(new Error('Cancelled'));
        }
      })
      .build();
    picker.setVisible(true);
  });
}
