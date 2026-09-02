import React from 'react';

const LoadingSpinner: React.FC<{ label?: string; size?: 'sm' | 'md'; tone?: 'default' | 'light' }> = ({
  label = 'Loading',
  size = 'md',
  tone = 'default',
}) => (
  <div className={`flex items-center justify-center gap-3 text-sm ${tone === 'light' ? 'text-white' : 'text-slate-500'}`} role="status" aria-live="polite">
    <span
      className={`inline-block animate-spin rounded-full border-2 ${
        tone === 'light' ? 'border-white/40 border-t-white' : 'border-brand-100 border-t-brand-700'
      } ${
        size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
      }`}
      aria-hidden="true"
    />
    <span>{label}</span>
  </div>
);

export default LoadingSpinner;