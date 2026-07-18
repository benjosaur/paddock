import { signInWithRedirect } from "aws-amplify/auth";
import { LayoutGrid } from "lucide-react";

const LINKEDIN_URL = "https://www.linkedin.com/in/ben-blaker-085108175/";
const WIVEY_URL = "https://wiveycares.net";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 font-semibold transition hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pk-blue";
const btnPrimary = `${btnBase} bg-pk-blue text-white hover:bg-pk-blue-deep`;
const btnQuiet = `${btnBase} border-[1.5px] border-pk-line bg-white text-pk-ink hover:border-pk-ink`;

const chipStyles = {
  urgent: "bg-pk-amber-soft text-pk-amber",
  matched: "bg-pk-blue-soft text-pk-blue",
  serviced: "bg-pk-leaf-soft text-pk-leaf",
} as const;

function Chip({ kind, label }: { kind: keyof typeof chipStyles; label: string }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.66rem] font-semibold ${chipStyles[kind]}`}
    >
      {label}
    </span>
  );
}

function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`flex items-center justify-center rounded-[7px] bg-pk-blue ${
          small ? "h-[22px] w-[22px]" : "h-[26px] w-[26px]"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="12" height="12" rx="3.5" stroke="#fff" strokeWidth="2" />
          <path d="M5.5 13.5V9.8h4v3.7" stroke="#fff" strokeWidth="1.8" />
        </svg>
      </span>
      <span className={`font-display font-extrabold tracking-tight ${small ? "text-base" : "text-xl"}`}>
        Paddock
      </span>
    </span>
  );
}

const sidebarItems = [
  "Clients",
  "Micro-providers",
  "Volunteers",
  "Requests",
  "Packages",
  "MAG",
  "Hub & Grub",
  "Training records",
  "DBS",
];

const statTiles = [
  { value: "87", label: "Active clients", note: "▲ 4 this month", tone: "text-pk-leaf" },
  { value: "35", label: "Micro-providers", note: "all insured", tone: "text-pk-leaf" },
  { value: "22", label: "Volunteers", note: "DBS current", tone: "text-pk-leaf" },
  { value: "54 h", label: "Unmet hours", note: "needs cover", tone: "text-pk-amber" },
];

const requestRows: {
  service: string;
  client: string;
  locality: string;
  status: keyof typeof chipStyles;
  label: string;
}[] = [
  { service: "Personal care", client: "M. Hartley", locality: "Wiveliscombe", status: "urgent", label: "Urgent" },
  { service: "Transport — MAG", client: "D. Prescott", locality: "Milverton", status: "matched", label: "Matched" },
  { service: "Meal prep", client: "J. Rowe", locality: "Halse", status: "serviced", label: "Serviced" },
  { service: "Companionship", client: "P. Escott", locality: "Fitzhead", status: "matched", label: "Matched" },
];

const hourBars = [
  { label: "Requested", width: "92%", color: "bg-pk-blue", value: "412" },
  { label: "Serviced", width: "80%", color: "bg-pk-leaf", value: "358" },
  { label: "Gap", width: "12%", color: "bg-pk-amber", value: "54" },
];

const expiringRows: { name: string; record: string; days: string; kind: keyof typeof chipStyles }[] = [
  { name: "S. Talbot", record: "DBS check", days: "21 days", kind: "urgent" },
  { name: "R. Venn", record: "First Aid", days: "44 days", kind: "matched" },
  { name: "K. Doble", record: "Public liability", days: "58 days", kind: "matched" },
];

const audiences = [
  {
    who: "For coordinators",
    title: "The day runs itself",
    blurb: "Everything that used to live in your head, safely on one screen.",
    points: ["Requests logged, matched, tracked", "Urgent flags that stay visible", "MAG & Hub & Grub logs in minutes"],
  },
  {
    who: "For trustees",
    title: "Governance without the chase",
    blurb: "Compliance status you can read at a glance, not chase by email.",
    points: ["DBS & insurance expiry monitoring", "Training records with renewals", "Role-based access & audit trails"],
  },
  {
    who: "For funders",
    title: "Evidence on demand",
    blurb: "The numbers grant applications ask for, ready before they ask.",
    points: ["Hours by parish & deprivation", "Requested vs serviced gap", "Monthly & annual summaries"],
  },
];

const wiveyStats = [
  { value: "3 → 35", label: "care workforce since 2018" },
  { value: "£1.4m+", label: "benefits unlocked locally" },
  { value: "10", label: "parishes reported on" },
  { value: "1,250+", label: "micro-providers in the county model" },
];

export function LandingPage() {
  const handleSignIn = async () => {
    try {
      await signInWithRedirect();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-pk-paper font-sans text-pk-ink antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-pk-line bg-pk-paper/90 backdrop-blur-md">
        <nav aria-label="Main" className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-3.5">
          <a href="#top" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pk-blue">
            <Wordmark />
          </a>
          <div className="flex items-center gap-6 text-[0.94rem] font-medium">
            <a href="#product" className="hidden text-pk-slate hover:text-pk-ink md:inline">
              Product
            </a>
            <a href="#wivey" className="hidden text-pk-slate hover:text-pk-ink md:inline">
              Wivey Cares
            </a>
            <a href="#founder" className="hidden text-pk-slate hover:text-pk-ink md:inline">
              Founder
            </a>
            <button onClick={handleSignIn} className={`${btnPrimary} px-4 py-2 text-sm`}>
              Sign in
            </button>
          </div>
        </nav>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="px-6 pb-14 pt-16 text-center md:pt-20">
          <div className="mx-auto max-w-[1120px]">
            <span className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-pk-line bg-white px-3.5 py-1.5 text-sm font-medium text-pk-slate">
              <img src="/wivey-cares.png" alt="" className="h-[19px] w-[19px] rounded" />
              Powering <b className="font-semibold text-pk-ink">Wivey Cares</b> — Wiveliscombe, Somerset
            </span>
            <h1 className="mx-auto mb-5 mt-6 max-w-[18em] font-display text-[clamp(2.4rem,5.2vw,3.7rem)] font-extrabold leading-[1.08] tracking-[-0.015em]">
              Run your community care scheme from one place<span className="text-pk-blue">.</span>{" "}
              <span className="mt-3.5 block text-[0.52em] font-bold tracking-normal text-pk-slate line-through decoration-pk-amber decoration-[2.5px]">
                Not eleven spreadsheets.
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-[41em] text-lg text-pk-slate">
              Paddock is case-management for charity-run care networks. Requests matched to local micro-providers and
              volunteers, DBS and insurance kept current, and funder-ready reports by parish and deprivation — all in
              one quiet, tidy system.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={handleSignIn} className={btnPrimary}>
                Sign in to Paddock
              </button>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={btnQuiet}>
                Book a walkthrough
              </a>
            </div>
            <p className="mt-4 text-sm text-pk-slate">Built with Wivey Cares · in daily use across 10 Somerset parishes</p>
          </div>

          {/* Dashboard mock */}
          <div className="mx-auto mt-8 max-w-[1040px]">
            <div
              role="img"
              aria-label="Paddock dashboard showing stat tiles, a requests table with statuses, hours charts and expiring compliance records"
              className="overflow-hidden rounded-2xl border border-pk-line bg-white text-left shadow-[0_20px_50px_rgba(28,39,51,0.12)]"
            >
              <div className="flex items-center gap-2 border-b border-pk-line bg-pk-cream px-4 py-2.5">
                <i className="block h-2.5 w-2.5 rounded-full bg-[#ddd9cb]" />
                <i className="block h-2.5 w-2.5 rounded-full bg-[#ddd9cb]" />
                <i className="block h-2.5 w-2.5 rounded-full bg-[#ddd9cb]" />
                <span className="mx-auto rounded-md border border-pk-line bg-white px-3.5 py-0.5 font-plex text-xs text-pk-slate">
                  app.paddockhealth.com/dashboard
                </span>
              </div>
              <div aria-hidden="true" className="grid min-h-[430px] md:grid-cols-[198px_1fr]">
                <nav className="hidden border-r border-pk-line bg-pk-mist p-2.5 text-[0.8rem] md:block">
                  <div className="flex items-center gap-2 px-2 pb-3.5 pt-1.5 text-[0.84rem] font-bold">
                    <img src="/wivey-cares.png" alt="" className="h-[22px] w-[22px] rounded" />
                    Wivey Cares
                  </div>
                  <span className="flex items-center gap-2 rounded-[7px] bg-pk-blue-soft px-2 py-1.5 font-semibold text-pk-blue">
                    <LayoutGrid size={13} />
                    Dashboard
                  </span>
                  {sidebarItems.map((item) => (
                    <span key={item} className="flex items-center gap-2 rounded-[7px] px-2 py-1.5 font-medium text-pk-slate">
                      {item}
                    </span>
                  ))}
                </nav>
                <div className="p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h4 className="font-display text-[1.05rem] font-bold">Dashboard</h4>
                    <span className="font-plex text-[0.7rem] text-pk-slate">JULY 2026 · WIVELISCOMBE +9 PARISHES</span>
                  </div>
                  <div className="mb-2.5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                    {statTiles.map((tile) => (
                      <div key={tile.label} className="rounded-[10px] border border-pk-line bg-white px-3.5 py-3">
                        <b className="block font-display text-[1.35rem] font-bold leading-tight">{tile.value}</b>
                        <span className="text-xs text-pk-slate">{tile.label}</span>{" "}
                        <span className={`text-[0.7rem] font-semibold ${tile.tone}`}>{tile.note}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2.5 md:grid-cols-[1.6fr_1fr]">
                    <div className="overflow-hidden rounded-[10px] border border-pk-line bg-white">
                      <div className="flex items-center justify-between border-b border-pk-line px-3.5 py-2.5 text-[0.8rem] font-semibold">
                        Open requests <span className="font-plex text-[0.68rem] font-normal text-pk-slate">4 of 23</span>
                      </div>
                      <table className="w-full text-[0.76rem]">
                        <thead>
                          <tr>
                            {["Service", "Client", "Locality", "Status"].map((heading, i) => (
                              <th
                                key={heading}
                                className={`border-b border-pk-line bg-pk-sand px-3.5 py-1.5 text-left font-plex text-[0.62rem] font-medium uppercase tracking-[0.08em] text-pk-slate ${
                                  i === 2 ? "hidden md:table-cell" : ""
                                }`}
                              >
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {requestRows.map((row, i) => {
                            const cell = `px-3.5 py-2 ${i < requestRows.length - 1 ? "border-b border-pk-fog" : ""}`;
                            return (
                              <tr key={row.client}>
                                <td className={cell}>{row.service}</td>
                                <td className={cell}>{row.client}</td>
                                <td className={`${cell} hidden text-pk-slate md:table-cell`}>{row.locality}</td>
                                <td className={cell}>
                                  <Chip kind={row.status} label={row.label} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <div className="rounded-[10px] border border-pk-line bg-white px-3.5 py-3 text-[0.76rem]">
                        <div className="mb-2.5 flex justify-between text-[0.8rem] font-semibold">
                          Hours this month{" "}
                          <span className="font-plex text-[0.66rem] font-normal text-pk-slate">req / serviced</span>
                        </div>
                        {hourBars.map((bar) => (
                          <div
                            key={bar.label}
                            className="mb-1.5 grid grid-cols-[70px_1fr_34px] items-center gap-2 text-[0.7rem] text-pk-slate"
                          >
                            <span>{bar.label}</span>
                            <div className="h-2 overflow-hidden rounded-full bg-pk-fog">
                              <div className={`h-full rounded-full ${bar.color}`} style={{ width: bar.width }} />
                            </div>
                            <span>{bar.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-[10px] border border-pk-line bg-white px-3.5 py-3 text-[0.76rem]">
                        <div className="mb-1.5 flex justify-between text-[0.8rem] font-semibold">
                          Expiring soon{" "}
                          <span className="font-plex text-[0.66rem] font-normal text-pk-slate">next 60 days</span>
                        </div>
                        {expiringRows.map((row, i) => (
                          <div
                            key={row.name}
                            className={`flex items-center justify-between py-1.5 ${
                              i < expiringRows.length - 1 ? "border-b border-pk-fog" : ""
                            }`}
                          >
                            <div>
                              <b className="font-semibold">{row.name}</b>
                              <span className="block text-[0.68rem] text-pk-slate">{row.record}</span>
                            </div>
                            <Chip kind={row.kind} label={row.days} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Audiences */}
        <section id="product" className="px-6 py-16 md:py-20">
          <div className="mx-auto max-w-[1120px]">
            <p className="mb-4 font-plex text-xs font-semibold uppercase tracking-[0.14em] text-pk-blue">Who it's for</p>
            <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.4rem)] font-extrabold tracking-tight">
              One system, three jobs done properly
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {audiences.map((audience) => (
                <div key={audience.who} className="rounded-[14px] border border-pk-line bg-white p-6">
                  <p className="mb-3 font-plex text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-pk-blue">
                    {audience.who}
                  </p>
                  <h3 className="mb-2.5 font-display text-lg font-bold">{audience.title}</h3>
                  <p className="text-[0.93rem] text-pk-slate">{audience.blurb}</p>
                  <ul className="mt-3.5 text-[0.9rem]">
                    {audience.points.map((point) => (
                      <li key={point} className="flex gap-2.5 border-t border-pk-fog py-1.5">
                        <span aria-hidden="true" className="font-bold text-pk-leaf">
                          —
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wivey Cares */}
        <section id="wivey" className="border-y border-pk-line bg-white px-6 py-16 md:py-20">
          <div className="mx-auto grid max-w-[1120px] items-center gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <p className="mb-4 font-plex text-xs font-semibold uppercase tracking-[0.14em] text-pk-blue">
                Powering Wivey Cares
              </p>
              <h2 className="mb-4 font-display text-[clamp(1.7rem,3.2vw,2.4rem)] font-extrabold tracking-tight">
                Proven where it matters: a real town, every day
              </h2>
              <p className="mb-4 max-w-[36em] text-pk-slate">
                Wivey Cares is a charity in Wiveliscombe, Somerset that connects people who need support with trusted
                self-employed carers — micro-providers — plus volunteers, a Memory Activity Group and a carers' group.
                Founded in 2018 by a retired social worker, it has become the reference for community-led care.
              </p>
              <p className="mb-4 max-w-[36em] text-pk-slate">
                Paddock is the system underneath it: every request, match, session log and funding report. The wider
                Somerset micro-provider model now counts 1,250+ carers delivering 30,000+ hours of weekly support to
                nearly 6,000 people.
              </p>
              <p className="font-plex text-xs text-pk-slate">
                Registered charity 1183575 ·{" "}
                <a
                  href={WIVEY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-pk-ink underline underline-offset-[3px]"
                >
                  wiveycares.net
                </a>
              </p>
            </div>
            <div className="rounded-2xl border border-pk-line bg-pk-paper p-7">
              <div className="mb-5 flex items-center gap-3.5">
                <img src="/wivey-cares.png" alt="Wivey Cares logo" className="h-[52px] w-[52px] rounded-[11px]" />
                <div>
                  <b className="block font-display text-lg font-bold">Wivey Cares</b>
                  <span className="text-sm text-pk-slate">Connecting a caring community</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-pk-line bg-pk-line">
                {wiveyStats.map((stat) => (
                  <div key={stat.label} className="bg-white p-4">
                    <b className="block font-display text-2xl font-bold leading-tight">{stat.value}</b>
                    <span className="text-[0.78rem] text-pk-slate">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Founder */}
        <section id="founder" className="px-6 py-16 md:py-20">
          <div className="mx-auto max-w-[1120px]">
            <div className="grid items-center gap-8 rounded-[18px] border border-pk-line bg-white p-8 md:grid-cols-[230px_1fr] md:gap-10 md:p-9">
              <img
                src="/ben-blaker.jpg"
                alt="Ben Blaker, founding CEO of Paddock"
                className="h-36 w-36 rounded-2xl object-cover md:h-[210px] md:w-[210px]"
              />
              <div>
                <p className="mb-2.5 font-plex text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-pk-blue">
                  From the founder
                </p>
                <h2 className="mb-1.5 font-display text-2xl font-extrabold tracking-tight">Ben Blaker</h2>
                <p className="mb-3.5 font-medium text-pk-slate">Founding CEO — civil servant &amp; AI engineer</p>
                <p className="mb-3 max-w-[40em] text-[0.97rem] text-pk-slate">
                  Ben built Paddock alongside Wivey Cares to prove that a volunteer-run scheme can operate with the
                  same rigour as a national provider — matching, compliance and evidence included — without losing the
                  neighbourliness that makes it work.
                </p>
                <p className="mb-4 max-w-[40em] text-[0.97rem] text-pk-slate">
                  "Communities shouldn't need an IT department to look after each other. They just need tools that
                  respect how they actually work."
                </p>
                <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={btnQuiet}>
                  Connect on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-16 md:pb-20">
          <div className="mx-auto max-w-[1120px] rounded-[20px] bg-pk-ink px-8 py-14 text-center text-white md:py-16">
            <h2 className="mb-3 font-display text-[clamp(1.9rem,3.8vw,2.7rem)] font-extrabold tracking-tight">
              See Paddock running a real network
            </h2>
            <p className="mx-auto mb-7 max-w-[36em] text-[#b9c2cc]">
              We'll walk you through how Wivey Cares uses Paddock day to day — and what it would take to run your
              scheme on it.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                className={`${btnBase} bg-white text-pk-ink hover:bg-pk-cream`}
              >
                Book a walkthrough
              </a>
              <button
                onClick={handleSignIn}
                className={`${btnBase} border-[1.5px] border-[#4a5866] bg-transparent text-white hover:border-white`}
              >
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 pb-10 text-sm text-pk-slate">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4">
          <Wordmark small />
          <span>
            Case-management for community care ·{" "}
            <a href={WIVEY_URL} target="_blank" rel="noreferrer" className="underline underline-offset-[3px]">
              Powering Wivey Cares
            </a>
          </span>
          <span>© 2026 Paddock · paddockhealth.com</span>
        </div>
      </footer>
    </div>
  );
}
