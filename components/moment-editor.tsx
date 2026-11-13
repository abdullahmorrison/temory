"use client";

import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { Placeholder, UndoRedo } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import type { SuggestionKeyDownProps, SuggestionProps } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { useLayoutEffect, useRef, useState } from "react";
import { ActivityIcon } from "@/components/activity-icon";
import { ACTIVITY_TEXT } from "@/components/moment-body";
import { fromDoc, mentionMatches, toDoc } from "@/lib/mentions";
import { firstName } from "@/lib/names";
import { personColor } from "@/lib/person-colors";

type Person = { id: number; name: string; color: number; endedAt?: string | null };
type Activity = { id: number; name: string; icon: string };
// One menu at a time: the people from @, or the activities from /.
type Option = ({ kind: "person" } & Person) | ({ kind: "activity" } & Activity);

type Props = {
  people: Person[];
  activities: Activity[];
  defaultValue?: string;
  autoFocus?: boolean;
  /** Someone was mentioned: they belong in "with". */
  onMention: (person: Person) => void;
  /** An activity was named with /: it belongs in "doing". */
  onActivity: (activity: Activity) => void;
  /** The body changed, so mentions may have come or gone. */
  onChange: (body: string) => void;
};

/**
 * What happened, in the serif. Typing @ opens a menu of people; picking one puts their name in the
 * text in their color. Typing / does the same for activities, underlined. Posts the body, with
 * mentions as tokens, as the `body` field.
 */
export function MomentEditor({ people, activities, defaultValue = "", autoFocus, onMention, onActivity, onChange }: Props) {
  const [body, setBody] = useState(defaultValue);
  const [menu, setMenu] = useState<{ props: SuggestionProps<Option>; selected: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  // The editor is built once, so its callbacks read the latest values through a ref.
  const latest = useRef({ people, activities, onMention, onActivity, onChange, menu });
  useLayoutEffect(() => {
    latest.current = { people, activities, onMention, onActivity, onChange, menu };
  });

  const pick = (props: SuggestionProps<Option>, { kind, ...option }: Option) => {
    props.command({ id: String(option.id), label: option.name });
    if (kind === "person") latest.current.onMention(option as Person);
    else latest.current.onActivity(option as Activity);
  };

  // The lint rule can't tell that the editor only calls these back on input, never while rendering.
  /* eslint-disable react-hooks/refs */
  // The @ and / menus behave the same; only what they offer differs.
  const suggestion = (char: string, items: (query: string) => Option[]) => ({
    char,
    pluginKey: new PluginKey(`mention-${char}`),
    decorationClass: "text-accent",
    items: ({ query }: { query: string }) => items(query),
    render: () => ({
      onStart: (props: SuggestionProps<Option>) => setMenu({ props, selected: 0 }),
      onUpdate: (props: SuggestionProps<Option>) =>
        setMenu((m) => ({ props, selected: Math.min(m?.selected ?? 0, Math.max(props.items.length - 1, 0)) })),
      onExit: () => setMenu(null),
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        const m = latest.current.menu;
        if (!m?.props.items.length) return false;
        const n = m.props.items.length;
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (step) {
          setMenu({ ...m, selected: (m.selected + step + n) % n });
          return true;
        }
        if (event.key === "Enter" || event.key === "Tab") {
          pick(m.props, m.props.items[m.selected]);
          return true;
        }
        return false;
      },
    }),
  });

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus ? "end" : false,
    content: toDoc(defaultValue),
    extensions: [
      Document,
      Paragraph,
      Text,
      UndoRedo,
      Placeholder.configure({ placeholder: "What happened?" }),
      Mention.configure({
        renderText: ({ node }) => (node.attrs.mentionSuggestionChar === "/" ? node.attrs.label : firstName(node.attrs.label)),
        renderHTML: ({ node }) => {
          if (node.attrs.mentionSuggestionChar === "/") {
            const a = latest.current.activities.find((x) => String(x.id) === node.attrs.id);
            return ["span", { class: ACTIVITY_TEXT, "data-activity": node.attrs.id }, a?.name ?? node.attrs.label];
          }
          const p = latest.current.people.find((x) => String(x.id) === node.attrs.id);
          return ["span", { class: `font-medium ${p ? personColor(p.color).ink : ""}`, "data-person": node.attrs.id }, firstName(p?.name ?? node.attrs.label)];
        },
        suggestions: [
          // Past relationships keep their name and color in old moments, but can't be newly mentioned.
          suggestion("@", (q) => mentionMatches(latest.current.people.filter((p) => !p.endedAt), q).map((p) => ({ kind: "person" as const, ...p }))),
          suggestion("/", (q) => mentionMatches(latest.current.activities, q).map((a) => ({ kind: "activity" as const, ...a }))),
        ],
      }),
    ],
    editorProps: {
      attributes: {
        class: "min-h-48 font-serif text-[1.1875rem] leading-8 outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "What happened?",
      },
    },
    onUpdate: ({ editor }) => {
      const next = fromDoc(editor.getJSON());
      setBody(next);
      latest.current.onChange(next);
    },
  });
  /* eslint-enable react-hooks/refs */

  return (
    <div ref={wrap} className="relative mt-7">
      <EditorContent editor={editor} />
      <input type="hidden" name="body" value={body} />
      {menu && menu.props.items.length > 0 && <Menu wrap={wrap} props={menu.props} selected={menu.selected} onPick={(o) => pick(menu.props, o)} />}
    </div>
  );
}

/** A dark row of names under the line being typed, with a caret pointing at the @ or /. */
function Menu({
  wrap,
  props,
  selected,
  onPick,
}: {
  wrap: React.RefObject<HTMLDivElement | null>;
  props: SuggestionProps<Option>;
  selected: number;
  onPick: (option: Option) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState({ top: 0, left: 0, caret: 0 });

  // Sits under the @, kept inside the editor's width; the caret stays over the @ when the row is pushed left.
  useLayoutEffect(() => {
    const at = props.clientRect?.();
    const box = wrap.current?.getBoundingClientRect();
    if (!at || !box || !ref.current) return;
    const x = at.left - box.left;
    const left = Math.max(0, Math.min(x - 12, box.width - ref.current.offsetWidth));
    setPlace({ top: at.bottom - box.top + 10, left, caret: x - left });
  }, [props, wrap]);

  return (
    <div ref={ref} role="listbox" aria-label={props.items[0]?.kind === "activity" ? "Pick an activity" : "Mention someone"} className="absolute z-10 flex gap-0.5 rounded-[0.625rem] bg-ink p-1 font-sans text-[0.8125rem] text-paper shadow-(--shadow-pop)" style={{ top: place.top, left: place.left }}>
      <svg width="0.75rem" height="0.375rem" viewBox="0 0 12 6" aria-hidden className="absolute -top-1.5 fill-ink" style={{ left: place.caret }}>
        <path d="M0 6 6 0l6 6z" />
      </svg>
      {props.items.map((p, i) => (
        <button
          key={`${p.kind}-${p.id}`}
          type="button"
          role="option"
          aria-selected={i === selected}
          onMouseDown={(e) => e.preventDefault()} // keep the caret in the text
          onClick={() => onPick(p)}
          className={`flex items-center gap-1.5 rounded-[0.4375rem] px-2.5 py-1 whitespace-nowrap ${i === selected ? "bg-paper/15 font-medium" : "hover:bg-paper/10"}`}
        >
          {p.kind === "activity" && <ActivityIcon icon={p.icon} size="0.875rem" />}
          {p.name}
        </button>
      ))}
    </div>
  );
}
