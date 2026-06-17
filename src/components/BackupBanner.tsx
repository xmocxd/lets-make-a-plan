import { usePlan } from '../context/PlanContext';

export function BackupBanner() {
  const { backupMessage, backupError, clearBackupBanner } = usePlan();
  if (!backupMessage && !backupError) return null;

  return (
    <div className={`backup-banner ${backupError ? 'error' : ''}`} role="status">
      {backupMessage && (
        <>
          <span className="spinner" aria-hidden />
          <span>{backupMessage}</span>
        </>
      )}
      {backupError && (
        <>
          <span>{backupError}</span>
          <button type="button" className="banner-dismiss" onClick={clearBackupBanner}>
            Dismiss
          </button>
        </>
      )}
    </div>
  );
}
