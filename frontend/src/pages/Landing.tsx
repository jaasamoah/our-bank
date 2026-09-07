import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLongRightIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  Bars3Icon,
  CheckCircleIcon,
  ChevronRightIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Brand from '../components/Brand';
import AccountCard from '../components/AccountCard';
import PublicSupportWidget from '../components/PublicSupportWidget';
import TransactionRow from '../components/TransactionRow';
import { formatCurrency, mockAccounts, mockTransactions } from '../mock/data';

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
          element.classList.add('telos-visible');
          observer.unobserve(element);
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={revealRef} className={`telos-reveal ${className}`}>
      {children}
    </div>
  );
}

const navItems = [
  { label: 'Everyday', href: '#everyday' },
  { label: 'Cards', href: '#cards' },
  { label: 'Loans', href: '#loans' },
  { label: 'About', href: '#about' },
];

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        setSignUpOpen(false);
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

  const handleSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-white text-slate-950">
      <style>{`
        html { scroll-behavior: smooth; }
        .telos-reveal { opacity: 0; transform: translateY(22px); transition: opacity 650ms ease, transform 650ms ease; }
        .telos-visible { opacity: 1; transform: translateY(0); }
        .telos-grid { background-image: linear-gradient(rgba(30, 64, 175, .08) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 64, 175, .08) 1px, transparent 1px); background-size: 42px 42px; }
        .telos-pill { transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease; }
        .telos-pill:hover { transform: translateY(-2px); }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .telos-reveal { opacity: 1; transform: none; transition: none; }
          .telos-pill { transition: none; }
        }
      `}</style>

      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-blue-100/80 bg-white/90 px-4 py-3 shadow-lg shadow-blue-950/10 backdrop-blur-xl sm:px-6">
          <a href="#top" aria-label="Telos home" className="shrink-0">
            <Brand className="text-2xl" />
          </a>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-700">
                {item.label}
              </a>
            ))}
            <a href="#contact" className="text-sm font-medium text-slate-600 transition-colors hover:text-blue-700">Contact</a>
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">Sign in</Link>
            <button type="button" onClick={() => setSignUpOpen(true)} className="telos-pill rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-700/20 hover:bg-blue-800">Sign up</button>
          </div>
          <button type="button" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-xl p-2 text-slate-700 hover:bg-blue-50 lg:hidden">
            {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="mx-auto mt-2 max-w-6xl rounded-2xl border border-blue-100 bg-white p-4 shadow-xl lg:hidden">
            <nav className="flex flex-col" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="border-b border-blue-50 px-2 py-3 text-sm font-semibold text-slate-700 last:border-0">
                  {item.label}
                </a>
              ))}
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="border-b border-blue-50 px-2 py-3 text-sm font-semibold text-slate-700">Contact</a>
              <div className="mt-3 flex gap-2">
                <Link to="/login" className="flex-1 rounded-xl border border-blue-100 px-4 py-3 text-center text-sm font-semibold text-slate-700">Sign in</Link>
                <button type="button" onClick={() => { setMobileMenuOpen(false); setSignUpOpen(true); }} className="flex-1 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white">Sign up</button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main id="top" className="pt-24">
        <section className="relative overflow-hidden bg-blue-50">
          <div className="telos-grid absolute inset-0 opacity-60" />
          <div className="absolute -right-32 -top-28 h-96 w-96 rounded-full bg-blue-200/55 blur-3xl" />
          <div className="absolute -bottom-48 left-1/3 h-96 w-96 rounded-full bg-white/90 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:px-10 lg:py-24">
            <Reveal className="relative z-10">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> Banking made clear
              </p>
              <h1 className="mt-6 max-w-xl text-5xl font-bold leading-[.98] tracking-[-.06em] text-slate-950 sm:text-7xl">
                Your money, <span className="text-blue-700">in focus.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                Telos gives you a calmer way to manage everyday banking, cards, savings, and plans for what comes next.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <button type="button" onClick={() => setSignUpOpen(true)} className="telos-pill group flex items-center gap-3 rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-700/20 hover:bg-blue-800">
                  Start with Telos
                  <ArrowUpRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
                <a href="#everyday" className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">
                  See the app <ArrowLongRightIcon className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4 text-blue-700" /> Built for privacy</span>
                <span className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4 text-blue-700" /> Human support</span>
              </div>
            </Reveal>

            <Reveal delay={100} className="relative">
              <div className="absolute -right-4 -top-5 h-32 w-32 rounded-full bg-blue-200/80 blur-2xl" />
              <div className="relative rounded-3xl border border-white/80 bg-white/80 p-4 shadow-2xl shadow-blue-950/15 backdrop-blur sm:p-6">
                <div className="flex items-center justify-between border-b border-blue-50 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-700">Inside Telos</p>
                    <p className="mt-1 text-sm font-medium text-slate-500">The same account view customers use</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white"><SparklesIcon className="h-5 w-5" /></span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {mockAccounts.slice(0, 2).map((account) => <AccountCard key={account.id} account={account} />)}
                </div>
                <div className="mt-4 rounded-2xl border border-slate-100 bg-white px-4">
                  <div className="flex items-center justify-between border-b border-slate-100 py-3">
                    <p className="text-sm font-bold text-slate-900">Recent activity</p>
                    <span className="text-xs font-semibold text-blue-700">View all</span>
                  </div>
                  {mockTransactions.slice(0, 3).map((transaction) => (
                    <TransactionRow key={transaction.id} txn={transaction} />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="everyday" className="scroll-mt-24 border-b border-blue-100 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
            <Reveal className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700">Everyday banking</p>
                <h2 className="mt-5 max-w-lg text-4xl font-bold leading-tight tracking-[-.05em] text-slate-950 sm:text-5xl">The details are easier to see.</h2>
                <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                  Check balances, understand spending, and move through your day without hunting for the information you need.
                </p>
                <div className="mt-8 space-y-3">
                  {['Clear balances at a glance', 'Transactions with useful context', 'A support team that listens'].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <CheckCircleIcon className="h-5 w-5 text-blue-700" /> {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-blue-50 p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {mockAccounts.map((account) => <AccountCard key={account.id} account={account} />)}
                </div>
                <div className="mt-4 grid gap-4 rounded-2xl bg-white p-5 sm:grid-cols-[1fr_.8fr]">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Spending overview</p>
                    <div className="mt-5 space-y-3">
                      {[
                        ['Housing', 72, 'bg-blue-700'],
                        ['Groceries', 42, 'bg-blue-500'],
                        ['Transport', 28, 'bg-blue-300'],
                      ].map(([label, width, color]) => (
                        <div key={label as string}>
                          <div className="mb-1 flex justify-between text-xs font-medium text-slate-500"><span>{label}</span><span>{width}%</span></div>
                          <div className="h-2 overflow-hidden rounded-full bg-blue-50"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-blue-700 p-5 text-white">
                    <LockClosedIcon className="h-6 w-6 text-blue-200" />
                    <p className="mt-10 text-sm font-bold">Your money stays yours.</p>
                    <p className="mt-2 text-xs leading-5 text-blue-100">Simple controls and clear activity help you stay in charge.</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="cards" className="scroll-mt-24 bg-blue-700 text-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_.9fr] lg:items-center lg:px-10 lg:py-28">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-200">Cards that work with you</p>
              <h2 className="mt-5 max-w-xl text-4xl font-bold leading-tight tracking-[-.05em] sm:text-5xl">Control your card without calling around.</h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-blue-100">
                Freeze a card, review the full number, and stay close to every purchase from the Telos dashboard.
              </p>
              <button type="button" onClick={() => setSignUpOpen(true)} className="mt-8 flex items-center gap-2 text-sm font-semibold text-white hover:text-blue-200">
                Get started with Telos <ArrowLongRightIcon className="h-4 w-4" />
              </button>
            </Reveal>
            <Reveal delay={100} className="relative min-h-[280px]">
              <div className="absolute left-8 right-0 top-12 h-52 rotate-6 rounded-3xl bg-blue-300 shadow-2xl shadow-blue-950/30" />
              <div className="absolute inset-x-0 top-0 z-10 h-52 -rotate-6 rounded-3xl bg-white p-6 text-slate-950 shadow-2xl shadow-blue-950/30">
                <div className="flex items-start justify-between">
                  <Brand className="text-2xl" />
                  <span className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">debit</span>
                </div>
                <div className="mt-10 h-8 w-12 rounded-md border border-blue-200 bg-blue-50" />
                <div className="mt-7 flex items-end justify-between text-xs font-bold tracking-[.18em]">
                  <span>JORDAN ELLIS</span><span>•• 4821</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-5 z-20 rounded-2xl border border-blue-500 bg-blue-800 px-4 py-3 text-xs font-semibold text-white">
                Freeze or unfreeze in one tap
              </div>
            </Reveal>
          </div>
        </section>

        <section id="loans" className="scroll-mt-24 border-b border-blue-100 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
            <Reveal className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700">Loans</p>
                <h2 className="mt-5 text-4xl font-bold leading-tight tracking-[-.05em] text-slate-950 sm:text-5xl">Plans you can understand.</h2>
                <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                  See the amount, rate, remaining balance, and status together so your next decision feels informed.
                </p>
                <button type="button" onClick={() => setSignUpOpen(true)} className="mt-8 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/15 hover:bg-blue-800">Ask about a loan</button>
              </div>
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 sm:p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Personal loan</p>
                    <p className="mt-2 text-3xl font-bold tracking-[-.05em] text-slate-950">{formatCurrency(12500)}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-700">In review</span>
                </div>
                <div className="mt-8 grid gap-4 border-t border-blue-100 pt-5 sm:grid-cols-3">
                  <div><p className="text-xs text-slate-500">Outstanding</p><p className="mt-1 font-bold text-slate-900">{formatCurrency(9800)}</p></div>
                  <div><p className="text-xs text-slate-500">Rate</p><p className="mt-1 font-bold text-slate-900">6.9%</p></div>
                  <div><p className="text-xs text-slate-500">Term</p><p className="mt-1 font-bold text-slate-900">48 months</p></div>
                </div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white"><div className="h-full w-[22%] rounded-full bg-blue-700" /></div>
                <p className="mt-2 text-xs text-slate-500">A clear view of where you are today</p>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 bg-slate-50">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
            <Reveal className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700">About Telos</p>
                <h2 className="mt-5 text-4xl font-bold leading-tight tracking-[-.05em] text-slate-950 sm:text-5xl">A bank that helps you see the next step.</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-blue-700 p-6 text-white sm:row-span-2">
                  <ShieldCheckIcon className="h-7 w-7 text-blue-200" />
                  <p className="mt-16 text-2xl font-bold tracking-[-.04em]">Clear by default.</p>
                  <p className="mt-4 text-sm leading-6 text-blue-100">Telos brings the important details forward, without making you dig through a maze of screens.</p>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <CheckCircleIcon className="h-6 w-6 text-blue-700" />
                  <p className="mt-8 font-bold text-slate-900">Useful tools</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Accounts, cards, transfers, investments, and loans in one place.</p>
                </div>
                <div className="rounded-3xl bg-blue-100 p-6">
                  <BanknotesIcon className="h-6 w-6 text-blue-700" />
                  <p className="mt-8 font-bold text-slate-900">Real people</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">When you need help, send a request and our team receives it directly.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
            <Reveal className="rounded-3xl bg-blue-50 p-7 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700">Contact</p>
                <h2 className="mt-4 text-3xl font-bold tracking-[-.04em] text-slate-950 sm:text-4xl">Have a question?</h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Use the chat button to send a request to Telos, or visit a branch to speak with our team in person.</p>
              </div>
              <div className="mt-7 flex flex-col gap-3 text-sm font-semibold text-slate-700 lg:mt-0 lg:min-w-[230px]">
                <button type="button" onClick={() => setSignUpOpen(true)} className="rounded-xl bg-blue-700 px-5 py-3 text-white hover:bg-blue-800">Open an account</button>
                <a href="tel:+18005550148" className="rounded-xl border border-blue-200 bg-white px-5 py-3 text-center hover:border-blue-400 hover:text-blue-700">Call 1 (800) 555-0148</a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div>
            <Brand light className="text-2xl" />
            <p className="mt-2 text-xs text-slate-400">Banking made clear and personal.</p>
          </div>
          <div className="flex flex-wrap gap-5 text-xs font-medium text-slate-400">
            <a href="#about" className="hover:text-white">About</a>
            <a href="#contact" className="hover:text-white">Contact</a>
            <Link to="/login" className="hover:text-white">Sign in</Link>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Telos Bank</p>
        </div>
      </footer>

      <PublicSupportWidget />

      {signUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="signup-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setSignUpOpen(false); }}>
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-700">Start with Telos</p>
                <h2 id="signup-title" className="mt-3 text-3xl font-bold tracking-[-.05em] text-slate-950">{formSubmitted ? 'Your next step is ready.' : 'Tell us where to start.'}</h2>
              </div>
              <button type="button" aria-label="Close sign up dialog" onClick={() => setSignUpOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-700"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            {formSubmitted ? (
              <div className="mt-7">
                <div className="rounded-2xl bg-blue-50 p-5">
                  <CheckCircleIcon className="h-7 w-7 text-blue-700" />
                  <p className="mt-4 text-sm font-bold text-slate-950">Thanks. Your starting point is saved for this visit.</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Complete the form, then visit your nearest Telos branch with a valid photo ID so a banker can finish setting things up with you.</p>
                </div>
                <button type="button" onClick={() => { setSignUpOpen(false); setFormSubmitted(false); }} className="mt-5 w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">Close</button>
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm leading-6 text-slate-600">Registration has two simple parts: complete this short form, then visit your nearest branch so a Telos banker can verify your identity and finish setting things up.</p>
                <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                  <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Full name</span><input required name="name" placeholder="Your name" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">Mobile number</span><input required name="phone" type="tel" placeholder="(555) 000-0000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-700">What brings you to Telos?</span><select name="interest" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option>Everyday banking</option><option>A new card</option><option>Saving and investing</option><option>A loan</option></select></label>
                  <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-slate-600"><LockClosedIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" /> We do not submit an application here. Bring a valid photo ID to your nearest branch.</div>
                  <button type="submit" className="w-full rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-semibold text-white hover:bg-blue-800">Continue to branch visit</button>
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