/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_GOOGLE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const gapi: {
  load: (name: string, cb: () => void) => void;
  client: {
    init: (cfg: object) => Promise<void>;
    setToken: (token: { access_token: string } | null) => void;
    getToken: () => { access_token: string } | null;
    sheets: {
      spreadsheets: {
        create: (r: object) => Promise<{ result: { spreadsheetId: string } }>;
        values: {
          batchUpdate: (r: object) => Promise<unknown>;
          batchGet: (r: object) => Promise<{
            result: { valueRanges: { range: string; values?: string[][] }[] };
          }>;
        };
        batchUpdate: (r: object) => Promise<unknown>;
      };
    };
    drive: {
      files: {
        get: (r: object) => Promise<{ result: { modifiedTime: string } }>;
        copy: (r: object) => Promise<{ result: { id: string } }>;
      };
    };
  };
};

declare const google: {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (resp: { access_token: string; error?: string }) => void;
      }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
      revoke: (token: string, cb: () => void) => void;
    };
  };
  picker: {
    Action: { PICKED: string; CANCEL: string };
    ViewId: { SPREADSHEETS: string };
    PickerBuilder: new () => {
      setAppId: (id: string) => PickerBuilderInstance;
      setOAuthToken: (t: string) => PickerBuilderInstance;
      addView: (view: string) => PickerBuilderInstance;
      setCallback: (
        cb: (data: { action: string; docs?: { id: string }[] }) => void,
      ) => PickerBuilderInstance;
      build: () => { setVisible: (v: boolean) => void };
    };
  };
};

interface PickerBuilderInstance {
  setAppId: (id: string) => PickerBuilderInstance;
  setOAuthToken: (t: string) => PickerBuilderInstance;
  addView: (view: string) => PickerBuilderInstance;
  setCallback: (
    cb: (data: { action: string; docs?: { id: string }[] }) => void,
  ) => PickerBuilderInstance;
  build: () => { setVisible: (v: boolean) => void };
}
