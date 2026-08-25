// Dummy data for the timeline mockups: one client with a realistic two-year
// history. Dates are relative to today's date (2026-08-25 when written).
import type { TimelineEntry } from "./model";

export interface MockPerson {
  id: string;
  name: string;
  locality: string;
  customId: string;
}

export const MOCK_CLIENT: MockPerson = {
  id: "client-margaret-hale",
  name: "Margaret Hale",
  locality: "Wiveliscombe",
  customId: "WC-0142",
};

// Placeholder "photos" as inline SVG so the mockup needs no network.
function svgPhoto(from: string, to: string, hint: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
  <rect width="640" height="480" fill="url(#g)"/>
  <circle cx="470" cy="150" r="70" fill="#fff" fill-opacity="0.35"/>
  <path d="M0 380 Q160 300 320 360 T640 340 V480 H0 Z" fill="#000" fill-opacity="0.12"/>
  <text x="24" y="452" font-family="Inter, sans-serif" font-size="22" fill="#fff" fill-opacity="0.85">${hint}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const SEED_ENTRIES: TimelineEntry[] = [
  // ---- 2024: referral, agreement, first care package -----------------
  {
    id: "ev-agreement",
    type: "event",
    date: "2024-03-04",
    kind: "agreement",
    title: "Client agreement signed",
    detail: "Referred by Wiveliscombe surgery",
  },
  {
    id: "at-agreement",
    type: "attachment",
    date: "2024-03-04",
    fileName: "Client agreement – signed.pdf",
    contentType: "application/pdf",
    size: 412_338,
    url: "#",
  },
  {
    id: "no-first-visit",
    type: "note",
    date: "2024-03-04",
    source: "In Person",
    minutesTaken: 45,
    note: "First visit with Margaret and her daughter Claire. Margaret is managing at home but struggling with the stairs and heavier housework since her hip operation. Agreement signed; explained donation scheme. Claire is the main contact — prefers email.",
  },
  {
    id: "ev-risk",
    type: "event",
    date: "2024-03-11",
    kind: "risk-assessment",
    title: "Risk assessment completed",
    detail: "Loose stair carpet flagged; key safe recommended",
  },
  {
    id: "at-risk",
    type: "attachment",
    date: "2024-03-11",
    fileName: "Risk assessment – March 2024.docx",
    contentType: DOCX,
    size: 88_120,
    url: "#",
  },
  {
    id: "ev-req1-start",
    type: "event",
    date: "2024-03-18",
    kind: "request-start",
    title: "Care request started",
    detail: "Paid · Personal Care, Domestic · 4h/wk",
  },
  {
    id: "no-matching",
    type: "note",
    date: "2024-03-20",
    source: "Phone",
    minutesTaken: 15,
    note: "Spoke to Sarah P about taking Margaret on for Tuesday and Friday mornings. She can start next week. Margaret happy with a female carer only.",
  },
  {
    id: "ev-pkg1-start",
    type: "event",
    date: "2024-03-25",
    kind: "package-start",
    title: "Care confirmed",
    detail: "Sarah Pocock · 4h/wk",
  },
  {
    id: "at-keysafe",
    type: "attachment",
    date: "2024-03-25",
    fileName: "Key safe location.jpg",
    contentType: "image/jpeg",
    size: 1_204_811,
    url: svgPhoto("#7c8a6b", "#c9c1a3", "Key safe, left of porch"),
  },
  {
    id: "no-settling",
    type: "note",
    date: "2024-04-09",
    source: "Phone",
    minutesTaken: 10,
    note: "Two-week check-in. Margaret says Sarah is 'a breath of fresh air'. Stair carpet has been fixed by Claire's husband.",
  },
  {
    id: "ev-aa-req",
    type: "event",
    date: "2024-06-03",
    kind: "aa-requested",
    title: "Attendance Allowance requested",
    detail: "Higher rate · form completed with Jo (2.5h)",
  },
  {
    id: "at-aa-form",
    type: "attachment",
    date: "2024-06-03",
    fileName: "AA1 form – copy.pdf",
    contentType: "application/pdf",
    size: 2_310_400,
    url: "#",
  },
  {
    id: "no-aa-chase",
    type: "note",
    date: "2024-08-12",
    source: "Email",
    minutesTaken: 5,
    note: "Claire asked whether there's any news on the AA claim. Replied: typical wait is 8–12 weeks, will chase DWP if nothing by end of August.",
  },
  {
    id: "ev-aa-conf",
    type: "event",
    date: "2024-09-09",
    kind: "aa-confirmed",
    title: "Attendance Allowance confirmed",
    detail: "Higher rate awarded",
  },
  {
    id: "at-aa-letter",
    type: "attachment",
    date: "2024-09-09",
    fileName: "AA award letter.pdf",
    contentType: "application/pdf",
    size: 301_552,
    url: "#",
  },
  {
    id: "no-aa-done",
    type: "note",
    date: "2024-09-10",
    source: "Phone",
    minutesTaken: 10,
    note: "Rang Margaret with the good news. She'd like to put some of it towards the donation scheme — updated donation amount to £20/month on the client record.",
  },

  // ---- 2025: MAG, review, package change -----------------------------
  {
    id: "ev-mag-1",
    type: "event",
    date: "2025-01-14",
    kind: "mag",
    title: "MAG attended",
    detail: "Wiveliscombe · 2h",
  },
  {
    id: "ev-mag-2",
    type: "event",
    date: "2025-02-11",
    kind: "mag",
    title: "MAG attended",
    detail: "Wiveliscombe · 2h",
  },
  {
    id: "no-review",
    type: "note",
    date: "2025-03-06",
    source: "In Person",
    minutesTaken: 40,
    note: "Annual review at home. Margaret now managing personal care herself; main need is company and getting to appointments — Claire has moved to Exeter. Will end the paid package at the end of June and look for a volunteer for companionship and transport.",
  },
  {
    id: "at-review",
    type: "attachment",
    date: "2025-03-06",
    fileName: "Annual review notes 2025.docx",
    contentType: DOCX,
    size: 64_002,
    url: "#",
  },
  {
    id: "ev-pkg1-end",
    type: "event",
    date: "2025-06-30",
    kind: "package-end",
    title: "Care ended",
    detail: "Sarah Pocock",
  },
  {
    id: "ev-req1-end",
    type: "event",
    date: "2025-06-30",
    kind: "request-end",
    title: "Care request ended",
    detail: "Paid · Personal Care, Domestic",
  },
  {
    id: "ev-req2-start",
    type: "event",
    date: "2025-07-07",
    kind: "request-start",
    title: "Care request started",
    detail: "Unpaid · Companionship, Transport · 2h/wk · urgent",
  },
  {
    id: "ev-pkg2-start",
    type: "event",
    date: "2025-07-14",
    kind: "package-start",
    title: "Care confirmed",
    detail: "Tom Lyddon (volunteer) · 2h/wk",
  },
  {
    id: "at-gate",
    type: "attachment",
    date: "2025-07-14",
    fileName: "Garden gate – parking note.jpg",
    contentType: "image/jpeg",
    size: 980_774,
    url: svgPhoto("#5d7a9b", "#b9c8d6", "Park by the green gate"),
  },
  {
    id: "no-tom-intro",
    type: "note",
    date: "2025-07-15",
    source: "Phone",
    minutesTaken: 10,
    note: "Tom's first visit went well — took Margaret to the Thursday market. He'll do Musgrove appointments too if given a week's notice.",
  },
  {
    id: "no-hospital",
    type: "note",
    date: "2025-11-20",
    source: "Email",
    minutesTaken: 5,
    note: "Claire emailed: Margaret has a cataract appointment on 4 Dec, 10:15 at Musgrove. Forwarded to Tom, he's confirmed.",
  },

  // ---- 2026 -----------------------------------------------------------
  {
    id: "at-bluebadge",
    type: "attachment",
    date: "2026-02-03",
    fileName: "Blue Badge application.pdf",
    contentType: "application/pdf",
    size: 1_022_998,
    url: "#",
  },
  {
    id: "no-bluebadge",
    type: "note",
    date: "2026-02-03",
    source: "In Person",
    minutesTaken: 30,
    note: "Helped Margaret complete the Blue Badge renewal online. Needed a new photo — used the one from her bus pass. Submitted; reference SCC-88213.",
  },
  {
    id: "ev-mag-3",
    type: "event",
    date: "2026-05-12",
    kind: "mag",
    title: "MAG attended",
    detail: "Wiveliscombe · 2h",
  },
  {
    id: "no-fall",
    type: "note",
    date: "2026-07-22",
    source: "Phone",
    minutesTaken: 20,
    note: "Tom rang: Margaret had a minor fall in the garden on Sunday, no injury but shaken. Rang Margaret — she's fine, GP aware. Agreed to bring the risk assessment forward; will book for early September.",
  },
  {
    id: "ev-mag-4",
    type: "event",
    date: "2026-08-18",
    kind: "mag",
    title: "MAG attended",
    detail: "Wiveliscombe · 2h",
  },
  {
    id: "no-latest",
    type: "note",
    date: "2026-08-19",
    source: "Email",
    minutesTaken: 5,
    note: "Claire confirmed she can be there for the risk assessment on Tue 8 Sept, 10am. Tom will collect Margaret from MAG the week after as usual.",
  },
];
