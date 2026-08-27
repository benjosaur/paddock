// Builds a person's timeline from their getById payload. Every dated fact on
// the record becomes a system event; attachments and notes are carried
// through as-is. Expiry dates (DBS, public liability, training) are
// deliberately not events — they're deadlines, not things that happened.
import type {
  AttachmentWithUrl,
  ClientFull,
  MpFull,
  Package,
  RequestFull,
  SolePackage,
  TrainingRecord,
  VolunteerFull,
} from "shared";
import { capitalise } from "@/utils/helpers";
import {
  attachmentEntryId,
  isYmd,
  noteEntryId,
  sortEntries,
  type AttachmentEntry,
  type DateSpan,
  type EventEntry,
  type Note,
  type NoteEntry,
  type TimelineEntry,
} from "./model";

export interface TimelineData {
  entries: TimelineEntry[]; // sorted newest first
  // Hours shown on the month pills. `requested` is only meaningful for a
  // client (their care requests); carers only have hours delivered.
  requested?: DateSpan[];
  delivered: DateSpan[];
}

const hoursText = (details: {
  weeklyHours: number;
  oneOffStartDateHours: number;
}) => {
  const bits = [];
  if (details.weeklyHours) bits.push(`${details.weeklyHours}h/wk`);
  if (details.oneOffStartDateHours)
    bits.push(`${details.oneOffStartDateHours}h one-off`);
  return bits.join(" + ");
};

const joinDetail = (...bits: (string | undefined | false)[]) =>
  bits.filter(Boolean).join(" · ") || undefined;

const spanOf = (item: {
  id: string;
  startDate: string;
  endDate: string;
  details: { weeklyHours: number; oneOffStartDateHours: number };
}): DateSpan => ({
  id: item.id,
  startDate: item.startDate,
  endDate: item.endDate,
  weeklyHours: item.details.weeklyHours,
  oneOffStartDateHours: item.details.oneOffStartDateHours,
});

function noteEntries(notes: Note[]): NoteEntry[] {
  return notes.flatMap((note, index) =>
    isYmd(note.date)
      ? [{ id: noteEntryId(index), type: "note" as const, date: note.date, index, note }]
      : [],
  );
}

function attachmentEntries(attachments: AttachmentWithUrl[]): AttachmentEntry[] {
  return attachments.map((attachment) => ({
    id: attachmentEntryId(attachment.id),
    type: "attachment",
    date: attachment.date,
    attachment,
  }));
}

// Start and (if closed) end of a request or package.
function spanEvents(
  item: { id: string; startDate: string; endDate: string },
  prefix: string,
  kinds: [start: EventEntry["kind"], end: EventEntry["kind"]],
  startTitle: string,
  endTitle: string,
  detail: string | undefined,
  endDetail: string | undefined,
): EventEntry[] {
  const events: EventEntry[] = [];
  if (isYmd(item.startDate)) {
    events.push({
      id: `${prefix}-start-${item.id}`,
      type: "event",
      date: item.startDate,
      kind: kinds[0],
      title: startTitle,
      detail,
    });
  }
  if (isYmd(item.endDate)) {
    events.push({
      id: `${prefix}-end-${item.id}`,
      type: "event",
      date: item.endDate,
      kind: kinds[1],
      title: endTitle,
      detail: endDetail,
    });
  }
  return events;
}

function requestEvents(req: RequestFull): EventEntry[] {
  const what = joinDetail(
    capitalise(req.requestType),
    req.details.services.join(", "),
    hoursText(req.details),
    req.details.status === "urgent" && "urgent",
  );
  return spanEvents(
    req,
    "req",
    ["request-start", "request-end"],
    "Care request started",
    "Care request ended",
    what,
    joinDetail(capitalise(req.requestType), req.details.services.join(", ")),
  );
}

// `who` is the other party: the carer on a client's timeline, the client on
// a carer's.
function packageEvents(pkg: Package, who: string): EventEntry[] {
  return spanEvents(
    pkg,
    "pkg",
    ["package-start", "package-end"],
    "Care confirmed",
    "Care ended",
    joinDetail(who, hoursText(pkg.details)),
    who,
  );
}

function solePackageEvents(pkg: SolePackage): EventEntry[] {
  const services = pkg.details.services.join(", ");
  return spanEvents(
    pkg,
    "sole",
    ["package-start", "package-end"],
    "Sole service started",
    "Sole service ended",
    joinDetail(services, hoursText(pkg.details)),
    services,
  );
}

function trainingEvents(records: TrainingRecord[]): EventEntry[] {
  return records.flatMap((record) =>
    isYmd(record.completionDate)
      ? [
          {
            id: `training-${record.id}`,
            type: "event" as const,
            date: record.completionDate,
            kind: "training" as const,
            title: "Training completed",
            detail: record.details.recordName,
          },
        ]
      : [],
  );
}

function dated(
  id: string,
  date: string,
  kind: EventEntry["kind"],
  title: string,
  detail?: string,
): EventEntry[] {
  return isYmd(date) ? [{ id, type: "event", date, kind, title, detail }] : [];
}

export function buildClientTimeline(client: ClientFull): TimelineData {
  const d = client.details;
  const aa = d.attendanceAllowance;
  const packages = client.requests.flatMap((req) => req.packages);

  const events: EventEntry[] = [
    ...dated(
      "agreement",
      d.clientAgreementDate,
      "agreement",
      "Client agreement signed",
      joinDetail(d.referredBy && `Referred by ${d.referredBy}`, d.clientAgreementComments),
    ),
    ...dated(
      "risk",
      d.riskAssessmentDate,
      "risk-assessment",
      "Risk assessment completed",
      d.riskAssessmentComments || undefined,
    ),
    ...dated(
      "aa-requested",
      aa.requestedDate,
      "aa-requested",
      "Attendance Allowance requested",
      joinDetail(
        aa.requestedLevel !== "None" && `${aa.requestedLevel} rate`,
        aa.completedBy.name && `completed by ${aa.completedBy.name}`,
        aa.hoursToCompleteRequest > 0 && `${aa.hoursToCompleteRequest}h`,
      ),
    ),
    ...dated(
      "aa-confirmed",
      aa.confirmationDate,
      "aa-confirmed",
      "Attendance Allowance confirmed",
      aa.status === "Low" || aa.status === "High" ? `${aa.status} rate` : aa.status,
    ),
    ...client.requests.flatMap(requestEvents),
    ...packages.flatMap((pkg) => packageEvents(pkg, pkg.details.name)),
    ...client.magLogs.flatMap((log) =>
      dated(`mag-${log.id}`, log.date, "mag", "MAG attended",
        log.totalHours ? `${log.totalHours}h session` : undefined),
    ),
    ...dated(
      "ended",
      client.endDate,
      "ended",
      "Client ended",
      d.endReason !== "None" ? d.endReason : undefined,
    ),
  ];

  return {
    entries: sortEntries([
      ...events,
      ...attachmentEntries(client.attachments),
      ...noteEntries(d.notes),
    ]),
    requested: client.requests.map(spanOf),
    delivered: packages.map(spanOf),
  };
}

// Packages this carer holds, with the client's name from the request.
function carerPackages(carerId: string, requests: RequestFull[]) {
  return requests.flatMap((req) =>
    req.packages
      .filter((pkg) => pkg.carerId === carerId)
      .map((pkg) => ({ pkg, clientName: req.details.name })),
  );
}

export function buildMpTimeline(mp: MpFull): TimelineData {
  const held = carerPackages(mp.id, mp.requests);
  const events: EventEntry[] = [
    ...dated("started", mp.details.startDate, "started", "Started as an MP"),
    ...held.flatMap(({ pkg, clientName }) => packageEvents(pkg, clientName)),
    ...trainingEvents(mp.trainingRecords),
    ...dated("fee", mp.feePaymentDate, "fee", "Fee paid"),
    ...dated("ended", mp.endDate, "ended", "MP ended"),
  ];
  return {
    entries: sortEntries([
      ...events,
      ...attachmentEntries(mp.attachments),
      ...noteEntries(mp.details.notes),
    ]),
    delivered: held.map(({ pkg }) => spanOf(pkg)),
  };
}

export function buildVolunteerTimeline(volunteer: VolunteerFull): TimelineData {
  const held = carerPackages(volunteer.id, volunteer.requests);
  const events: EventEntry[] = [
    ...dated(
      "started",
      volunteer.details.startDate,
      "started",
      `Started as ${volunteer.details.role === "Volunteer" ? "a volunteer" : volunteer.details.role}`,
    ),
    ...held.flatMap(({ pkg, clientName }) => packageEvents(pkg, clientName)),
    ...volunteer.solePackages.flatMap(solePackageEvents),
    ...trainingEvents(volunteer.trainingRecords),
    ...dated("ended", volunteer.endDate, "ended", "Volunteer ended"),
  ];
  return {
    entries: sortEntries([
      ...events,
      ...attachmentEntries(volunteer.attachments),
      ...noteEntries(volunteer.details.notes),
    ]),
    delivered: [
      ...held.map(({ pkg }) => spanOf(pkg)),
      ...volunteer.solePackages.map(spanOf),
    ],
  };
}
