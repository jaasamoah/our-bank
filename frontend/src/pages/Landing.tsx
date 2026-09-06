import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLongRightIcon,
  ArrowPathRoundedSquareIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  Bars3Icon,
  BoltIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleStackIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = revealRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.style.transitionDelay = `${delay}ms`;
          element.classList.add('is-visible');
          observer.unobserve(element);
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={revealRef} className={`horizon-reveal ${className}`}>
      {children}
    </div>
  );
}

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 ${light ? 'text-[#fbf7ef]' : 'text-[#16343d]'}`}>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-[13px] ${
          light ? 'bg-[#f5c76a] text-[#17323b]' : 'bg-[#173b45] text-[#f5c76a]'
        }`}
      >
        <span className="text-xl font-black leading-none" style={{ fontFamily: 'Georgia, serif' }}>
          H
        </span>
      </span>
      <span className="text-[17px] font-bold tracking-[-0.03em]">Horizon</span>
    </span>
  );
}

const navItems = [
  { label: 'Everyday', href: '#everyday' },
  { label: 'Cards', href: '#cards' },
  { label: 'Move money', href: '#move-money' },
  { label: 'Borrow', href: '#borrow' },
];

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<'everyday' | 'future' | 'human'>('everyday');
  const [locatorOpen, setLocatorOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSignUpOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = signUpOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [signUpOpen]);

  const scrollToSection = (href: string) => {
    setMobileMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#f7f5ef] text-[#17323b]">
      <style>{`
        .horizon-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 720ms cubic-bezier(.2,.8,.2,1), transform 720ms cubic-bezier(.2,.8,.2,1);
        }
        .horizon-reveal.is-visible { opacity: 1; transform: translateY(0); }
        .horizon-noise::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          opacity: .035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E");
          mix-blend-mode: multiply;
        }
        .horizon-grid {
          background-image: linear-gradient(rgba(23, 50, 59, .065) 1px, transparent 1px), linear-gradient(90deg, rgba(23, 50, 59, .065) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .horizon-pill { transition: transform 180ms ease, background-color 180ms ease, color 180ms ease, box-shadow 180ms ease; }
        .horizon-pill:hover { transform: translateY(-2px); }
        .horizon-underline { text-decoration-thickness: 1px; text-underline-offset: 5px; }
        @media (prefers-reduced-motion: reduce) {
          .horizon-reveal { opacity: 1; transform: none; transition: none; }
          .horizon-pill { transition: none; }
        }
      `}</style>

      <header className="relative z-30">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 pb-4 pt-5 sm:px-8 lg:px-10 lg:pt-7">
          <a href="#top" aria-label="Horizon Bank home" className="shrink-0">
            <Wordmark />
          </a>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-[13px] font-semibold tracking-[0.01em] text-[#587078] transition-colors hover:text-[#df6e54]"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#why-horizon"
              className="text-[13px] font-semibold tracking-[0.01em] text-[#587078] transition-colors hover:text-[#df6e54]"
            >
              Why Horizon
            </a>
          </nav>
          <div className="hidden items-center gap-2.5 lg:flex">
            <Link
              to="/login"
              className="rounded-full px-4 py-2.5 text-[13px] font-bold text-[#17323b] transition-colors hover:bg-[#e7e2d8]"
            >
              Sign in
            </Link>
            <button
              type="button"
              onClick={() => setSignUpOpen(true)}
              className="horizon-pill rounded-full bg-[#173b45] px-5 py-2.5 text-[13px] font-bold text-[#fbf7ef] shadow-[0_6px_18px_rgba(23,59,69,.15)] hover:bg-[#df6e54]"
            >
              Sign up
            </button>
          </div>
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-full p-2 text-[#17323b] hover:bg-[#e7e2d8] lg:hidden"
          >
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="mx-5 mb-4 rounded-[24px] border border-[#dedbd0] bg-[#fbf9f4] p-4 shadow-[0_18px_50px_rgba(23,50,59,.12)] lg:hidden">
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {navItems.concat({ label: 'Why Horizon', href: '#why-horizon' }).map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-[#e9e5dc] px-2 py-3.5 text-sm font-semibold text-[#38545c] last:border-0"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-3 flex items-center gap-2">
                <Link to="/login" className="flex-1 rounded-full border border-[#d7d9d3] px-4 py-3 text-center text-sm font-bold">
                  Sign in
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSignUpOpen(true);
                  }}
                  className="flex-1 rounded-full bg-[#173b45] px-4 py-3 text-sm font-bold text-[#fbf7ef]"
                >
                  Sign up
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        <section className="horizon-noise relative mx-3 overflow-hidden rounded-[28px] bg-[#dfeee8] sm:mx-5 lg:mx-8">
          <div className="horizon-grid absolute inset-0 opacity-40" />
          <div className="absolute -right-28 -top-28 h-[360px] w-[360px] rounded-full border-[70px] border-[#f5c76a]/35" />
          <div className="absolute -bottom-36 left-[32%] h-[430px] w-[430px] rounded-full border-[90px] border-[#df6e54]/10" />
          <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[.93fr_1.07fr] lg:gap-10 lg:px-14 lg:pb-28 lg:pt-24">
            <Reveal className="relative z-10 max-w-[600px]">
              <p className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.21em] text-[#df6e54]">
                <span className="h-2 w-2 rounded-full bg-[#df6e54]" />
                Banking, with a human side
              </p>
              <h1 className="max-w-[680px] text-[clamp(3.3rem,7vw,6.9rem)] font-semibold leading-[.91] tracking-[-0.075em] text-[#17323b]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                A clearer way to <em className="font-normal text-[#df6e54]">move forward.</em>
              </h1>
              <p className="mt-7 max-w-[480px] text-[17px] leading-7 text-[#4c676d] sm:text-[18px]">
                Everyday banking, thoughtful guidance, and the confidence to make your next move — all from a bank that knows money is personal.
              </p>
              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setSignUpOpen(true)}
                  className="horizon-pill group flex items-center gap-4 rounded-full bg-[#df6e54] py-2 pl-6 pr-2 text-sm font-bold text-[#fffaf1] shadow-[0_12px_25px_rgba(223,110,84,.22)] hover:bg-[#c85d47]"
                >
                  Start with Horizon
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fffaf1] text-[#df6e54] transition-transform group-hover:rotate-[-45deg]">
                    <ArrowUpRightIcon className="h-4 w-4" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('#everyday')}
                  className="horizon-underline text-sm font-bold text-[#173b45] hover:text-[#df6e54]"
                >
                  See what feels different
                </button>
              </div>
              <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 text-[12px] font-semibold text-[#587078]">
                <span className="flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4 text-[#df6e54]" /> FDIC insured</span>
                <span className="flex items-center gap-2"><LockClosedIcon className="h-4 w-4 text-[#df6e54]" /> Built for your privacy</span>
              </div>
            </Reveal>

            <Reveal delay={120} className="relative min-h-[420px] lg:min-h-[525px]">
              <div className="absolute right-1 top-1 z-10 rounded-[22px] border border-white/70 bg-[#fbf9f4]/90 p-4 shadow-[0_20px_50px_rgba(29,64,69,.12)] backdrop-blur sm:right-10 sm:top-3">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#60777a]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dfeee8] text-[#2e766e]"><ShieldCheckIcon className="h-3.5 w-3.5" /></span>
                  Protected every day
                </div>
              </div>
              <div className="absolute left-0 top-14 h-[350px] w-[350px] rounded-full bg-[#f5c76a] sm:left-7 sm:h-[430px] sm:w-[430px]" />
              <div className="absolute bottom-1 left-8 right-2 top-20 rotate-[7deg] rounded-[28px] bg-[#173b45] shadow-[0_28px_48px_rgba(24,50,58,.22)] sm:left-16 sm:right-12" />
              <div className="absolute bottom-9 left-3 right-8 top-8 z-[1] -rotate-[4deg] overflow-hidden rounded-[28px] bg-[#fbf9f4] p-5 shadow-[0_24px_50px_rgba(24,50,58,.18)] sm:left-12 sm:right-20 sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#7c8a89]">Good morning, Maya</p>
                    <p className="mt-2 text-[13px] font-semibold text-[#173b45]">Your money, in view.</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dfeee8] text-sm font-bold text-[#2e766e]">MC</div>
                </div>
                <div className="mt-9 rounded-[18px] bg-[#173b45] p-5 text-[#fbf9f4]">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.15em] text-[#a8c9c2]">
                    Everyday account <span className="text-[#f5c76a]">••• 2914</span>
                  </div>
                  <p className="mt-5 text-3xl font-semibold tracking-[-.05em]">$4,280.64</p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-[#a8c9c2]"><ArrowUpRightIcon className="h-3 w-3 text-[#f5c76a]" /> +$412.18 this month</div>
                  <div className="mt-6 flex h-10 items-end gap-1.5">
                    {[28, 34, 24, 43, 36, 49, 46, 62, 53, 74, 67, 86, 78, 96].map((height, index) => (
                      <span key={index} className={`flex-1 rounded-t-sm ${index > 10 ? 'bg-[#f5c76a]' : 'bg-[#5d8c86]'}`} style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[.12em] text-[#879492]">Recent activity</span>
                  <span className="text-[11px] font-semibold text-[#df6e54]">See all</span>
                </div>
                <div className="mt-3 space-y-3">
                  {[
                    { icon: 'H', label: 'Harbor Market', detail: 'Today, 9:42 AM', amount: '−$42.18' },
                    { icon: 'A', label: 'Auto-save', detail: 'Yesterday', amount: '+$125.00' },
                  ].map((activity) => (
                    <div key={activity.label} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0ece3] text-xs font-bold text-[#df6e54]">{activity.icon}</span>
                      <span className="flex-1"><span className="block text-xs font-bold text-[#38545c]">{activity.label}</span><span className="block text-[10px] text-[#91a09e]">{activity.detail}</span></span>
                      <span className={`text-xs font-bold ${activity.amount.startsWith('+') ? 'text-[#2e766e]' : 'text-[#38545c]'}`}>{activity.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-1 right-0 z-10 flex items-center gap-3 rounded-[20px] border border-white/80 bg-[#fffaf1]/95 p-3 pr-5 shadow-[0_17px_36px_rgba(29,64,69,.14)] sm:right-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5c76a]"><SparklesIcon className="h-4 w-4 text-[#173b45]" /></span>
                <span><span className="block text-[11px] font-bold text-[#173b45]">Personal, not perfect</span><span className="block text-[10px] text-[#738783]">Real answers from real people</span></span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-5 px-5 py-9 sm:px-8 lg:px-14">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#8b9792]">Trusted for the everyday</p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[12px] font-semibold text-[#627773]">
            <span className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4 text-[#5d8c86]" /> No hidden monthly fees</span>
            <span className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4 text-[#5d8c86]" /> 24/7 fraud monitoring</span>
            <span className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4 text-[#5d8c86]" /> Human support when you need it</span>
          </div>
        </section>

        <section id="everyday" className="scroll-mt-10 border-t border-[#e4e1d8] bg-[#fbf9f4]">
          <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
            <Reveal className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#df6e54]">More than a balance</p>
                <h2 className="mt-5 max-w-[470px] text-4xl font-semibold leading-[1.03] tracking-[-.06em] text-[#17323b] sm:text-5xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  The little things should feel <em className="font-normal text-[#df6e54]">easy.</em>
                </h2>
                <p className="mt-6 max-w-[410px] text-[16px] leading-7 text-[#69807d]">
                  Your everyday money has enough going on. Horizon keeps the essentials close, clear, and ready when life changes its mind.
                </p>
                <div className="mt-10 space-y-2">
                  {[
                    { id: 'everyday' as const, icon: CircleStackIcon, title: 'Everyday, made visible', text: 'See the whole picture without digging for it.' },
                    { id: 'future' as const, icon: PresentationChartLineIcon, title: 'Plans that look ahead', text: 'Turn small habits into a future you can name.' },
                    { id: 'human' as const, icon: UserGroupIcon, title: 'A person in your corner', text: 'Good questions deserve more than a chatbot.' },
                  ].map((feature) => {
                    const Icon = feature.icon;
                    const isActive = selectedFeature === feature.id;
                    return (
                      <button
                        key={feature.id}
                        type="button"
                        onClick={() => setSelectedFeature(feature.id)}
                        className={`flex w-full items-center gap-4 rounded-[18px] p-3 text-left transition-colors ${isActive ? 'bg-[#e7f1ed]' : 'hover:bg-[#f0eee8]'}`}
                      >
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${isActive ? 'bg-[#173b45] text-[#f5c76a]' : 'bg-[#efebe2] text-[#6b827e]'}`}><Icon className="h-5 w-5" /></span>
                        <span className="flex-1"><span className="block text-sm font-bold text-[#294a52]">{feature.title}</span><span className="mt-1 block text-[12px] text-[#78908b]">{feature.text}</span></span>
                        <ChevronRightIcon className={`h-4 w-4 ${isActive ? 'text-[#df6e54]' : 'text-[#a9b4ae]'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="relative min-h-[425px] overflow-hidden rounded-[30px] bg-[#eef2e9] p-5 sm:p-8">
                <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#f5c76a]/50" />
                <div className="absolute -left-24 top-16 h-56 w-56 rounded-full border-[38px] border-[#df6e54]/15" />
                <div className="relative grid gap-5 sm:grid-cols-[1.1fr_.9fr]">
                  <div className="rounded-[22px] bg-[#fffaf1] p-5 shadow-[0_18px_35px_rgba(49,73,68,.10)] sm:mt-10">
                    <div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#7e908b]">Money map</span><span className="rounded-full bg-[#e5f1eb] px-2 py-1 text-[10px] font-bold text-[#32766a]">On track</span></div>
                    <p className="mt-5 text-3xl font-semibold tracking-[-.06em] text-[#173b45]">$2,840.20</p>
                    <p className="mt-1 text-xs text-[#82918d]">available this month</p>
                    <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#eae7dc]"><div className="h-full w-[72%] rounded-full bg-[#df6e54]" /></div>
                    <div className="mt-3 flex justify-between text-[10px] font-semibold text-[#879691]"><span>72% planned</span><span>$1,160 remaining</span></div>
                    <div className="mt-8 space-y-3">
                      {['Essentials', 'Future you', 'Room to breathe'].map((label, index) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-[#df6e54]' : index === 1 ? 'bg-[#f5c76a]' : 'bg-[#75a9a0]'}`} />
                          <span className="flex-1 text-xs font-semibold text-[#56706c]">{label}</span>
                          <span className="text-xs font-bold text-[#294a52]">{['$1,420', '$680', '$740'][index]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="rounded-[22px] bg-[#173b45] p-5 text-[#fbf9f4] shadow-[0_18px_35px_rgba(49,73,68,.14)]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5c76a] text-[#173b45]"><ArrowPathRoundedSquareIcon className="h-4 w-4" /></span>
                      <p className="mt-7 text-sm font-bold">Auto-save is on</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#a6c2bc]">Every Friday, $25 finds its way to your future.</p>
                    </div>
                    <div className="rounded-[22px] border border-[#d8dfd6] bg-[#f7faf4] p-5">
                      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#708782]"><BoltIcon className="h-4 w-4 text-[#df6e54]" /> One small win</span>
                      <p className="mt-4 text-[24px] font-semibold tracking-[-.05em] text-[#173b45]">+$125.00</p>
                      <p className="mt-1 text-[11px] text-[#81938d]">saved this month</p>
                    </div>
                  </div>
                </div>
                <div className="relative mt-7 flex items-center justify-between rounded-[16px] bg-[#d8e8e1] px-4 py-3 text-xs font-semibold text-[#52716c]">
                  <span className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4 text-[#32766a]" /> Your plan is up to date</span>
                  <ArrowLongRightIcon className="h-4 w-4" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="cards" className="scroll-mt-10 bg-[#173b45] text-[#fbf9f4]">
          <div className="horizon-noise relative mx-auto max-w-[1280px] overflow-hidden px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
            <div className="absolute right-[-90px] top-[-120px] h-[410px] w-[410px] rounded-full border-[75px] border-[#5d8c86]/20" />
            <Reveal className="relative grid items-center gap-14 lg:grid-cols-[1fr_.96fr] lg:gap-24">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#f5c76a]">A card with a point of view</p>
                <h2 className="mt-5 max-w-[570px] text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-6xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Spend like yourself. <em className="font-normal text-[#f5c76a]">Not a number.</em>
                </h2>
                <p className="mt-6 max-w-[455px] text-[16px] leading-7 text-[#b5cbc5]">
                  A debit card that’s ready for grocery runs, big ideas, and everything in between. Freeze it, manage it, and see every purchase at a glance.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  {['No surprise fees', 'Instant card controls', 'Tap to pay'].map((item) => (
                    <span key={item} className="rounded-full border border-[#4e7775] px-4 py-2 text-[11px] font-bold text-[#d7e4de]">{item}</span>
                  ))}
                </div>
                <button type="button" onClick={() => setSignUpOpen(true)} className="horizon-pill mt-10 flex items-center gap-3 text-sm font-bold text-[#f5c76a] hover:text-[#fffaf1]">
                  Meet your next card <ArrowLongRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              <div className="relative min-h-[310px]">
                <div className="absolute left-5 right-0 top-12 h-[208px] rotate-[8deg] rounded-[24px] bg-[#df6e54] shadow-[0_25px_50px_rgba(0,0,0,.25)] sm:left-16 sm:right-10">
                  <span className="absolute bottom-5 left-6 text-sm font-bold text-[#fffaf1]/80">Horizon</span>
                </div>
                <div className="absolute left-0 right-8 top-2 z-10 h-[208px] -rotate-[7deg] overflow-hidden rounded-[24px] border border-white/20 bg-[#f5c76a] p-6 text-[#173b45] shadow-[0_25px_50px_rgba(0,0,0,.3)] sm:left-10 sm:right-0">
                  <div className="flex justify-between"><span className="text-lg font-black tracking-[-.06em]" style={{ fontFamily: 'Georgia, serif' }}>Horizon</span><span className="text-[10px] font-bold uppercase tracking-[.18em]">debit</span></div>
                  <div className="mt-10 h-8 w-11 rounded-md border border-[#173b45]/35 bg-[#f9d990]/70"><div className="ml-5 h-full w-px bg-[#173b45]/20" /></div>
                  <div className="mt-7 flex items-end justify-between"><span className="text-[11px] font-bold tracking-[.2em]">MAYA CARTER</span><span className="text-lg font-bold">·· 2914</span></div>
                </div>
                <div className="absolute bottom-0 left-2 z-20 flex items-center gap-3 rounded-[17px] border border-[#d2e3da]/20 bg-[#285561] p-3 pr-5 shadow-[0_14px_30px_rgba(0,0,0,.18)] sm:left-8">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#b9dbd3] text-[#173b45]"><LockClosedIcon className="h-4 w-4" /></span>
                  <span><span className="block text-[11px] font-bold">Your card, your rules</span><span className="block text-[10px] text-[#a9c7c1]">Set limits in a tap</span></span>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="move-money" className="scroll-mt-10 bg-[#f7f5ef]">
          <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
            <Reveal>
              <div className="flex flex-col justify-between gap-7 border-b border-[#dddcd3] pb-10 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#df6e54]">One bank, many directions</p>
                  <h2 className="mt-4 max-w-[600px] text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-5xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Choose what comes <em className="font-normal text-[#df6e54]">next.</em></h2>
                </div>
                <p className="max-w-[300px] text-sm leading-6 text-[#748883]">From your first transfer to your long-term plan, you don’t have to figure it out in isolation.</p>
              </div>
              <div className="divide-y divide-[#dddcd3]">
                {[
                  { id: 'move-money', number: '01', icon: PaperAirplaneIcon, title: 'Move money without the maze', text: 'Send money to friends, family, or another bank with clear timing and no mystery.', action: 'Explore transfers' },
                  { id: 'invest', number: '02', icon: PresentationChartLineIcon, title: 'Make room for future you', text: 'Simple investment options and a real person to help you understand the road ahead.', action: 'Explore investing' },
                  { id: 'borrow', number: '03', icon: BanknotesIcon, title: 'Borrow with a clear answer', text: 'Flexible loans with terms you can actually read, compare, and feel good about.', action: 'Explore lending' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div id={item.id} key={item.number} className="group grid gap-4 py-7 sm:grid-cols-[70px_1fr_auto] sm:items-center sm:gap-7">
                      <span className="text-[12px] font-bold text-[#b0b9b2]">{item.number}</span>
                      <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#e6eee9] text-[#32766a] transition-colors group-hover:bg-[#df6e54] group-hover:text-[#fffaf1]"><Icon className="h-5 w-5" /></span>
                        <span><span className="block text-[19px] font-bold tracking-[-.03em] text-[#294a52]">{item.title}</span><span className="mt-1 block max-w-[520px] text-[13px] leading-6 text-[#78908b]">{item.text}</span></span>
                      </div>
                      <button type="button" onClick={() => setSignUpOpen(true)} className="ml-16 flex items-center gap-2 text-left text-[12px] font-bold text-[#df6e54] hover:text-[#173b45] sm:ml-0 sm:justify-self-end">{item.action}<ArrowUpRightIcon className="h-4 w-4" /></button>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        <section id="why-horizon" className="scroll-mt-10 bg-[#e7f0eb]">
          <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
            <Reveal className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-24">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#df6e54]">Why Horizon</p>
                <h2 className="mt-5 max-w-[500px] text-4xl font-semibold leading-[1.02] tracking-[-.06em] text-[#17323b] sm:text-5xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  A bank should know when to be <em className="font-normal text-[#df6e54]">human.</em>
                </h2>
                <p className="mt-6 max-w-[420px] text-[16px] leading-7 text-[#637b77]">We built Horizon around a simple belief: clarity is a form of care. That means useful tools, honest terms, and a person who picks up.</p>
                <div className="mt-9 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['A', 'J', 'R', 'S'].map((initial, index) => <span key={initial} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#e7f0eb] text-[10px] font-bold ${['bg-[#df6e54]', 'bg-[#f5c76a]', 'bg-[#75a9a0]', 'bg-[#173b45]'][index]} text-[#fffaf1]`}>{initial}</span>)}
                  </div>
                  <span className="text-[12px] font-semibold text-[#58736e]">Real people. Ready to help.</span>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] bg-[#173b45] p-6 text-[#fbf9f4] sm:row-span-2 sm:p-7">
                  <ShieldCheckIcon className="h-7 w-7 text-[#f5c76a]" />
                  <p className="mt-20 text-[28px] font-semibold leading-tight tracking-[-.05em]">Steady when the unexpected happens.</p>
                  <p className="mt-4 text-[13px] leading-6 text-[#a8c4be]">Smart security watches over every account, without making you jump through hoops.</p>
                </div>
                <div className="rounded-[24px] bg-[#fffaf1] p-6 sm:p-7">
                  <PhoneIcon className="h-6 w-6 text-[#df6e54]" />
                  <p className="mt-8 text-[19px] font-bold tracking-[-.03em] text-[#294a52]">People, not scripts.</p>
                  <p className="mt-2 text-[12px] leading-5 text-[#78908b]">Ask the question behind the question.</p>
                </div>
                <div className="rounded-[24px] bg-[#f5c76a] p-6 sm:p-7">
                  <GlobeAltIcon className="h-6 w-6 text-[#173b45]" />
                  <p className="mt-8 text-[19px] font-bold tracking-[-.03em] text-[#173b45]">Ready for real life.</p>
                  <p className="mt-2 text-[12px] leading-5 text-[#49635f]">Bank at home, abroad, and everywhere between.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-[#fbf9f4]">
          <div className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 lg:px-14 lg:py-32">
            <Reveal className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
              <div className="relative overflow-hidden rounded-[28px] bg-[#df6e54] p-7 text-[#fffaf1] sm:p-10">
                <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full border-[45px] border-[#f5c76a]/40" />
                <p className="relative text-[11px] font-bold uppercase tracking-[.2em] text-[#ffe6bd]">A little perspective</p>
                <p className="relative mt-14 max-w-[380px] text-[27px] font-semibold leading-[1.08] tracking-[-.05em]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>“For once, my bank app feels like it’s on my side.”</p>
                <div className="relative mt-10 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5c76a] text-xs font-bold text-[#173b45]">LC</span><span className="text-xs font-semibold text-[#ffe6bd]">Lena, Horizon customer since 2019</span></div>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#df6e54]">Small steps add up</p>
                <h2 className="mt-5 max-w-[570px] text-4xl font-semibold leading-[1.02] tracking-[-.06em] text-[#17323b] sm:text-5xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>You bring the ambition. We’ll bring the <em className="font-normal text-[#df6e54]">clarity.</em></h2>
                <div className="mt-10 grid gap-7 border-t border-[#dedbd1] pt-7 sm:grid-cols-3">
                  <div><p className="text-3xl font-semibold tracking-[-.06em] text-[#173b45]">4.8<span className="text-[#df6e54]">/5</span></p><p className="mt-2 text-[11px] font-semibold leading-4 text-[#7a8c87]">average customer rating</p></div>
                  <div><p className="text-3xl font-semibold tracking-[-.06em] text-[#173b45]">12 min</p><p className="mt-2 text-[11px] font-semibold leading-4 text-[#7a8c87]">average support wait</p></div>
                  <div><p className="text-3xl font-semibold tracking-[-.06em] text-[#173b45]">24/7</p><p className="mt-2 text-[11px] font-semibold leading-4 text-[#7a8c87]">account monitoring</p></div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#dfeee8]">
          <div className="absolute left-[-130px] top-[-110px] h-[370px] w-[370px] rounded-full border-[70px] border-[#f5c76a]/30" />
          <div className="relative mx-auto max-w-[1280px] px-5 py-24 text-center sm:px-8 lg:px-14 lg:py-32">
            <Reveal>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#df6e54]">Your next chapter starts here</p>
              <h2 className="mx-auto mt-5 max-w-[750px] text-5xl font-semibold leading-[.96] tracking-[-.07em] text-[#17323b] sm:text-7xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Let’s make money feel a little more <em className="font-normal text-[#df6e54]">personal.</em></h2>
              <p className="mx-auto mt-7 max-w-[440px] text-[16px] leading-7 text-[#58736e]">Open an account online, complete a short form, then visit your nearest branch so we can meet properly.</p>
              <button type="button" onClick={() => setSignUpOpen(true)} className="horizon-pill mt-9 inline-flex items-center gap-4 rounded-full bg-[#173b45] py-2 pl-6 pr-2 text-sm font-bold text-[#fbf9f4] shadow-[0_13px_28px_rgba(23,59,69,.17)] hover:bg-[#df6e54]">
                Start your Horizon story <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5c76a] text-[#173b45]"><ArrowUpRightIcon className="h-4 w-4" /></span>
              </button>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="bg-[#173b45] text-[#fbf9f4]">
        <div className="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:px-14 lg:py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Wordmark light />
              <p className="mt-5 max-w-[260px] text-[13px] leading-6 text-[#a7c2bc]">A modern bank for the life you’re actually living.</p>
            </div>
            <div><p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#f5c76a]">Explore</p><div className="mt-5 space-y-3 text-[13px] text-[#bfd0ca]"><a href="#everyday" className="block hover:text-[#f5c76a]">Everyday banking</a><a href="#cards" className="block hover:text-[#f5c76a]">Cards</a><a href="#move-money" className="block hover:text-[#f5c76a]">Transfers</a></div></div>
            <div><p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#f5c76a]">Plan ahead</p><div className="mt-5 space-y-3 text-[13px] text-[#bfd0ca]"><a href="#move-money" className="block hover:text-[#f5c76a]">Investments</a><a href="#borrow" className="block hover:text-[#f5c76a]">Loans</a><a href="#why-horizon" className="block hover:text-[#f5c76a]">Why Horizon</a></div></div>
            <div><p className="text-[11px] font-bold uppercase tracking-[.17em] text-[#f5c76a]">Already with us?</p><div className="mt-5 space-y-3 text-[13px] text-[#bfd0ca]"><Link to="/login" className="block hover:text-[#f5c76a]">Sign in to banking</Link><button type="button" onClick={() => setSignUpOpen(true)} className="block text-left hover:text-[#f5c76a]">Sign up</button></div></div>
          </div>
          <div className="mt-14 flex flex-col justify-between gap-4 border-t border-[#3d6269] pt-6 text-[11px] text-[#8eaaa3] sm:flex-row"><p>© {new Date().getFullYear()} Horizon Bank. Member FDIC. Equal Housing Lender.</p><p>Privacy · Security · Accessibility</p></div>
        </div>
      </footer>

      {signUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17323b]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="signup-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setSignUpOpen(false); }}>
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-[550px] overflow-y-auto rounded-[28px] bg-[#fbf9f4] p-6 shadow-[0_30px_80px_rgba(12,35,42,.28)] sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#df6e54]">A good first step</p><h2 id="signup-title" className="mt-3 text-3xl font-semibold tracking-[-.06em] text-[#17323b]" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{formSubmitted ? 'You’re on your way.' : 'Let’s get started.'}</h2></div>
              <button type="button" aria-label="Close sign up dialog" onClick={() => setSignUpOpen(false)} className="rounded-full p-2 text-[#70837f] hover:bg-[#e9e6dd] hover:text-[#17323b]"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            {formSubmitted ? (
              <div className="mt-8">
                <div className="flex items-start gap-4 rounded-[20px] bg-[#e4f1eb] p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#32766a] text-[#fbf9f4]"><CheckCircleIcon className="h-5 w-5" /></span><div><p className="text-sm font-bold text-[#244f50]">Thanks — we have your starting point.</p><p className="mt-1 text-[13px] leading-6 text-[#5a7771]">The next step is to visit your nearest Horizon branch with a valid photo ID. A banker will finish your application with you, answer questions, and get your account ready.</p></div></div>
                <button type="button" onClick={() => setLocatorOpen((open) => !open)} className="mt-5 flex w-full items-center justify-between rounded-[17px] border border-[#d8ddd5] px-4 py-3.5 text-left text-sm font-bold text-[#294a52] hover:border-[#df6e54]"><span className="flex items-center gap-2"><MapPinIcon className="h-5 w-5 text-[#df6e54]" /> {locatorOpen ? 'Hide nearby branches' : 'Find your nearest branch'}</span><ChevronDownIcon className={`h-4 w-4 transition-transform ${locatorOpen ? 'rotate-180' : ''}`} /></button>
                {locatorOpen && <div className="mt-3 space-y-2 rounded-[17px] bg-[#f0eee7] p-3"><div className="flex items-center gap-2 rounded-xl bg-[#fbf9f4] px-3 py-2.5 text-xs text-[#8a9893]"><MagnifyingGlassIcon className="h-4 w-4" /> Search by city or ZIP code</div>{['Riverside Branch · 0.8 mi', 'Market Street Branch · 2.1 mi'].map((branch) => <div key={branch} className="flex items-center justify-between rounded-xl bg-[#fbf9f4] px-3 py-3 text-xs font-semibold text-[#45615f]"><span>{branch}</span><ChevronRightIcon className="h-4 w-4 text-[#df6e54]" /></div>)}</div>}
                <button type="button" onClick={() => { setSignUpOpen(false); setFormSubmitted(false); setLocatorOpen(false); }} className="mt-7 w-full rounded-full bg-[#173b45] px-5 py-3.5 text-sm font-bold text-[#fbf9f4] hover:bg-[#df6e54]">Close</button>
              </div>
            ) : (
              <>
                <p className="mt-4 text-[14px] leading-6 text-[#6c827d]">Tell us a little about yourself. Registration has two simple parts: complete this form, then visit your nearest branch so a Horizon banker can verify your identity and finish setting things up.</p>
                <form onSubmit={handleSignUp} className="mt-7 space-y-4">
                  <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#38545c]">Full name</span><input required name="name" className="w-full rounded-xl border border-[#d9ddd4] bg-[#fffdf8] px-4 py-3 text-sm text-[#17323b] outline-none transition-colors placeholder:text-[#a2afaa] focus:border-[#df6e54] focus:ring-2 focus:ring-[#df6e54]/15" placeholder="Your name" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#38545c]">Mobile number</span><input required name="phone" type="tel" className="w-full rounded-xl border border-[#d9ddd4] bg-[#fffdf8] px-4 py-3 text-sm text-[#17323b] outline-none transition-colors placeholder:text-[#a2afaa] focus:border-[#df6e54] focus:ring-2 focus:ring-[#df6e54]/15" placeholder="(555) 000-0000" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-bold text-[#38545c]">What brings you to Horizon?</span><select name="interest" className="w-full appearance-none rounded-xl border border-[#d9ddd4] bg-[#fffdf8] px-4 py-3 text-sm text-[#17323b] outline-none focus:border-[#df6e54]"><option>Everyday banking</option><option>A new card</option><option>Saving and investing</option><option>A loan</option></select></label>
                  <div className="flex items-start gap-2 rounded-xl bg-[#f0eee7] p-3 text-[11px] leading-5 text-[#788983]"><LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#32766a]" /> We don’t submit an application here. Your details stay in this session until you’re ready to visit a branch.</div>
                  <button type="submit" className="w-full rounded-full bg-[#173b45] px-5 py-3.5 text-sm font-bold text-[#fbf9f4] transition-colors hover:bg-[#df6e54]">Continue to branch visit</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Landing;