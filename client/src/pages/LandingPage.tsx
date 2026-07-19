import { signInWithRedirect } from "aws-amplify/auth";
import { LayoutGrid, Linkedin, LogOut } from "lucide-react";

const LINKEDIN_URL = "https://www.linkedin.com/in/ben-blaker-085108175/";
const WIVEY_URL = "https://wiveycares.net";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-[10px] px-6 py-3 font-semibold transition hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pk-blue";
const btnPrimary = `${btnBase} bg-pk-blue text-white hover:bg-pk-blue-deep`;
const btnQuiet = `${btnBase} border-[1.5px] border-pk-line bg-white text-pk-ink hover:border-pk-ink`;

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

// Mirrors the real app: getVisibleMenuItems() order and the Dashboard's
// "Live Overview" tab. Keep in sync when the app's nav or dashboard changes.
const sidebarItems = [
  "Care Requests",
  "Care Confirmed",
  "Clients",
  "MPs",
  "Volunteers",
  "DBS",
  "Public Liability",
  "Records",
  "MAG",
  "Hub & Grub",
];

const dashboardTabs = ["Overview", "Care Requests", "Care Confirmed", "Attendance Allowance"];

const overviewCounters = [
  { value: "87", label: "Clients with Active Care Requests" },
  { value: "35", label: "MPs with Active Care Confirmed" },
  { value: "22", label: "Volunteers with Active Care Confirmed" },
  { value: "412", label: "Current Requested Weekly Care Hours" },
  { value: "358", label: "Current Brokered Weekly Care Hours" },
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
            <a
              href={WIVEY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-pk-line bg-white px-3.5 py-1.5 text-sm font-medium text-pk-slate transition hover:border-pk-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pk-blue"
            >
              <img src="/wivey-cares.png" alt="" className="h-[19px] w-[19px] rounded" />
              Powering <b className="font-semibold text-pk-ink">Wivey Cares</b>
            </a>
            <h1 className="mx-auto mb-5 mt-6 max-w-[18em] font-display text-[clamp(2.4rem,5.2vw,3.7rem)] font-extrabold leading-[1.08] tracking-[-0.015em]">
              Run your microprovider network from one place<span className="text-pk-blue">.</span>{" "}
              <span className="mt-3.5 block text-[0.52em] font-bold tracking-normal text-pk-slate line-through decoration-pk-amber decoration-[2.5px]">
                Not eleven spreadsheets.
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-[41em] text-lg text-pk-slate">
              Paddock tracks all you need to know about your microprovider network. See how your care requests and care
              delivered breaks down by month, localities and services. Find out which providers you need to chase to
              renew their DBS checks. Tailor your dashboard to suit your bespoke needs for trustees, councils and
              clients.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={handleSignIn} className={btnPrimary}>
                Sign in to Paddock
              </button>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={btnQuiet}>
                Book a walkthrough
              </a>
            </div>
            <p className="mt-4 text-sm text-pk-slate">Tracking over £500k in annual care</p>
          </div>

          {/* Dashboard mock — mirrors the real Dashboard's Live Overview */}
          <div className="mx-auto mt-8 max-w-[1040px]">
            <div
              role="img"
              aria-label="Paddock dashboard showing the live overview: active clients, MPs and volunteers, and requested versus brokered weekly care hours"
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
                <nav className="hidden flex-col border-r border-pk-line bg-pk-mist p-2.5 text-[0.8rem] md:flex">
                  <div className="flex items-center gap-2 px-2 pb-1.5 pt-1.5 text-[0.84rem] font-bold">
                    <img src="/wivey-cares.png" alt="" className="h-[22px] w-[22px] rounded" />
                    Wivey Cares
                  </div>
                  <span className="mx-2 mb-2 w-fit rounded-full bg-pk-fog px-2 py-0.5 text-[0.66rem] font-semibold text-pk-slate">
                    Coordinator
                  </span>
                  <span className="flex items-center gap-2 rounded-[7px] bg-pk-blue-soft px-2 py-1.5 font-semibold text-pk-blue">
                    <LayoutGrid size={13} />
                    Dashboard
                  </span>
                  {sidebarItems.map((item) => (
                    <span key={item} className="flex items-center gap-2 rounded-[7px] px-2 py-1.5 font-medium text-pk-slate">
                      {item}
                    </span>
                  ))}
                  <span className="mt-auto flex items-center gap-2 border-t border-pk-line px-2 pb-1 pt-3 font-medium text-pk-slate">
                    <LogOut size={13} />
                    Sign Out
                  </span>
                </nav>
                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-display text-[1.05rem] font-bold leading-tight">Dashboard</h4>
                      <span className="text-[0.72rem] text-pk-slate">Live Overview</span>
                    </div>
                    <span className="rounded-lg border border-pk-line bg-white px-3 py-1.5 text-[0.72rem] font-semibold shadow-sm">
                      Generate Report
                    </span>
                  </div>
                  <div className="mb-3.5 grid grid-cols-2 gap-1 rounded-lg bg-pk-fog p-[3px] text-center text-[0.7rem] font-medium md:grid-cols-4">
                    {dashboardTabs.map((tab, i) => (
                      <span
                        key={tab}
                        className={i === 0 ? "rounded-md bg-white px-2 py-1 shadow-sm" : "px-2 py-1 text-pk-slate"}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                    {overviewCounters.map((counter) => (
                      <div key={counter.label} className="rounded-[10px] border border-pk-line bg-white p-4 shadow-sm">
                        <b className="block font-display text-[1.45rem] font-bold leading-tight">{counter.value}</b>
                        <span className="text-[0.7rem] font-medium text-pk-slate">{counter.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wivey Cares */}
        <section id="wivey" className="mt-4 border-y border-pk-line bg-white px-6 py-16 md:py-20">
          <div className="mx-auto grid max-w-[1120px] items-center gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div>
              <h2 className="mb-4 font-display text-[clamp(1.7rem,3.2vw,2.4rem)] font-extrabold tracking-tight">
                Powering Wivey Cares
              </h2>
              <p className="mb-4 max-w-[36em] text-pk-slate">
                Wivey Cares is a charity in Wiveliscombe pioneering Somerset's microprovider model of care. Instead of
                expensive agency workers or care homes, where cost saving comes at the expense of the patient, the
                microprovider model connects self employed local carers to locals in need. This strengthens community
                bonds which acts as a check against exploitative practice. No bloated company takes a % of the cheque -
                all of it goes to the carer.
              </p>
              <p className="mb-4 max-w-[36em] text-pk-slate">
                Paddock was built in conjunction with Wivey Cares in early 2025 to replace their legacy recordkeeping
                software with one allowing them to reap the benefits of modern technology. Since then £500k of care
                has been tracked through the system. Analytics needed for council funding applications can be done in
                seconds instead of hours.
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
                <div className="mb-3.5 flex items-center gap-2.5">
                  <h2 className="font-display text-2xl font-extrabold tracking-tight">Ben Blaker - Founding CEO</h2>
                  <a
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Ben Blaker on LinkedIn"
                    className="text-pk-blue transition hover:text-pk-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pk-blue"
                  >
                    <Linkedin size={20} />
                  </a>
                </div>
                <p className="mb-3 max-w-[40em] text-[0.97rem] text-pk-slate">
                  I turned down the path of making as much money as possible to instead pursue missions worth grinding
                  for. Primarily, I care a lot about making sure all the recent technology gains are not kept to
                  private sector firms and are diffused into the public and third sector too.
                </p>
                <p className="max-w-[40em] text-[0.97rem] text-pk-slate">
                  I am a full time civil servant economist alongside a CTO at an ADHD clinic. I'm always happy to help
                  those who dedicate their lives to helping others.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-16 md:pb-20">
          <div className="mx-auto max-w-[1120px] rounded-[20px] bg-pk-ink px-8 py-14 text-center text-white md:py-16">
            <h2 className="mb-7 font-display text-[clamp(1.9rem,3.8vw,2.7rem)] font-extrabold tracking-tight">
              See Paddock running a real network
            </h2>
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
