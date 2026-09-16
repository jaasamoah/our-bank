import React from 'react';

type BrandProps = {
  className?: string;
  light?: boolean;
  showMark?: boolean;
};

const Brand: React.FC<BrandProps> = ({ className = '', light = false, showMark = true }) => (
  <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
    {showMark && (
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-800 via-brand-900 to-slate-950 p-1.5 shadow-md ring-1 ring-white/10">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-full w-full text-white"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Outer vault shield / faceted diamond */}
          <polygon
            points="12 2 21 7 21 17 12 22 3 17 3 7"
            className={light ? 'stroke-white/80' : 'stroke-blue-200/90'}
            strokeWidth="1.8"
          />
          {/* Inner core chevron / V-lock */}
          <path
            d="M7.5 9.5L12 14.5L16.5 9.5"
            className="stroke-amber-300"
            strokeWidth="2.2"
          />
        </svg>
      </div>
    )}

    <span
      className={`font-extrabold tracking-[-0.035em] ${
        light ? 'text-white' : 'text-slate-950'
      }`}
    >
      Velmont
      <span className={light ? 'text-blue-300 font-bold' : 'text-brand-700 font-bold'}>
        Private
      </span>{' '}
      <span className={`text-[0.72em] font-medium tracking-wider uppercase ${
        light ? 'text-slate-300' : 'text-slate-500'
      }`}>
        Bank
      </span>
    </span>
  </div>
);

export default Brand;