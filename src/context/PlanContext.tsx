import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PlanData, DailyLog, Settings } from '../types/plan';
import { formatDate } from '../lib/dates';
import { loadPlan, savePlan, initPlan } from '../lib/csv/store';
import { getReportCard } from '../lib/scoring';
import { runBackupIfDue, runBackup } from '../lib/backup';
import { scheduleSyncPush, startNewPlan } from '../lib/sync/engine';
import { initGoogleClient } from '../lib/google/auth';

interface PlanContextValue {
  plan: PlanData | null;
  loading: boolean;
  backupMessage: string | null;
  backupError: string | null;
  setPlan: (p: PlanData) => Promise<void>;
  refresh: () => Promise<void>;
  upsertDailyLog: (date: string, patch: Partial<DailyLog>) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  getTodayLog: () => DailyLog;
  report: ReturnType<typeof getReportCard> | null;
  triggerBackup: () => Promise<void>;
  clearBackupBanner: () => void;
  startFreshPlan: () => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const setPlan = useCallback(async (p: PlanData) => {
    await savePlan(p);
    setPlanState(p);
    scheduleSyncPush(p, setPlanState);
  }, []);

  const refresh = useCallback(async () => {
    const p = await loadPlan();
    setPlanState(p);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await initGoogleClient();
        let p = await loadPlan();
        if (p?.meta.onboarded) {
          const { plan: updated, ran } = await runBackupIfDue(p, setBackupMessage);
          p = updated;
          if (ran) {
            setTimeout(() => setBackupMessage(null), 3000);
          }
        }
        setPlanState(p);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== 'visible' || !plan?.meta.onboarded) return;
      const p = await loadPlan();
      if (!p) return;
      const { plan: updated, ran } = await runBackupIfDue(p, setBackupMessage);
      setPlanState(updated);
      if (ran) setTimeout(() => setBackupMessage(null), 3000);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [plan?.meta.onboarded]);

  const upsertDailyLog = useCallback(
    async (date: string, patch: Partial<DailyLog>) => {
      if (!plan) return;
      const idx = plan.dailyLogs.findIndex((l) => l.date === date);
      const base =
        idx >= 0
          ? plan.dailyLogs[idx]
          : {
              date,
              calories: 0,
              calorieEntries: [],
              fat: 0,
              sugar: 0,
              isCheatDay: false,
              fatOverGoal: false,
              sugarOverGoal: false,
              destressDone: false,
              isRestDay: false,
              exerciseActivityIds: [],
            };
      const updated = { ...base, ...patch, date };
      const logs = [...plan.dailyLogs];
      if (idx >= 0) logs[idx] = updated;
      else logs.push(updated);
      await setPlan({ ...plan, dailyLogs: logs });
    },
    [plan, setPlan],
  );

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      if (!plan) return;
      await setPlan({ ...plan, settings: { ...plan.settings, ...patch } });
    },
    [plan, setPlan],
  );

  const getTodayLog = useCallback((): DailyLog => {
    const today = formatDate();
    if (!plan) {
      return {
        date: today,
        calories: 0,
        calorieEntries: [],
        fat: 0,
        sugar: 0,
        isCheatDay: false,
        fatOverGoal: false,
        sugarOverGoal: false,
        destressDone: false,
        isRestDay: false,
        exerciseActivityIds: [],
      };
    }
    return (
      plan.dailyLogs.find((l) => l.date === today) ?? {
        date: today,
        calories: 0,
        calorieEntries: [],
        fat: 0,
        sugar: 0,
        isCheatDay: false,
        fatOverGoal: false,
        sugarOverGoal: false,
        destressDone: false,
        isRestDay: false,
        exerciseActivityIds: [],
      }
    );
  }, [plan]);

  const report = useMemo(
    () => (plan ? getReportCard(plan) : null),
    [plan],
  );

  const triggerBackup = useCallback(async () => {
    if (!plan) return;
    setBackupError(null);
    setBackupMessage('Backing up…');
    try {
      const { plan: updated, result } = await runBackup(plan, setBackupMessage);
      setPlanState(updated);
      if (result.error) setBackupError(result.error);
      setTimeout(() => setBackupMessage(null), 3000);
    } catch (e) {
      setBackupError(e instanceof Error ? e.message : 'Backup failed');
      setBackupMessage(null);
    }
  }, [plan]);

  const clearBackupBanner = useCallback(() => {
    setBackupMessage(null);
    setBackupError(null);
  }, []);

  const startFreshPlan = useCallback(async () => {
    if (!plan) return;
    const fresh = await startNewPlan(plan.meta.googleConnected);
    setPlanState(fresh);
  }, [plan]);

  const value: PlanContextValue = {
    plan,
    loading,
    backupMessage,
    backupError,
    setPlan,
    refresh,
    upsertDailyLog,
    updateSettings,
    getTodayLog,
    report,
    triggerBackup,
    clearBackupBanner,
    startFreshPlan,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}

export { initPlan };
