import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan, initPlan } from '../context/PlanContext';
import {
  isGoogleConfigured,
  requestAccessToken,
  initGoogleClient,
  extractSpreadsheetId,
  openSpreadsheetPicker,
} from '../lib/google/auth';
import { createGooglePlan, linkGooglePlan, checkSyncConflict } from '../lib/sync/engine';
import { loadPlan } from '../lib/csv/store';

export function OnboardingPage() {
  const { setPlan } = usePlan();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const goOffline = async () => {
    setBusy(true);
    try {
      const plan = await initPlan();
      await setPlan(plan);
      navigate('/');
    } finally {
      setBusy(false);
    }
  };

  const goCreateGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await initGoogleClient();
      await requestAccessToken('consent');
      const base = await initPlan();
      const plan = await createGooglePlan(base);
      await setPlan(plan);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create plan');
    } finally {
      setBusy(false);
    }
  };

  const goLink = async (spreadsheetId: string) => {
    setError('');
    setBusy(true);
    try {
      await initGoogleClient();
      await requestAccessToken('');
      const existing = await loadPlan();
      const conflict = existing
        ? await checkSyncConflict({
            ...existing,
            meta: { ...existing.meta, spreadsheetId },
          })
        : null;
      if (conflict) {
        const ok = window.confirm(
          `The online spreadsheet was modified more recently (${new Date(conflict.remoteModifiedAt).toLocaleString()}). Replace local data with remote?`,
        );
        if (!ok) {
          setBusy(false);
          return;
        }
      }
      const plan = await linkGooglePlan(spreadsheetId);
      await setPlan(plan);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to link plan');
    } finally {
      setBusy(false);
    }
  };

  const linkFromUrl = async () => {
    const id = extractSpreadsheetId(url) ?? url.trim();
    if (!id) {
      setError('Invalid spreadsheet URL or ID');
      return;
    }
    await goLink(id);
  };

  const linkFromPicker = async () => {
    setError('');
    setBusy(true);
    try {
      await initGoogleClient();
      await requestAccessToken('');
      const id = await openSpreadsheetPicker();
      await goLink(id);
    } catch (e) {
      if (e instanceof Error && e.message !== 'Cancelled') {
        setError(e.message);
      }
      setBusy(false);
    }
  };

  return (
    <div className="page onboarding">
      <h1>Let's Make a Plan</h1>
      <p className="subtitle">Track diet, exercise, and de-stress — your data stays yours.</p>

      <section className="card">
        <h2>Get started</h2>
        <button type="button" className="btn primary" onClick={goOffline} disabled={busy}>
          Use offline (CSV)
        </button>
        <p className="hint">No sign-in. Data stored on this device. Export anytime.</p>
      </section>

      {isGoogleConfigured() && (
        <section className="card">
          <h2>Google Drive sync</h2>
          <button type="button" className="btn primary" onClick={goCreateGoogle} disabled={busy}>
            Create new plan
          </button>
          <button type="button" className="btn secondary" onClick={linkFromPicker} disabled={busy}>
            Link existing plan (Picker)
          </button>
          <div className="link-row">
            <input
              type="url"
              placeholder="Paste Google Sheets URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="button" className="btn secondary" onClick={linkFromUrl} disabled={busy}>
              Link
            </button>
          </div>
        </section>
      )}

      {!isGoogleConfigured() && (
        <p className="hint">
          Set VITE_GOOGLE_CLIENT_ID in .env to enable Google sync.
        </p>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
