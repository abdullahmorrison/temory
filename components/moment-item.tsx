import Link from "next/link";
import { Faces } from "@/components/faces";
import { MomentBody } from "@/components/moment-body";
import { shortDate, timeLabel } from "@/lib/dates";
import type { Moment } from "@/lib/moments";
import { firstName } from "@/lib/names";

type About = { person: number } | { activity: number; person?: undefined };

const ITEM = "-mx-3 flex flex-col gap-2 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface/70 focus-visible:bg-surface/70 focus-visible:outline-none";

/**
 * One moment in a list: who and when, then what happened. Tapping opens it for editing.
 * The journal groups moments by day, so there it shows only the time.
 * On a person's or an activity's own pages (`about`), it shows the date and who was there, leaving out
 * the person themselves, and `href` opens it in their panel instead of the journal.
 */
export function MomentItem({ moment, about, href = `/journal/${moment.id}/edit` }: { moment: Moment; about?: About; href?: string }) {
  if (about) {
    const others = about.person === undefined ? moment.people : moment.people.filter((p) => p.id !== about.person);
    return (
      <Link href={href} className={ITEM}>
        <span className="flex gap-2 text-xs text-muted">
          <span>
            {shortDate(moment.date)}
            {moment.time && ` · ${timeLabel(moment.time)}`}
          </span>
          {others.length > 0 && <span>with {others.map((p) => firstName(p.name)).join(", ")}</span>}
        </span>
        <span className="font-serif text-[1.0625rem] leading-[1.8125rem] whitespace-pre-line"><MomentBody body={moment.body} people={moment.mentioned} activities={moment.mentionedActivities} /></span>
      </Link>
    );
  }
  return (
    <Link href={href} className={ITEM}>
      <span className="flex items-center gap-2 text-xs">
        <Faces people={moment.people} />
        {moment.time && <span className="text-muted">{timeLabel(moment.time)}</span>}
        <span className={moment.people.length ? "font-medium" : "text-muted"}>
          {moment.people.length ? moment.people.map((p) => firstName(p.name)).join(", ") : "Just me"}
        </span>
      </span>
      <span className="font-serif text-lg leading-[1.8125rem] whitespace-pre-line"><MomentBody body={moment.body} people={moment.mentioned} activities={moment.mentionedActivities} /></span>
    </Link>
  );
}
