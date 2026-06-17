import { z } from 'zod';

export const SCHEMA_VERSION = 1;

export const GoalWeightSchema = z.enum(['half', 'full']);
export type GoalWeight = z.infer<typeof GoalWeightSchema>;

export const CalorieStatusSchema = z.enum(['good', 'yellow', 'bad', 'none']);
export type CalorieStatus = z.infer<typeof CalorieStatusSchema>;

export const MetaSchema = z.object({
  schemaVersion: z.number().default(SCHEMA_VERSION),
  localModifiedAt: z.string(),
  lastSyncAt: z.string().optional(),
  backupDue: z.boolean().default(false),
  lastLocalBackupAt: z.string().optional(),
  lastDriveBackupAt: z.string().optional(),
  spreadsheetId: z.string().optional(),
  backupSpreadsheetId: z.string().optional(),
  googleConnected: z.boolean().default(false),
  onboarded: z.boolean().default(false),
});
export type Meta = z.infer<typeof MetaSchema>;

export const SettingsSchema = z.object({
  calorieTarget: z.number().default(2000),
  fatGoal: z.number().default(65),
  sugarGoal: z.number().default(50),
  fatTrackingEnabled: z.boolean().default(false),
  sugarTrackingEnabled: z.boolean().default(false),
  cheatDaysPerWeek: z.number().default(1),
  fatSugarCheatDaysPerMonth: z.number().default(1),
  dietCalorieExceedPctMax: z.number().default(10),
  fatSugarExceedPctMax: z.number().default(20),
  restDaysPerWeek: z.number().default(1),
  exerciseMonthGoalPct: z.number().default(90),
  destressPerWeekGoal: z.number().default(3),
  autoBackupEnabled: z.boolean().default(true),
  driveBackupEnabled: z.boolean().default(true),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DailyLogSchema = z.object({
  date: z.string(),
  calories: z.number().default(0),
  fat: z.number().default(0),
  sugar: z.number().default(0),
  isCheatDay: z.boolean().default(false),
  fatOverGoal: z.boolean().default(false),
  sugarOverGoal: z.boolean().default(false),
  fatSugarCheat: z.boolean().default(false),
  destressDone: z.boolean().default(false),
  isRestDay: z.boolean().default(false),
  exerciseActivityIds: z.array(z.string()).default([]),
});
export type DailyLog = z.infer<typeof DailyLogSchema>;

export const ExerciseActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  goalWeight: GoalWeightSchema,
});
export type ExerciseActivity = z.infer<typeof ExerciseActivitySchema>;

export const DestressSuggestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  lastShownAt: z.string().optional(),
});
export type DestressSuggestion = z.infer<typeof DestressSuggestionSchema>;

export const MantraSchema = z.object({
  id: z.string(),
  text: z.string(),
  isDefault: z.boolean().default(false),
  lastShownAt: z.string().optional(),
});
export type Mantra = z.infer<typeof MantraSchema>;

export const PlanDataSchema = z.object({
  meta: MetaSchema,
  settings: SettingsSchema,
  dailyLogs: z.array(DailyLogSchema),
  exerciseActivities: z.array(ExerciseActivitySchema),
  destressSuggestions: z.array(DestressSuggestionSchema),
  mantras: z.array(MantraSchema),
});
export type PlanData = z.infer<typeof PlanDataSchema>;

export const DEFAULT_MANTRAS: Omit<Mantra, 'lastShownAt'>[] = [
  { id: 'm1', text: 'Progress, not perfection.', isDefault: true },
  { id: 'm2', text: 'One day at a time.', isDefault: true },
  { id: 'm3', text: 'Small steps lead to big changes.', isDefault: true },
  { id: 'm4', text: 'You are capable of more than you know.', isDefault: true },
  { id: 'm5', text: 'Rest is part of the plan.', isDefault: true },
];

export const DEFAULT_DESTRESS: Omit<DestressSuggestion, 'lastShownAt'>[] = [
  { id: 'd1', text: 'Take a 10-minute walk' },
  { id: 'd2', text: 'Deep breathing for 5 minutes' },
  { id: 'd3', text: 'Listen to calming music' },
  { id: 'd4', text: 'Stretch or gentle yoga' },
  { id: 'd5', text: 'Write in a journal' },
  { id: 'd6', text: 'Call a friend' },
];

export function createDefaultPlan(): PlanData {
  const now = new Date().toISOString();
  return {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      localModifiedAt: now,
      backupDue: false,
      googleConnected: false,
      onboarded: false,
    },
    settings: SettingsSchema.parse({}),
    dailyLogs: [],
    exerciseActivities: [
      { id: 'ea1', name: 'Walk 30 min', goalWeight: 'half' },
      { id: 'ea2', name: 'Full workout', goalWeight: 'full' },
    ],
    destressSuggestions: DEFAULT_DESTRESS.map((d) => ({ ...d })),
    mantras: DEFAULT_MANTRAS.map((m) => ({ ...m })),
  };
}
