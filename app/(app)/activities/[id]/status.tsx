"use client";

import { useOptimistic, useState, useTransition } from "react";
import { changeActivityStatus } from "@/app/(app)/activities/actions";
import { StatusSwitch } from "@/components/status-switch";
import type { ActivityStatus } from "@/lib/activity-status";

/** The switch on an activity's page: saves as soon as it's changed, and snaps back if it couldn't. */
export function ActivityStatusSwitch({ id, status }: { id: number; status: ActivityStatus }) {
  const [shown, show] = useOptimistic(status);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2.5">
      <StatusSwitch
        label="In my life"
        value={shown}
        onChange={(next) =>
          startTransition(async () => {
            show(next);
            setError("");
            const result = await changeActivityStatus(id, next);
            if (result.error) setError(`Couldn't save. ${result.error}`);
          })
        }
      />
      {error && (
        <p className="text-sm text-accent" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
