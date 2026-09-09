import { FormEvent, MouseEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  Bars3Icon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import Brand from "../components/Brand";
import PublicSupportWidget from "../components/PublicSupportWidget";
import officeImage from "../assets/telos-office.jpg";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
};

function Reveal({ children, className = "" }: RevealProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transition-all duration-700 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const productLinks = [
  {
    label: "Checking",
    href: "#everyday",
    icon: BuildingLibraryIcon,
  },
  {
    label: "Savings",
    href: "#savings",
    icon: CurrencyDollarIcon,
  },
  {
    label: "Cards",
    href: "#cards",
    icon: CreditCardIcon,
  },
  {
    label: "Loans",
    href: "#loans",
    icon: CurrencyDollarIcon,
  },
  {
    label: "Digital banking",
    href: "#digital",
    icon: DevicePhoneMobileIcon,
  },
];

const accountBenefits = [
  "No monthly maintenance fees",
  "Simple transfers between your accounts",
  "Secure access wherever you are",
  "Clear transaction history and balances",
];

const securityBenefits = [
  {
    title: "Secure account access",
    description:
      "Modern safeguards help protect your account whenever you sign in or manage your money.",
  },
  {
    title: "Transaction visibility",
    description:
      "Stay informed with a clear view of your account activity and recent transactions.",
  },
  {
    title: "Support when you need it",
    description:
      "Get help through Telosbank support without losing track of what you were doing.",
  },
];

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!signupOpen) {
      setSubmitted(false);
    }
  }, [signupOpen]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSignupOpen(false);
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  const closeMobileMenu = () => setMobileOpen(false);

  const handleSmoothScroll = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      event.preventDefault();
      const targetId = href.slice(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      {/* =========================================================
          UTILITY BAR
      ========================================================== */}
      <div className="hidden border-b border-slate-200 bg-slate-50 lg:block">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-2 text-[13px] text-slate-600 xl:px-12">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-blue-800">Personal</span>
            <a
              href="#about"
              onClick={(e) => handleSmoothScroll(e, "#about")}
              className="transition-colors hover:text-blue-800"
            >
              About us
            </a>
            <a
              href="#contact"
              onClick={(e) => handleSmoothScroll(e, "#contact")}
              className="transition-colors hover:text-blue-800"
            >
              Help &amp; support
            </a>
            <a
              href="#security"
              onClick={(e) => handleSmoothScroll(e, "#security")}
              className="transition-colors hover:text-blue-800"
            >
              Security
            </a>
          </div>

          <div className="flex items-center gap-2">
            <GlobeAltIcon className="h-4 w-4" />
            <span>Banking made simple</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================== */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 xl:px-12">
          <a
            href="#top"
            onClick={(e) => handleSmoothScroll(e, "#top")}
            aria-label="Telosbank home"
            className="flex shrink-0 items-center"
          >
            <Brand />
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            <a
              href="#everyday"
              onClick={(e) => handleSmoothScroll(e, "#everyday")}
              className="px-4 py-6 text-sm font-semibold text-slate-700 transition hover:text-blue-800"
            >
              Everyday Banking
            </a>

            <a
              href="#cards"
              onClick={(e) => handleSmoothScroll(e, "#cards")}
              className="px-4 py-6 text-sm font-semibold text-slate-700 transition hover:text-blue-800"
            >
              Cards
            </a>

            <a
              href="#loans"
              onClick={(e) => handleSmoothScroll(e, "#loans")}
              className="px-4 py-6 text-sm font-semibold text-slate-700 transition hover:text-blue-800"
            >
              Loans
            </a>

            <a
              href="#digital"
              onClick={(e) => handleSmoothScroll(e, "#digital")}
              className="px-4 py-6 text-sm font-semibold text-slate-700 transition hover:text-blue-800"
            >
              Digital Banking
            </a>

            <a
              href="#about"
              onClick={(e) => handleSmoothScroll(e, "#about")}
              className="px-4 py-6 text-sm font-semibold text-slate-700 transition hover:text-blue-800"
            >
              Why Telosbank
            </a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center border border-blue-800 px-5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
            >
              Sign in
            </Link>

            <button
              type="button"
              onClick={() => setSignupOpen(true)}
              className="inline-flex h-10 items-center justify-center bg-blue-800 px-5 text-sm font-semibold text-white transition hover:bg-blue-900"
            >
              Open an account
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center text-slate-800 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-200 bg-white lg:hidden">
            <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-8">
              <nav className="grid">
                {[
                  ["Everyday Banking", "#everyday"],
                  ["Cards", "#cards"],
                  ["Loans", "#loans"],
                  ["Digital Banking", "#digital"],
                  ["Why Telosbank", "#about"],
                  ["Help & Support", "#contact"],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={(e) => {
                      closeMobileMenu();
                      handleSmoothScroll(e, href);
                    }}
                    className="border-b border-slate-100 py-4 text-sm font-semibold text-slate-800"
                  >
                    {label}
                  </a>
                ))}
              </nav>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="inline-flex h-11 items-center justify-center border border-blue-800 px-4 text-sm font-semibold text-blue-800"
                >
                  Sign in
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    setSignupOpen(true);
                  }}
                  className="inline-flex h-11 items-center justify-center bg-blue-800 px-4 text-sm font-semibold text-white"
                >
                  Open account
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        {/* =======================================================
            HERO
        ======================================================== */}
        <section className="overflow-hidden bg-[#f4f7fb]">
          <div className="mx-auto grid max-w-[1440px] lg:min-h-[620px] lg:grid-cols-[1.02fr_.98fr]">
            <div className="flex items-center px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:px-20">
              <Reveal className="max-w-2xl">
                <p className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-blue-800">
                  Banking for the way you live
                </p>

                <h1 className="max-w-[720px] text-[44px] font-semibold leading-[1.03] tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[64px]">
                  Your money should help you move forward.
                </h1>

                <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
                  Save, spend, transfer and manage your everyday finances
                  through a banking experience built to keep things clear,
                  accessible and secure.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setSignupOpen(true)}
                    className="inline-flex min-h-12 items-center justify-center gap-2 bg-blue-800 px-7 text-sm font-bold text-white transition hover:bg-blue-900"
                  >
                    Open an account
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>

                  <a
                    href="#everyday"
                    onClick={(e) => handleSmoothScroll(e, "#everyday")}
                    className="inline-flex min-h-12 items-center justify-center gap-2 border border-slate-400 bg-white px-7 text-sm font-bold text-slate-900 transition hover:border-slate-900"
                  >
                    Explore banking
                    <ChevronRightIcon className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-300 pt-6 text-sm text-slate-600">
                  <span className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-blue-800" />
                    Simple account access
                  </span>

                  <span className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-blue-800" />
                    Secure digital banking
                  </span>
                </div>
              </Reveal>
            </div>

            <div className="relative min-h-[450px] lg:min-h-full">
              <img
                src={officeImage}
                alt="Telosbank banking experience"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />

              {/* Banking UI card */}
              <div className="absolute bottom-6 left-5 right-5 bg-white p-6 shadow-2xl sm:bottom-10 sm:left-10 sm:right-auto sm:w-[390px] lg:bottom-12 lg:left-12">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                      Telosbank
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      Everyday account
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center bg-blue-50">
                    <BuildingLibraryIcon className="h-5 w-5 text-blue-800" />
                  </div>
                </div>

                <div className="mt-7">
                  <p className="text-sm text-slate-500">Available balance</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                    $8,420.50
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 border-t border-slate-200 pt-5 text-center">
                  <div>
                    <p className="text-xs text-slate-500">Transfer</p>
                  </div>
                  <div className="border-x border-slate-200">
                    <p className="text-xs text-slate-500">Pay</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">History</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            QUICK PRODUCT NAVIGATION
        ======================================================== */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-5">
              {productLinks.map(({ label, href, icon: Icon }, index) => (
                <a
                  key={label}
                  href={href}
                  onClick={(e) => handleSmoothScroll(e, href)}
                  className={`group flex min-h-[118px] items-center justify-between gap-4 px-4 py-6 transition hover:bg-slate-50 md:px-6 ${
                    index !== productLinks.length - 1
                      ? "md:border-r md:border-slate-200"
                      : ""
                  }`}
                >
                  <div>
                    <Icon className="mb-3 h-6 w-6 text-blue-800" />
                    <span className="text-sm font-bold text-slate-900">
                      {label}
                    </span>
                  </div>

                  <ChevronRightIcon className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-800" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* =======================================================
            EVERYDAY BANKING
        ======================================================== */}
        <section
          id="everyday"
          className="scroll-mt-28 bg-white px-5 py-20 sm:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-[1240px]">
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-blue-800">
                  Everyday banking
                </p>

                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
                  The essentials, without the unnecessary complexity.
                </h2>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  A straightforward place for your everyday money, with the
                  tools you need to stay on top of spending and move funds when
                  you need to.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid border-y border-slate-200 lg:grid-cols-3">
              <article className="py-9 lg:pr-10">
                <span className="text-sm font-bold text-blue-800">01</span>

                <h3 className="mt-5 text-2xl font-semibold text-slate-950">
                  Everyday Account
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  Make deposits, payments and transfers while keeping your
                  everyday finances organized in one place.
                </p>

                <a
                  href="#digital"
                  onClick={(e) => handleSmoothScroll(e, "#digital")}
                  className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-blue-800"
                >
                  Explore the account
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
              </article>

              <article className="border-t border-slate-200 py-9 lg:border-l lg:border-t-0 lg:px-10">
                <span className="text-sm font-bold text-blue-800">02</span>

                <h3 className="mt-5 text-2xl font-semibold text-slate-950">
                  Savings
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  Separate the money you want to keep from the money you use
                  every day and build toward your next goal.
                </p>

                <a
                  href="#savings"
                  onClick={(e) => handleSmoothScroll(e, "#savings")}
                  className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-blue-800"
                >
                  Start saving
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
              </article>

              <article className="border-t border-slate-200 py-9 lg:border-l lg:border-t-0 lg:pl-10">
                <span className="text-sm font-bold text-blue-800">03</span>

                <h3 className="mt-5 text-2xl font-semibold text-slate-950">
                  Money transfers
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  Move money with an experience designed to make your balances
                  and recent activity easy to understand.
                </p>

                <Link
                  to="/login"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-blue-800"
                >
                  Sign in to transfer
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* =======================================================
            SAVINGS / FEATURED ACCOUNT
        ======================================================== */}
        <section
          id="savings"
          className="scroll-mt-28 bg-[#eef4fa] px-5 py-20 sm:px-8 lg:py-28"
        >
          <div className="mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <div className="max-w-xl">
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-blue-800">
                  Save with purpose
                </p>

                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
                  Give tomorrow&apos;s money a place of its own.
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-600">
                  Build a savings habit without losing sight of your everyday
                  finances. Keep your goals separate while managing everything
                  through Telosbank.
                </p>

                <ul className="mt-8 space-y-4">
                  {accountBenefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-3 text-slate-700"
                    >
                      <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-800" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => setSignupOpen(true)}
                  className="mt-9 inline-flex items-center gap-2 bg-blue-800 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-900"
                >
                  Open an account
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </Reveal>

            <Reveal>
              <div className="bg-white shadow-[0_25px_80px_rgba(15,23,42,0.12)]">
                <div className="border-b border-slate-200 px-7 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        My accounts
                      </p>
                      <p className="mt-1 font-semibold text-slate-950">
                        Good evening
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center bg-blue-800 text-sm font-bold text-white">
                      T
                    </div>
                  </div>
                </div>

                <div className="p-7">
                  <div className="border border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Everyday Account
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          •••• 4821
                        </p>
                      </div>

                      <span className="bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    </div>

                    <div className="mt-8">
                      <p className="text-sm text-slate-500">Current balance</p>
                      <p className="mt-1 text-3xl font-semibold text-slate-950">
                        $8,420.50
                      </p>
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-950">
                        Recent activity
                      </h3>

                      <span className="text-xs font-semibold text-blue-800">
                        View all
                      </span>
                    </div>

                    <div className="mt-4 divide-y divide-slate-100">
                      {[
                        ["Transfer received", "Today", "+ $1,250.00"],
                        ["Online purchase", "Yesterday", "- $184.50"],
                        ["Mobile transfer", "Sep 04", "- $320.00"],
                      ].map(([title, date, amount]) => (
                        <div
                          key={`${title}-${date}`}
                          className="flex items-center justify-between py-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center bg-slate-100">
                              <CurrencyDollarIcon className="h-4 w-4 text-slate-700" />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {title}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {date}
                              </p>
                            </div>
                          </div>

                          <span className="text-sm font-semibold text-slate-800">
                            {amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* =======================================================
            CARDS
        ======================================================== */}
        <section
          id="cards"
          className="scroll-mt-28 bg-white px-5 py-20 sm:px-8 lg:py-28"
        >
          <div className="mx-auto grid max-w-[1240px] gap-14 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:gap-24">
            <Reveal>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-blue-800">
                  Telosbank cards
                </p>

                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
                  One card. Everyday control.
                </h2>

                <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                  Pay for the things that matter while keeping your account
                  activity close at hand through Telosbank digital banking.
                </p>

                <div className="mt-9 grid gap-6 sm:grid-cols-2">
                  <div className="border-t-2 border-blue-800 pt-5">
                    <p className="font-semibold text-slate-950">
                      Connected to your account
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      See card spending alongside the rest of your account
                      activity.
                    </p>
                  </div>

                  <div className="border-t-2 border-blue-800 pt-5">
                    <p className="font-semibold text-slate-950">
                      Built for daily use
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      A straightforward way to access your everyday funds.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSignupOpen(true)}
                  className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-blue-800"
                >
                  Get started
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </Reveal>

            <Reveal>
              <div className="relative flex min-h-[460px] items-center justify-center overflow-hidden bg-slate-950 px-6 py-16 sm:px-12">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10" />
                <div className="absolute -bottom-32 -left-28 h-80 w-80 rounded-full border border-white/10" />

                <div className="relative aspect-[1.58/1] w-full max-w-[510px] overflow-hidden rounded-[22px] border border-white/20 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 p-7 text-white shadow-2xl sm:p-9">
                  <div className="flex items-start justify-between">
                    <div className="text-xl font-bold tracking-tight">
                      telosbank
                    </div>
                    <CreditCardIcon className="h-8 w-8 text-white/85" />
                  </div>

                  <div className="mt-16 sm:mt-20">
                    <div className="h-8 w-11 rounded-md bg-amber-200/90" />

                    <p className="mt-7 text-lg tracking-[0.2em] text-white/90 sm:text-xl">
                      •••• •••• •••• 4821
                    </p>
                  </div>

                  <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between sm:bottom-9 sm:left-9 sm:right-9">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">
                        Cardholder
                      </p>
                      <p className="mt-1 text-sm font-semibold">TELOSBANK</p>
                    </div>

                    <span className="text-lg font-bold italic">VISA</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* =======================================================
            LOANS
        ======================================================== */}
        <section
          id="loans"
          className="scroll-mt-28 border-y border-slate-200 bg-slate-50 px-5 py-20 sm:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-[1240px]">
            <Reveal>
              <div className="grid gap-10 lg:grid-cols-[.82fr_1.18fr] lg:gap-20">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.17em] text-blue-800">
                    Borrowing
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
                    Support for the plans that need more room.
                  </h2>
                </div>

                <div className="lg:pt-8">
                  <p className="max-w-2xl text-lg leading-8 text-slate-600">
                    When your next step requires more than what is sitting in
                    your account today, Telosbank lending options can help you
                    understand a clearer path forward.
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="mt-14 grid border border-slate-200 bg-white md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Personal loans",
                  text: "Flexible borrowing for planned expenses and important personal needs.",
                },
                {
                  number: "02",
                  title: "Simple repayment",
                  text: "Keep the details clear so you can understand what you owe and when.",
                },
                {
                  number: "03",
                  title: "Digital access",
                  text: "See your finances in the same secure Telosbank experience you already use.",
                },
              ].map((item, index) => (
                <article
                  key={item.title}
                  className={`p-8 sm:p-10 ${
                    index !== 2 ? "border-b border-slate-200 md:border-b-0 md:border-r" : ""
                  }`}
                >
                  <span className="text-xs font-bold tracking-[0.15em] text-blue-800">
                    {item.number}
                  </span>

                  <h3 className="mt-7 text-2xl font-semibold text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-4 leading-7 text-slate-600">{item.text}</p>

                  <a
                    href="#contact"
                    onClick={(e) => handleSmoothScroll(e, "#contact")}
                    className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-blue-800"
                  >
                    Learn more
                    <ChevronRightIcon className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =======================================================
            DIGITAL BANKING
        ======================================================== */}
        <section
          id="digital"
          className="scroll-mt-28 bg-white px-5 py-20 sm:px-8 lg:py-28"
        >
          <div className="mx-auto grid max-w-[1240px] items-center gap-16 lg:grid-cols-2 lg:gap-24">
            <Reveal>
              <div className="relative mx-auto max-w-[540px] bg-[#eaf1f8] p-7 sm:p-12">
                <div className="mx-auto max-w-[390px] overflow-hidden bg-white shadow-[0_24px_70px_rgba(15,23,42,0.15)]">
                  <div className="bg-blue-800 p-7 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-100">Total balance</p>
                        <p className="mt-1 text-3xl font-semibold">
                          $12,765.20
                        </p>
                      </div>

                      <ShieldCheckIcon className="h-7 w-7" />
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-sm font-semibold text-slate-900">
                      Quick actions
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {["Send", "Pay", "Save"].map((label) => (
                        <div
                          key={label}
                          className="border border-slate-200 px-3 py-4 text-center text-xs font-semibold text-slate-700"
                        >
                          {label}
                        </div>
                      ))}
                    </div>

                    <div className="mt-7">
                      <p className="text-sm font-semibold text-slate-900">
                        Your accounts
                      </p>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between border border-slate-200 p-4">
                          <div>
                            <p className="text-sm font-semibold">
                              Everyday Account
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              •••• 4821
                            </p>
                          </div>

                          <p className="text-sm font-bold">$8,420.50</p>
                        </div>

                        <div className="flex items-center justify-between border border-slate-200 p-4">
                          <div>
                            <p className="text-sm font-semibold">Savings</p>
                            <p className="mt-1 text-xs text-slate-500">
                              •••• 1964
                            </p>
                          </div>

                          <p className="text-sm font-bold">$4,344.70</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="max-w-xl">
                <p className="text-sm font-bold uppercase tracking-[0.17em] text-blue-800">
                  Digital banking
                </p>

                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
                  Your bank should be useful before you ever visit a branch.
                </h2>

                <p className="mt-6 text-lg leading-8 text-slate-600">
                  Telosbank brings balances, transactions and everyday money
                  management together so you can take care of routine banking
                  from wherever you are.
                </p>

                <div className="mt-9 space-y-6">
                  {[
                    [
                      "See what you have",
                      "View account balances in a simple, focused dashboard.",
                    ],
                    [
                      "Know where it went",
                      "Review your transaction activity without unnecessary clutter.",
                    ],
                    [
                      "Move money",
                      "Access the everyday actions you use most from one place.",
                    ],
                  ].map(([title, text]) => (
                    <div key={title} className="flex gap-4">
                      <CheckCircleIcon className="mt-1 h-5 w-5 shrink-0 text-blue-800" />

                      <div>
                        <p className="font-semibold text-slate-950">{title}</p>
                        <p className="mt-1 leading-7 text-slate-600">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  to="/login"
                  className="mt-9 inline-flex items-center gap-2 bg-blue-800 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-900"
                >
                  Sign in to Telosbank
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* =======================================================
            SECURITY
        ======================================================== */}
        <section
          id="security"
          className="scroll-mt-28 bg-[#10263f] px-5 py-20 text-white sm:px-8 lg:py-24"
        >
          <div className="mx-auto max-w-[1240px]">
            <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
              <Reveal>
                <div>
                  <ShieldCheckIcon className="h-10 w-10 text-blue-300" />

                  <p className="mt-7 text-sm font-bold uppercase tracking-[0.17em] text-blue-200">
                    Security
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                    Protecting your access matters.
                  </h2>

                  <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                    Banking should feel convenient without treating security as
                    an afterthought.
                  </p>
                </div>
              </Reveal>

              <div className="grid md:grid-cols-3">
                {securityBenefits.map((item, index) => (
                  <article
                    key={item.title}
                    className={`border-t border-white/20 py-7 md:border-t-0 md:px-7 md:py-2 ${
                      index !== securityBenefits.length - 1
                        ? "md:border-r md:border-white/20"
                        : ""
                    }`}
                  >
                    <LockClosedIcon className="h-6 w-6 text-blue-300" />

                    <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>

                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            ABOUT / BRAND STORY
        ======================================================== */}
        <section
          id="about"
          className="scroll-mt-28 bg-white px-5 py-20 sm:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-[1240px]">
            <Reveal>
              <div className="mx-auto max-w-4xl text-center">
                <SparklesIcon className="mx-auto h-8 w-8 text-blue-800" />

                <p className="mt-6 text-sm font-bold uppercase tracking-[0.17em] text-blue-800">
                  Why Telosbank
                </p>

                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
                  Banking designed around clarity.
                </h2>

                <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                  We believe the experience of managing money should be easier
                  to understand. Telosbank brings everyday banking into a
                  focused digital experience so customers can spend less time
                  figuring out their bank and more time using it.
                </p>
              </div>
            </Reveal>

            <div className="mt-16 grid border-y border-slate-200 md:grid-cols-3">
              {[
                [
                  "01",
                  "Clear",
                  "Important information is presented in a way that is easier to understand.",
                ],
                [
                  "02",
                  "Accessible",
                  "Your everyday banking tools remain available through a modern digital experience.",
                ],
                [
                  "03",
                  "Focused",
                  "The products and actions you need come first, without unnecessary distraction.",
                ],
              ].map(([number, title, description], index) => (
                <div
                  key={title}
                  className={`py-9 md:px-10 ${
                    index !== 2
                      ? "border-b border-slate-200 md:border-b-0 md:border-r"
                      : ""
                  }`}
                >
                  <span className="text-xs font-bold tracking-[0.16em] text-blue-800">
                    {number}
                  </span>

                  <h3 className="mt-5 text-2xl font-semibold text-slate-950">
                    {title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =======================================================
            CTA
        ======================================================== */}
        <section className="bg-blue-800 px-5 py-16 text-white sm:px-8 lg:py-20">
          <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold text-blue-100">
                Ready to get started?
              </p>

              <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
                Make Telosbank part of your everyday finances.
              </h2>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setSignupOpen(true)}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-7 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
              >
                Open an account
                <ArrowRightIcon className="h-4 w-4" />
              </button>

              <Link
                to="/login"
                className="inline-flex min-h-12 items-center justify-center border border-white/60 px-7 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* =======================================================
            CONTACT
        ======================================================== */}
        <section
          id="contact"
          className="scroll-mt-28 border-b border-slate-200 bg-slate-50 px-5 py-14 sm:px-8"
        >
          <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Need help?
              </h2>
              <p className="mt-2 text-slate-600">
                Telosbank support is here when you have questions about your
                banking experience.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-sm font-semibold text-blue-800">
              <a
                href="#contact"
                onClick={(e) => handleSmoothScroll(e, "#contact")}
                className="inline-flex items-center gap-2"
              >
                Help &amp; support
                <ChevronRightIcon className="h-4 w-4" />
              </a>

              <a
                href="#security"
                onClick={(e) => handleSmoothScroll(e, "#security")}
                className="inline-flex items-center gap-2"
              >
                Security
                <ChevronRightIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================== */}
      <footer className="bg-white px-5 pt-16 text-slate-700 sm:px-8">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-12 border-b border-slate-200 pb-14 sm:grid-cols-2 lg:grid-cols-5">
            <div className="sm:col-span-2 lg:col-span-1">
              <Brand />

              <p className="mt-5 max-w-xs text-sm leading-6 text-slate-500">
                Clear, accessible everyday banking built around the way you
                manage money.
              </p>
            </div>

            <FooterColumn
              title="Banking"
              onLinkClick={handleSmoothScroll}
              links={[
                ["Everyday Banking", "#everyday"],
                ["Savings", "#savings"],
                ["Cards", "#cards"],
                ["Loans", "#loans"],
              ]}
            />

            <FooterColumn
              title="Digital banking"
              onLinkClick={handleSmoothScroll}
              links={[
                ["Online banking", "#digital"],
                ["Sign in", "/login"],
                ["Security", "#security"],
              ]}
            />

            <FooterColumn
              title="Telosbank"
              onLinkClick={handleSmoothScroll}
              links={[
                ["About us", "#about"],
                ["Why Telosbank", "#about"],
                ["Help & support", "#contact"],
              ]}
            />

            <FooterColumn
              title="Resources"
              onLinkClick={handleSmoothScroll}
              links={[
                ["Contact", "#contact"],
                ["Security", "#security"],
                ["Open an account", "#open-account"],
              ]}
              onOpenAccount={() => setSignupOpen(true)}
            />
          </div>

          <div className="flex flex-col justify-between gap-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} Telosbank. All rights reserved.
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Security</span>
            </div>
          </div>

          <div className="border-t border-slate-200 py-7 text-xs leading-6 text-slate-400">
            <p>
              Telosbank services and product availability may vary. Information
              shown on this page is for general informational purposes.
            </p>
          </div>
        </div>
      </footer>

      <PublicSupportWidget />

      {/* =========================================================
          SIGN-UP MODAL
      ========================================================== */}
      {signupOpen && (
        <div
          id="open-account"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSignupOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-title"
            className="max-h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sm:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">
                  Telosbank
                </p>
                <h2
                  id="signup-title"
                  className="mt-1 text-2xl font-semibold text-slate-950"
                >
                  Open an account
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSignupOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="px-6 py-12 text-center sm:px-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center bg-green-50">
                  <CheckCircleIcon className="h-7 w-7 text-green-700" />
                </div>

                <h3 className="mt-6 text-2xl font-semibold text-slate-950">
                  Thanks for getting started.
                </h3>

                <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-600">
                  Your account-opening information has been received. Please visit your nearest branch with a valid ID and proof of address to complete your registration.
                </p>

                <button
                  type="button"
                  onClick={() => setSignupOpen(false)}
                  className="mt-7 bg-blue-800 px-6 py-3 text-sm font-bold text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="px-6 py-7 sm:px-8">
                <p className="mb-6 text-sm leading-6 text-slate-600">
                  Enter your details to begin opening your Telosbank account. Please note that you will need to visit your nearest branch to complete registration.
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800">
                      First name
                    </span>
                    <input
                      type="text"
                      required
                      autoComplete="given-name"
                      className="mt-2 h-12 w-full border border-slate-300 px-3 outline-none transition focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-800">
                      Last name
                    </span>
                    <input
                      type="text"
                      required
                      autoComplete="family-name"
                      className="mt-2 h-12 w-full border border-slate-300 px-3 outline-none transition focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                    />
                  </label>
                </div>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-slate-800">
                    Email address
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="mt-2 h-12 w-full border border-slate-300 px-3 outline-none transition focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-slate-800">
                    Phone number
                  </span>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    className="mt-2 h-12 w-full border border-slate-300 px-3 outline-none transition focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                  />
                </label>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-slate-800">
                    Account type
                  </span>

                  <select
                    required
                    defaultValue=""
                    className="mt-2 h-12 w-full border border-slate-300 bg-white px-3 outline-none transition focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
                  >
                    <option value="" disabled>
                      Select an account
                    </option>
                    <option value="everyday">Everyday Account</option>
                    <option value="savings">Savings Account</option>
                  </select>
                </label>

                <button
                  type="submit"
                  className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 bg-blue-800 px-6 text-sm font-bold text-white transition hover:bg-blue-900"
                >
                  Continue
                  <ArrowRightIcon className="h-4 w-4" />
                </button>

                <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-800 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type FooterColumnProps = {
  title: string;
  links: [string, string][];
  onOpenAccount?: () => void;
  onLinkClick?: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
};

function FooterColumn({
  title,
  links,
  onOpenAccount,
  onLinkClick,
}: FooterColumnProps) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>

      <ul className="mt-5 space-y-3">
        {links.map(([label, href]) => (
          <li key={`${title}-${label}`}>
            {href === "/login" ? (
              <Link
                to={href}
                className="text-sm text-slate-600 transition hover:text-blue-800"
              >
                {label}
              </Link>
            ) : href === "#open-account" && onOpenAccount ? (
              <button
                type="button"
                onClick={onOpenAccount}
                className="text-left text-sm text-slate-600 transition hover:text-blue-800"
              >
                {label}
              </button>
            ) : (
              <a
                href={href}
                onClick={(e) => onLinkClick && onLinkClick(e, href)}
                className="text-sm text-slate-600 transition hover:text-blue-800"
              >
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}