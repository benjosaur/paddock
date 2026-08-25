import type { ComponentType } from "react";
import type { VariantProps } from "../parts";
import { RailTimeline } from "./RailTimeline";
import { DayBookTimeline } from "./DayBookTimeline";
import { SpineTimeline } from "./SpineTimeline";
import { MonthFeedTimeline } from "./MonthFeedTimeline";
import { JournalTimeline } from "./JournalTimeline";

export interface Variant {
  slug: string;
  name: string;
  blurb: string;
  component: ComponentType<VariantProps>;
}

export const VARIANTS: Variant[] = [
  {
    slug: "1",
    name: "Rail",
    blurb:
      "One rail, a coloured node per entry, sticky month headings. The plainest reading of a timeline.",
    component: RailTimeline,
  },
  {
    slug: "2",
    name: "Day book",
    blurb:
      "A ledger: the date once in the gutter, everything from that day beside it. Dense, scannable, paper-file feel.",
    component: DayBookTimeline,
  },
  {
    slug: "3",
    name: "Spine",
    blurb:
      "System events on a centre spine, coordinator notes to the left, files to the right — the side tells you the source.",
    component: SpineTimeline,
  },
  {
    slug: "4",
    name: "Month feed",
    blurb:
      "Summary strip up top, month index with activity bars on the left (gaps in contact are visible), compact feed on the right.",
    component: MonthFeedTimeline,
  },
  {
    slug: "5",
    name: "Journal",
    blurb:
      "A message log about the person: notes as bubbles, files as media, system events as dividers. Composer at the top beside the newest entry.",
    component: JournalTimeline,
  },
];
