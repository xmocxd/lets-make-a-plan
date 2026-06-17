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
  calorieEntries: z.array(z.number()).default([]),
  fat: z.number().default(0),
  sugar: z.number().default(0),
  isCheatDay: z.boolean().default(false),
  fatOverGoal: z.boolean().default(false),
  sugarOverGoal: z.boolean().default(false),
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
  { id: 'm1', text: 'How can I eat healthy today?', isDefault: true },
  { id: 'm2', text: "Don't be so stressed over nothing", isDefault: true },
  { id: 'm3', text: 'Go with a gentle force', isDefault: true },
  { id: 'm4', text: 'Greed only brings forth misery', isDefault: true },
  { id: 'm5', text: 'Simplify', isDefault: true },
];

export const DEFAULT_EXERCISE_ACTIVITIES: ExerciseActivity[] = [
  { id: 'ea1', name: 'Walk 10k', goalWeight: 'half' },
  { id: 'ea2', name: 'Walk 20k', goalWeight: 'full' },
  { id: 'ea3', name: 'Bike', goalWeight: 'full' },
  { id: 'ea4', name: 'Gym light', goalWeight: 'half' },
  { id: 'ea5', name: 'Gym heavy', goalWeight: 'full' },
];

export const DEFAULT_DESTRESS: Omit<DestressSuggestion, 'lastShownAt'>[] = [
  { id: 'd1', text: 'Progressive Muscle Relaxation (PMR)' },
  {
    id: 'd2',
    text: 'Self-massage or massage chair/gun: 15-20 minutes on neck, shoulders, back, feet.',
  },
  { id: 'd3', text: 'Foam rolling or lacrosse ball trigger point work' },
  { id: 'd4', text: 'Sauna or hot springs: 15-25 minutes dry or wet heat.' },
  { id: 'd5', text: 'Jacuzzi' },
  { id: 'd6', text: 'Hot bath or epsom salt soak' },
  { id: 'd7', text: 'Steam room session.' },
  { id: 'd8', text: 'Sit in a park on a bench or in nature for a while' },
  {
    id: 'd9',
    text: 'Calming walk in Japanese garden, botanical garden, or arboretum.',
  },
  { id: 'd10', text: 'Box breathing or 4-7-8 breathing: Structured counts.' },
  { id: 'd11', text: 'Get a cup of Turkish tea — no heavy food with it.' },
  { id: 'd12', text: 'Cryotherapy or cold plunge (if available).' },
  { id: 'd13', text: 'Float tank session (sensory deprivation).' },
  { id: 'd14', text: 'Sit by a fire pit or fireplace.' },
  { id: 'd15', text: 'Get a haircut' },
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
    exerciseActivities: DEFAULT_EXERCISE_ACTIVITIES.map((a) => ({ ...a })),
    destressSuggestions: DEFAULT_DESTRESS.map((d) => ({ ...d })),
    mantras: DEFAULT_MANTRAS.map((m) => ({ ...m })),
  };
}
