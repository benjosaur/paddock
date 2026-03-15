import { signInWithRedirect } from "aws-amplify/auth";
import { Button } from "../components/ui/button";

export function LandingPage() {
  const handleSignIn = async () => {
    try {
      await signInWithRedirect();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const stats = [
    { value: "1,250+", label: "Micro-providers in Somerset" },
    { value: "30,000+", label: "Hours of care per week" },
    { value: "6,000", label: "People supported countywide" },
    { value: "IMD", label: "Deprivation data built-in" },
  ];

  const features = [
    {
      svg: (
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8" aria-hidden="true">
          <rect x="4" y="4" width="10" height="10" rx="2" fill="#1e3a5f" />
          <rect x="18" y="4" width="10" height="10" rx="2" fill="#1e3a5f" opacity="0.4" />
          <rect x="4" y="18" width="10" height="10" rx="2" fill="#1e3a5f" opacity="0.4" />
          <rect x="18" y="18" width="10" height="10" rx="2" fill="#1e3a5f" opacity="0.6" />
        </svg>
      ),
      title: "Care Network Management",
      description:
        "Track clients, volunteers, and self-employed microproviders in one place. Monitor active care relationships, flag gaps in service, and maintain a complete picture of your network.",
    },
    {
      svg: (
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8" aria-hidden="true">
          <circle cx="16" cy="16" r="11" stroke="#1e3a5f" strokeWidth="2" fill="none" />
          <path d="M16 9v7l4 4" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Requests, Packages & Logs",
      description:
        "Manage care requests from referral to delivery. Track packages of hours, log MAG (Memory Activity Group) sessions, and maintain audit-ready records throughout.",
    },
    {
      svg: (
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8" aria-hidden="true">
          <path d="M16 4L6 8v8c0 5.5 4.3 10.7 10 12 5.7-1.3 10-6.5 10-12V8L16 4z" stroke="#1e3a5f" strokeWidth="2" fill="none" />
          <path d="M11 16l3 3 7-7" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Secure & Fully Compliant",
      description:
        "Role-based access, encrypted data, and complete audit trails protect every record. DBS and training expiries are monitored automatically so nothing slips through the cracks.",
    },
    {
      svg: (
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8" aria-hidden="true">
          <path d="M4 26 L4 10 M4 10 Q4 6 8 6 L24 6 Q28 6 28 10 L28 26" stroke="#1e3a5f" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M2 26h28" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="10" cy="14" r="2.5" fill="#1e3a5f" opacity="0.5"/>
          <circle cx="22" cy="14" r="2.5" fill="#1e3a5f" opacity="0.5"/>
          <path d="M12 19c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        </svg>
      ),
      title: "Index of Multiple Deprivation",
      description:
        "Client postcodes are automatically checked against the UK Government's English Indices of Deprivation 2025. Income and health deprivation levels surface instantly, giving coordinators the context they need.",
    },
    {
      svg: (
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8" aria-hidden="true">
          <rect x="3" y="22" width="5" height="7" rx="1" fill="#1e3a5f" />
          <rect x="10" y="15" width="5" height="14" rx="1" fill="#1e3a5f" opacity="0.7" />
          <rect x="17" y="9" width="5" height="20" rx="1" fill="#1e3a5f" opacity="0.5" />
          <rect x="24" y="4" width="5" height="25" rx="1" fill="#1e3a5f" opacity="0.3" />
          <path d="M3 19l7-6 7-4 8-6" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Dashboard Analytics & Filtering",
      description:
        "Monitor active clients, microproviders, and volunteers at a glance. Identify gaps between requested and serviced hours. Powerful column filters let coordinators cut to exactly the data they need.",
    },
    {
      svg: (
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8" aria-hidden="true">
          <rect x="5" y="4" width="22" height="24" rx="2" stroke="#1e3a5f" strokeWidth="2" fill="none" />
          <path d="M10 10h12M10 15h8" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 21h5" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="22" r="5" fill="#1e3a5f" />
          <path d="M20 22l1.5 1.5L24 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "AI-Assisted Form Workflows",
      description:
        "Intelligent suggestions based on client history reduce admin burden and flag missing information before it becomes a compliance problem — giving coordinators more time for care.",
    },
  ];

  const benefits = [
    "Full client, volunteer, and microprovider lifecycle management",
    "Automatic deprivation assessment via English Indices of Deprivation 2025",
    "Request and package tracking from referral through to delivery",
    "MAG (Memory Activity Group) session logging",
    "Automated DBS and training expiry monitoring",
    "Role-based access control across all staff levels",
    "Complete audit trails for CQC and funder compliance",
    "Dashboard analytics highlighting resource allocation gaps",
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[#1e3a5f] flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
                  <path d="M10 3v14M3 10h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-[#1e3a5f] tracking-tight">
                Paddock Health
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
              <a href="#model" className="hover:text-[#1e3a5f] transition-colors">The Model</a>
              <a href="#features" className="hover:text-[#1e3a5f] transition-colors">Features</a>
              <a href="#security" className="hover:text-[#1e3a5f] transition-colors">Security</a>
              <a href="#about" className="hover:text-[#1e3a5f] transition-colors">About</a>
            </nav>
            <Button
              onClick={handleSignIn}
              className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-sm px-5"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-[#f7f9fc] border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#0d6e6e] bg-[#e6f5f5] px-3 py-1.5 rounded-full mb-6">
                  Microprovider Care Management
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-[#1a2535] leading-tight mb-6">
                  Community care,<br />
                  <span className="text-[#1e3a5f]">carefully managed</span>
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg">
                  Paddock is the case-management platform built for charity microprovider
                  networks — connecting self-employed carers to locals in need, with
                  the compliance and oversight that professional care demands.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSignIn}
                    size="lg"
                    className="bg-[#1e3a5f] hover:bg-[#162d4a] text-white px-8 py-3 text-base font-medium"
                  >
                    Access the Platform
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-3 text-base font-medium"
                    onClick={() => document.getElementById("model")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Our Model
                  </Button>
                </div>
                <p className="mt-5 text-xs text-slate-400">
                  Live at <a href="https://paddock.health" className="text-[#1e3a5f] hover:underline font-medium">paddock.health</a>. Currently supporting WiveyCares, Wiveliscombe, Somerset.
                </p>
              </div>

              {/* Product screenshot */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
                <img
                  src="/images/client-details-modal.png"
                  alt="Paddock Health client details view showing deprivation indicators"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#e6f5f5] flex items-center justify-center">
                    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
                      <path d="M10 2L3 5.5v5C3 14.1 6.2 17.6 10 18.5c3.8-.9 7-4.4 7-8V5.5L10 2z" fill="#0d6e6e" opacity="0.2" />
                      <path d="M10 2L3 5.5v5C3 14.1 6.2 17.6 10 18.5c3.8-.9 7-4.4 7-8V5.5L10 2z" stroke="#0d6e6e" strokeWidth="1.5" />
                      <path d="M7 10l2 2 4-4" stroke="#0d6e6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">Deprivation data built-in</div>
                    <div className="text-xs text-slate-500">English Indices of Deprivation 2025</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-[#1e3a5f] text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-blue-200 font-medium uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The Model Section */}
        <section id="model" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#0d6e6e] bg-[#e6f5f5] px-3 py-1.5 rounded-full mb-6">
                  The Microprovider Model
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1a2535] mb-6">
                  Championed by Somerset County Council
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-5">
                  The microprovider model connects self-employed local carers directly with
                  people in need — delivering better quality care at lower cost than
                  traditional agency staffing, while helping people remain in their own
                  homes and communities.
                </p>
                <p className="text-slate-600 leading-relaxed mb-8">
                  Across Somerset, this model has already created over{" "}
                  <strong className="text-[#1a2535]">1,250 micro-providers</strong> delivering{" "}
                  <strong className="text-[#1a2535]">30,000+ hours of weekly support</strong> to nearly{" "}
                  <strong className="text-[#1a2535]">6,000 people</strong>. Community bonds are
                  strengthened as local people get to know and care for those who live just down
                  the street.
                </p>
                <div className="bg-[#f7f9fc] border border-slate-200 rounded-xl p-6">
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "Paddock directly supports WiveyCares — a pioneering charity-run matching
                    service in Wiveliscombe, Somerset — as a live implementation of this model."
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    heading: "Better care, lower cost",
                    body: "Self-employed microproviders offer more personalised, flexible care than agency workers — and at a lower cost to families and councils.",
                  },
                  {
                    heading: "Avoid care home stays",
                    body: "By keeping care local and accessible, people can remain in their own homes longer, maintaining independence and dignity.",
                  },
                  {
                    heading: "Stronger communities",
                    body: "Intergenerational bonds form when local people care for those nearby. Paddock helps the coordinators who make those connections happen.",
                  },
                  {
                    heading: "Scalable across networks",
                    body: "Paddock is built to support charity networks of any size — from a single village to a county-wide programme.",
                  },
                ].map((item) => (
                  <div key={item.heading} className="flex items-start gap-4 border border-slate-200 rounded-xl p-5">
                    <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-[#e6f5f5] flex items-center justify-center">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3" aria-hidden="true">
                        <path d="M2 6l3 3 5-5" stroke="#0d6e6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <div>
                      <div className="font-semibold text-[#1a2535] text-sm mb-1">{item.heading}</div>
                      <div className="text-sm text-slate-600 leading-relaxed">{item.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-[#f7f9fc] border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a2535] mb-4">
                Built for the real work of care coordination
              </h2>
              <p className="text-lg text-slate-600">
                Every feature addresses a specific challenge faced by the coordinators running
                microprovider networks — not adapted from generic software.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200 rounded-xl p-8 hover:border-[#1e3a5f] hover:shadow-md transition-all duration-200"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#f0f4f9] flex items-center justify-center mb-6">
                    {feature.svg}
                  </div>
                  <h3 className="text-lg font-semibold text-[#1a2535] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits / What's included */}
        <section className="py-24 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1a2535] mb-4">
                  Everything a microprovider coordinator needs
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Paddock covers the full lifecycle of care coordination — from the moment
                  a referral comes in to the ongoing management of care relationships,
                  training, and compliance.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#e6f5f5] flex items-center justify-center">
                        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3" aria-hidden="true">
                          <path d="M2 6l3 3 5-5" stroke="#0d6e6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-slate-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Second product screenshot slot */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                <img
                  src="/images/dashboard.png"
                  alt="Wivey Cares dashboard showing care metrics, attendance allowance pipeline, brokered hours, and deprivation analytics"
                  className="w-full h-full object-cover object-top aspect-[4/3]"
                />
                <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg px-5 py-4">
                  <div className="text-2xl font-bold text-[#1e3a5f]">100%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Audit-ready records</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security / Trust section */}
        <section id="security" className="py-24 bg-[#f7f9fc] border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a2535] mb-4">
                Security you can rely on
              </h2>
              <p className="text-lg text-slate-600">
                Healthcare data is among the most sensitive. Paddock is engineered so your
                obligations — and your clients' trust — are never compromised.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "End-to-End Encryption",
                  body: "All data is encrypted in transit and at rest using industry-standard protocols.",
                },
                {
                  title: "Role-Based Access",
                  body: "Granular permission levels ensure staff only access what they need.",
                },
                {
                  title: "Full Audit Trails",
                  body: "Every action is logged and timestamped, providing complete accountability for CQC and funders.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-7">
                  <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center mb-5">
                    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
                      <path d="M10 2L3 5.5v5C3 14.1 6.2 17.6 10 18.5c3.8-.9 7-4.4 7-8V5.5L10 2z" fill="white" opacity="0.3" />
                      <path d="M10 2L3 5.5v5C3 14.1 6.2 17.6 10 18.5c3.8-.9 7-4.4 7-8V5.5L10 2z" stroke="white" strokeWidth="1.5" />
                      <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-[#1a2535] mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-24 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#0d6e6e] bg-[#e6f5f5] px-3 py-1.5 rounded-full mb-6">
                  About
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1a2535] mb-6">
                  Built for WiveyCares,<br />designed to scale
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-5">
                  Paddock was built to give WiveyCares — and microprovider networks like
                  it — the software infrastructure they deserve. Care coordinators
                  shouldn't be managing complex networks on spreadsheets.
                </p>
                <p className="text-slate-600 leading-relaxed mb-8">
                  Every feature, from automatic deprivation assessment to AI-assisted
                  form workflows, was designed in close collaboration with the people
                  who use it every day.
                </p>

                {/* Founder card */}
                <div className="flex items-center gap-5 bg-[#f7f9fc] border border-slate-200 rounded-xl p-5">
                  <img
                    src="/images/founder.jpeg"
                    alt="Paddock Health founder"
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-white shadow"
                  />
                  <div>
                    <div className="font-semibold text-[#1a2535]">Ben</div>
                    {/* UPDATE name/title as needed */}
                    <div className="text-sm text-slate-500 mb-2">Founder, Paddock Health</div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Built Paddock to support the microprovider care model and the communities it serves.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-6">
                  <h3 className="text-xl font-semibold text-[#1a2535] mb-6">Get in touch</h3>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#f0f4f9] flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
                          <path d="M2.5 5.5C2.5 4.4 3.4 3.5 4.5 3.5h11c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2h-11c-1.1 0-2-.9-2-2v-9z" stroke="#1e3a5f" strokeWidth="1.5" />
                          <path d="M2.5 6l7.5 5 7.5-5" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</div>
                        <a href="mailto:paddock@mathsdb.com" className="text-[#1e3a5f] hover:underline font-medium">
                          paddock@mathsdb.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#f0f4f9] flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
                          <path d="M4 2h3.5l1.5 4-2 1.5c.9 2 2 3.1 4 4l1.5-2 4 1.5V14c0 1.1-.9 2-2 2C6.5 16 4 8.5 4 4.5 4 3.4 3.9 2 4 2z" stroke="#1e3a5f" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone</div>
                        <a href="tel:+447853809723" className="text-[#1e3a5f] hover:underline font-medium">
                          +44 7853 809 723
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#f0f4f9] flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
                          <path d="M10 2C7.2 2 5 4.2 5 7c0 4 5 11 5 11s5-7 5-11c0-2.8-2.2-5-5-5z" stroke="#1e3a5f" strokeWidth="1.5" />
                          <circle cx="10" cy="7" r="2" stroke="#1e3a5f" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Location</div>
                        <span className="text-slate-700 font-medium">Wiveliscombe, Somerset</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1e3a5f] rounded-2xl p-8 text-white">
                  <h3 className="text-lg font-semibold mb-3">Interested in Paddock for your network?</h3>
                  <p className="text-blue-200 text-sm leading-relaxed mb-5">
                    Whether you're running a microprovider charity network or exploring the model,
                    get in touch to find out how Paddock can support your work.
                  </p>
                  <Button
                    onClick={handleSignIn}
                    className="bg-white text-[#1e3a5f] hover:bg-blue-50 font-semibold w-full"
                  >
                    Access the Platform
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#1e3a5f] py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to modernise your care coordination?
            </h2>
            <p className="text-lg text-blue-200 mb-10 max-w-xl mx-auto">
              Join WiveyCares in using Paddock to manage your microprovider network with
              confidence, compliance, and clarity.
            </p>
            <Button
              onClick={handleSignIn}
              size="lg"
              className="bg-white text-[#1e3a5f] hover:bg-blue-50 font-semibold px-10 py-3 text-base shadow-lg"
            >
              Access Paddock Health
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#111827] text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-[#1e3a5f] flex items-center justify-center">
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                  <path d="M10 3v14M3 10h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-white font-medium text-sm">Paddock Health</span>
            </div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Paddock Health. Supporting WiveyCares, Wiveliscombe, Somerset.
            </p>
            <div className="flex gap-6 text-xs">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
              <a href="#about" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
