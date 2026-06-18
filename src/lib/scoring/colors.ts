import type { LetterGrade } from './index';
import { getLetterGrade } from './index';

export function gradeFromScore(score: number): LetterGrade {
  return getLetterGrade(score);
}

export function scoreGradeClass(score: number): string {
  return `grade-${gradeFromScore(score).toLowerCase()}`;
}

export function scoreBackgroundStyle(score: number): { background: string; color: string } {
  const grade = gradeFromScore(score);
  switch (grade) {
    case 'A':
      return {
        background: 'color-mix(in srgb, var(--good) 28%, var(--surface2))',
        color: 'var(--good)',
      };
    case 'B':
      return {
        background: 'color-mix(in srgb, #22c55e 24%, var(--surface2))',
        color: '#22c55e',
      };
    case 'C':
      return {
        background: 'color-mix(in srgb, var(--yellow) 26%, var(--surface2))',
        color: 'var(--yellow)',
      };
    case 'D':
      return {
        background: 'color-mix(in srgb, #f97316 26%, var(--surface2))',
        color: '#f97316',
      };
    default:
      return {
        background: 'color-mix(in srgb, var(--bad) 26%, var(--surface2))',
        color: 'var(--bad)',
      };
  }
}
