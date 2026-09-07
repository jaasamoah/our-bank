import React from 'react';

type BrandProps = {
  className?: string;
  light?: boolean;
};

const Brand: React.FC<BrandProps> = ({ className = '', light = false }) => (
  <span
    className={`font-semibold tracking-[-0.06em] ${light ? 'text-white' : 'text-slate-900'} ${className}`}
  >
    telos
  </span>
);

export default Brand;