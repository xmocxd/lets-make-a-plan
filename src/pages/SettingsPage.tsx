import { useState } from 'react';
import { usePlan } from '../context/PlanContext';
import {
  exportAndDownload,
  importFromFile,
  syncPush,
  syncPull,
  checkSyncConflict,
} from '../lib/sync/engine';
import {
  isGoogleConfigured,
  requestAccessToken,
  initGoogleClient,
  signOutGoogle,
} from '../lib/google/auth';
import { createGooglePlan } from '../lib/sync/engine';
import { listLocalBackups, restoreLocalBackup } from '../lib/csv/store';

export function SettingsPage() {
  const { plan, updateSettings, setPlan, triggerBackup } = usePlan();
  const [syncStatus, setSyncStatus] = useState('');
  const [backups, setBackups] = useState<{ slot: number; date?: string }[]>([]);

  if (!plan) return null;

  const s = plan.settings;
  const m = plan.meta;

  const loadBackups = async () => {
    setBackups(await listLocalBackups());
  };

  const handleSync = async () => {
    setSyncStatus('Syncing…');
    try {
      await initGoogleClient();
      await requestAccessToken('');
      const conflict = await checkSyncConflict(plan);
      if (conflict) {
        const useRemote = window.confirm(
          'Online spreadsheet is newer. Pull remote data (OK) or push local (Cancel)?',
        );
        const updated = useRemote ? await syncPull(plan) : await syncPush(plan);
        await setPlan(updated);
      } else {
        const updated = await syncPush(plan);
        await setPlan(updated);
      }
      setSyncStatus('Synced');
    } catch (e) {
      setSyncStatus(e instanceof Error ? e.message : 'Sync failed');
    }
  };

  const connectGoogle = async () => {
    try {
      await initGoogleClient();
      await requestAccessToken('consent');
      const updated = await createGooglePlan(plan);
      await setPlan(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  const restoreBackup = async (slot: number) => {
    if (!window.confirm('Replace current data with this backup?')) return;
    const data = await restoreLocalBackup(slot);
    await setPlan(data);
    await loadBackups();
  };

  return (
    <div className="page">
      <h1>Settings</h1>

      <section className="card">
        <h2>Targets</h2>
        <label className="field">
          Calorie target
          <input
            type="number"
            value={s.calorieTarget}
            onChange={(e) => updateSettings({ calorieTarget: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          Diet exceed max (% slider)
          <input
            type="range"
            min={5}
            max={25}
            value={s.dietCalorieExceedPctMax}
            onChange={(e) =>
              updateSettings({ dietCalorieExceedPctMax: Number(e.target.value) })
            }
          />
          {s.dietCalorieExceedPctMax}%
        </label>
        <label className="field">
          Exercise month goal (%)
          <input
            type="range"
            min={70}
            max={100}
            value={s.exerciseMonthGoalPct}
            onChange={(e) =>
              updateSettings({ exerciseMonthGoalPct: Number(e.target.value) })
            }
          />
          {s.exerciseMonthGoalPct}%
        </label>
        <label className="field">
          De-stress per week
          <input
            type="number"
            min={1}
            max={7}
            value={s.destressPerWeekGoal}
            onChange={(e) =>
              updateSettings({ destressPerWeekGoal: Number(e.target.value) })
            }
          />
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={s.fatTrackingEnabled}
            onChange={(e) => updateSettings({ fatTrackingEnabled: e.target.checked })}
          />
          Track fat
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={s.sugarTrackingEnabled}
            onChange={(e) => updateSettings({ sugarTrackingEnabled: e.target.checked })}
          />
          Track sugar
        </label>
        <label className="field">
          Fat/sugar exceed max (%)
          <input
            type="range"
            min={10}
            max={40}
            value={s.fatSugarExceedPctMax}
            onChange={(e) =>
              updateSettings({ fatSugarExceedPctMax: Number(e.target.value) })
            }
          />
          {s.fatSugarExceedPctMax}%
        </label>
      </section>

      <section className="card">
        <h2>Backup</h2>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={s.autoBackupEnabled}
            onChange={(e) => updateSettings({ autoBackupEnabled: e.target.checked })}
          />
          Auto-backup on app open (weekly, Sunday 3AM schedule)
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={s.driveBackupEnabled}
            onChange={(e) => updateSettings({ driveBackupEnabled: e.target.checked })}
          />
          Google Drive backup duplicate
        </label>
        {m.backupDue && <p className="hint">Backup due — will run on next open if auto enabled.</p>}
        {m.lastLocalBackupAt && (
          <p className="hint">Last local: {new Date(m.lastLocalBackupAt).toLocaleString()}</p>
        )}
        {m.lastDriveBackupAt && (
          <p className="hint">Last Drive: {new Date(m.lastDriveBackupAt).toLocaleString()}</p>
        )}
        <button type="button" className="btn secondary" onClick={triggerBackup}>
          Back up now
        </button>
        <button type="button" className="btn-text" onClick={loadBackups}>
          Show local snapshots
        </button>
        {backups.map((b) => (
          <div key={b.slot} className="list-row">
            <span>
              Snapshot {b.slot + 1}
              {b.date ? ` — ${new Date(b.date).toLocaleString()}` : ''}
            </span>
            <button type="button" className="btn-text" onClick={() => restoreBackup(b.slot)}>
              Restore
            </button>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Data</h2>
        <button type="button" className="btn secondary" onClick={exportAndDownload}>
          Export CSV
        </button>
        <label className="btn secondary file-label">
          Import CSV
          <input
            type="file"
            accept=".csv"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) {
                const data = await importFromFile(f);
                await setPlan(data);
              }
            }}
          />
        </label>
      </section>

      <section className="card">
        <h2>Google sync</h2>
        {m.googleConnected ? (
          <>
            <p className="hint">Spreadsheet linked{m.spreadsheetId ? `: …${m.spreadsheetId.slice(-8)}` : ''}</p>
            <button type="button" className="btn secondary" onClick={handleSync}>
              Sync now
            </button>
            {syncStatus && <p className="hint">{syncStatus}</p>}
            <button type="button" className="btn-text" onClick={() => signOutGoogle()}>
              Sign out Google
            </button>
          </>
        ) : isGoogleConfigured() ? (
          <button type="button" className="btn secondary" onClick={connectGoogle}>
            Connect Google Drive
          </button>
        ) : (
          <p className="hint">Add VITE_GOOGLE_CLIENT_ID to enable sync.</p>
        )}
      </section>
    </div>
  );
}
