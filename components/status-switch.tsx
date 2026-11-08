"use client";

import { ACTIVITY_STATUSES, STATUS_LABELS, type ActivityStatus } from "@/lib/activity-status";

/** Doing · Want to · Past, as one control with the current one raised. */
export function StatusSwitch({ value, onChange, label }: { value: ActivityStatus; onChange: (status: ActivityStatus) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-full bg-surface p-1">
      {ACTIVITY_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          role="radio"
          aria-checked={status === value}
          onClick={() => onChange(status)}
          className={`flex-1 rounded-full py-1.75 text-sm transition-colors ${
            status === value ? "bg-paper font-medium text-ink shadow-(--shadow-avatar)" : "text-muted hover:text-ink"
          }`}
        >
          {STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}
