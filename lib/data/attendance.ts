/**
 * Mock attendance for November 2026 (20 working days per person).
 * Only people with absences are listed; everyone else attended every day.
 * Totals: 600 scheduled days, 24 absences, 96.0% overall. Body Shop and
 * Front of House are deliberately below target so the drill-down has a story.
 */

export const ATTENDANCE_PERIOD = {
  label: "November 2026",
  workingDays: 20,
};

/** Department attendance below this rate is flagged. */
export const ATTENDANCE_TARGET = 95;

export type Absence = {
  sick: number;
  unplanned: number;
  /** Days arrived more than 15 minutes late (counted as present). */
  late?: number;
};

export const absences: Record<string, Absence> = {
  // Body Shop: 10 absences across 7 people
  "sam-dawson": { sick: 3, unplanned: 1 },
  "isla-murphy": { sick: 1, unplanned: 1, late: 2 },
  "kai-tanaka": { sick: 2, unplanned: 0 },
  "mateo-alvarez": { sick: 0, unplanned: 1, late: 3 },
  "grace-oneill": { sick: 1, unplanned: 0 },
  // Mechanical: 5 absences across 7 people
  "noah-kaur": { sick: 1, unplanned: 1, late: 2 },
  "emily-chen": { sick: 2, unplanned: 0 },
  "hannah-lee": { sick: 1, unplanned: 0 },
  // Front of House: 3 absences across 2 people
  "liam-foster": { sick: 1, unplanned: 2, late: 1 },
  // Operations: 3 absences across 4 people
  "carlos-mendes": { sick: 1, unplanned: 1 },
  "freya-lund": { sick: 1, unplanned: 0 },
  // Estimating: 2 absences across 3 people
  "maya-singh": { sick: 2, unplanned: 0 },
  // Finance: 1 absence across 3 people
  "oliver-brooks": { sick: 0, unplanned: 1 },
};
