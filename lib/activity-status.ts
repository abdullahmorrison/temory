// Where an activity is in your life. Kept apart from lib/activities.ts so the browser can use it
// without the database code.

export const ACTIVITY_STATUSES = ["doing", "want", "past"] as const;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];
export const STATUS_LABELS: Record<ActivityStatus, string> = { doing: "Doing", want: "Want to", past: "Past" };

export function isActivityStatus(value: unknown): value is ActivityStatus {
  return ACTIVITY_STATUSES.includes(value as ActivityStatus);
}
