// Variant 4 — Month feed. A month index on the left (with a small bar per
// month showing how much happened, so gaps in contact are visible) and a
// compact feed on the right. A summary strip answers the first questions a
// coordinator has before they read anything.
import { useEffect, useRef, useState } from "react";
import {
  EVENT_META,
  TONE,
  entryDomId,
  fmtShort,
  fmtShortYear,
  groupByMonth,
  relativeDays,
  todayYmd,
  weekday,
  type TimelineEntry,
} from "../model";
import {
  AddButtons,
  AttachmentName,
  AttachmentThumb,
  DeleteButton,
  EmptyState,
  EntryIcon,
  FilterChips,
  attachmentMeta,
  entryTone,
  highlightClass,
  lastContact,
  noteMeta,
  type VariantProps,
} from "../parts";
import { cn } from "@/lib/utils";

export function MonthFeedTimeline({
  state,
  openAddNote,
  openAddFile,
}: VariantProps) {
  const months = groupByMonth(state.visible);
  const maxCount = Math.max(1, ...months.map((month) => month.entries.length));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  // Scrollspy: the month whose heading is at or above the top of the feed.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const update = () => {
      const sections = Array.from(
        container.querySelectorAll<HTMLElement>("[data-month]"),
      );
      let current: string | null = sections[0]?.dataset.month ?? null;
      // The container is `relative`, so offsetTop is already container-relative.
      for (const section of sections) {
        if (section.offsetTop <= container.scrollTop + 8) {
          current = section.dataset.month ?? current;
        }
      }
      setActiveMonth(current);
    };
    update();
    container.addEventListener("scroll", update, { passive: true });
    return () => container.removeEventListener("scroll", update);
  }, [months.length]);

  const jump = (key: string) => {
    const container = scrollRef.current;
    const section = container?.querySelector<HTMLElement>(
      `[data-month="${key}"]`,
    );
    if (!container || !section) return;
    container.scrollTo({
      top: section.offsetTop,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const last = lastContact(state.entries);
  const openRequest = state.entries.find(
    (entry) => entry.type === "event" && entry.kind === "request-start",
  );
  const thisYear = todayYmd().slice(0, 4);
  const notesThisYear = state.entries.filter(
    (entry) => entry.type === "note" && entry.date.startsWith(thisYear),
  ).length;
  const minutesThisYear = state.entries.reduce(
    (sum, entry) =>
      entry.type === "note" && entry.date.startsWith(thisYear)
        ? sum + entry.minutesTaken
        : sum,
    0,
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <Stat label="Last contact">
            {last ? (
              <>
                {relativeDays(last.date)}{" "}
                <span className="font-normal text-gray-500">
                  · {last.source.toLowerCase()}
                </span>
              </>
            ) : (
              "—"
            )}
          </Stat>
          <Stat label="Current care">
            {openRequest && openRequest.type === "event"
              ? (openRequest.detail ?? "Open request")
              : "None"}
          </Stat>
          <Stat label={`Contact in ${thisYear}`}>
            {notesThisYear} notes{" "}
            <span className="font-normal text-gray-500">
              · {Math.round(minutesThisYear / 6) / 10}h
            </span>
          </Stat>
          <Stat label="Files">{state.counts.attachment}</Stat>
        </dl>
        <AddButtons onNote={openAddNote} onFile={openAddFile} />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[10rem_1fr] gap-4 border-t border-gray-200/70 pt-3">
        <nav
          aria-label="Months"
          className="flex min-h-0 flex-col gap-3 overflow-y-auto border-r border-gray-200/70 pr-3"
        >
          <FilterChips state={state} className="flex-col items-stretch" />
          <ol className="space-y-0.5">
            {months.map((month) => {
              const active = month.key === activeMonth;
              return (
                <li key={month.key}>
                  <button
                    type="button"
                    onClick={() => jump(month.key)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "w-full cursor-pointer rounded-lg px-2 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                      active
                        ? "bg-gray-800 text-white"
                        : "text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    <span className="flex items-center justify-between text-xs font-medium">
                      <span>{month.label.replace(/^(\w{3})\w*/, "$1")}</span>
                      <span
                        className={cn(
                          "tabular-nums",
                          active ? "text-white/70" : "text-gray-400",
                        )}
                      >
                        {month.entries.length}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-1 block h-1 rounded-full",
                        active ? "bg-white/20" : "bg-gray-100",
                      )}
                    >
                      <span
                        className={cn(
                          "block h-1 rounded-full",
                          active ? "bg-white/80" : "bg-gray-400",
                        )}
                        style={{
                          width: `${(month.entries.length / maxCount) * 100}%`,
                        }}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div ref={scrollRef} className="relative min-h-0 overflow-y-auto pr-2">
          {months.length === 0 ? (
            <EmptyState
              hasEntries={state.entries.length > 0}
              onNote={openAddNote}
              onFile={openAddFile}
            />
          ) : (
            months.map((month) => (
              <section key={month.key} data-month={month.key} className="pb-4">
                <h4 className="sticky top-0 z-10 bg-white/95 py-1.5 text-sm font-semibold text-gray-800 backdrop-blur">
                  {month.label}
                </h4>
                <ol className="divide-y divide-gray-100">
                  {month.entries.map((entry) => (
                    <FeedRow
                      key={entry.id}
                      entry={entry}
                      isNew={entry.id === state.justAddedId}
                      onDelete={() => state.remove(entry.id)}
                    />
                  ))}
                </ol>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </dt>
      <dd className="font-medium text-gray-800">{children}</dd>
    </div>
  );
}

function FeedRow({
  entry,
  isNew,
  onDelete,
}: {
  entry: TimelineEntry;
  isNew: boolean;
  onDelete: () => void;
}) {
  const tone = TONE[entryTone(entry)];
  return (
    <li
      id={entryDomId(entry.id)}
      className={cn(
        "group grid grid-cols-[2rem_3.5rem_1fr_auto] items-start gap-3 rounded-lg py-2.5 scroll-mt-12",
        highlightClass(isNew),
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          entry.type === "event" ? tone.node : "bg-gray-100 text-gray-500",
        )}
      >
        <EntryIcon entry={entry} className="h-4 w-4" />
      </span>
      <div className="pt-1 leading-tight">
        <div className="text-sm font-medium text-gray-800">{fmtShort(entry.date)}</div>
        <div className="text-[11px] text-gray-400">{weekday(entry.date)}</div>
      </div>
      <div className="min-w-0 pt-1 text-sm">
        {entry.type === "event" && (
          <p className="text-gray-800">
            <span className="font-medium">{entry.title}</span>
            {entry.detail && (
              <span className="text-gray-500"> · {entry.detail}</span>
            )}
          </p>
        )}
        {entry.type === "note" && (
          <>
            <p className="whitespace-pre-wrap leading-relaxed text-gray-700">
              {entry.note}
            </p>
            <p className="mt-1 text-xs text-gray-400">{noteMeta(entry)}</p>
          </>
        )}
        {entry.type === "attachment" && (
          <div className="flex items-center gap-3">
            <AttachmentThumb entry={entry} className="h-10 w-10" />
            <div className="min-w-0">
              <AttachmentName entry={entry} className="block" />
              <p className="text-xs text-gray-400">
                {attachmentMeta(entry)} · dated {fmtShortYear(entry.date)}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 pt-1 text-xs text-gray-400">
        {entry.type === "event" && (
          <span className={cn("hidden md:inline", tone.text)}>
            {EVENT_META[entry.kind].label}
          </span>
        )}
        {entry.type !== "event" && <DeleteButton onClick={onDelete} />}
      </div>
    </li>
  );
}
