/**
 * Scoring and status helpers.
 *
 * Folder layout (each file is one topic):
 * - logs.ts      — read daily logs, detect empty days
 * - diet.ts      — calorie / diet scoring
 * - exercise.ts  — exercise scoring
 * - calm.ts      — calm / de-stress scoring
 * - dayStatus.ts — colored icons for calendar cells
 * - week.ts      — week summary, combined score, projections
 * - report.ts    — monthly report card
 */
export * from './logs';
export * from './diet';
export * from './exercise';
export * from './calm';
export * from './dayStatus';
export * from './week';
export * from './report';
