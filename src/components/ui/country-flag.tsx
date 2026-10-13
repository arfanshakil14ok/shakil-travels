import React from 'react';

export interface CountryFlagProps {
  flag?: string | null;
  name?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  flag,
  name,
  className = '',
  size = 'md',
}) => {
  if (!flag) {
    return <span className="text-slate-400 text-sm">🌐</span>;
  }

  const isUrl = flag.startsWith('http://') || flag.startsWith('https://') || flag.startsWith('/');

  const sizeClasses = {
    sm: 'w-4 h-3',
    md: 'w-5 h-3.5',
    lg: 'w-7 h-5',
  };

  if (isUrl) {
    return (
      <img
        src={flag}
        alt={name ? `${name} flag` : 'Country flag'}
        className={`${sizeClasses[size]} object-cover rounded shadow-2xs inline-block flex-shrink-0 align-middle ${className}`}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  return <span className={`inline-block leading-none select-none text-base align-middle ${className}`}>{flag}</span>;
};
