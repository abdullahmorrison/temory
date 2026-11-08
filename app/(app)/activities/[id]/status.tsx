"use client";

import { useOptimistic, useTransition } from "react";
import { changeActivityStatus } from "@/app/(app)/activities/actions";
import { StatusSwitch } from "@/components/status-switch";
import type { ActivityStatus } from "@/lib/activity-status";

/** The switch on an activity's page: saves as soon as it's changed. */
export function ActivityStatusSwitch({ id, status }: { id: number; status: ActivityStatus }) {
  const [shown, show] = useOptimistic(status);
  const [, startTransition] = useTransition();
  return (
    <StatusSwitch
      label="In my life"
      value={shown}
      onChange={(next) =>
        startTransition(async () => {
          show(next);
          await changeActivityStatus(id, next);
        })
      }
    />
  );
}
