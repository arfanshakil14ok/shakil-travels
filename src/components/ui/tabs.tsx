'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  onValueChange?: (id: string) => void;
  defaultValue?: string;
  value?: string;
  className?: string;
  children?: React.ReactNode;
}

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (val: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onValueChange,
  defaultValue,
  value,
  className,
  children,
}) => {
  const [internalTab, setInternalTab] = useState(defaultValue || (tabs && tabs[0]?.id) || '');
  const currentTab = value !== undefined ? value : activeTab !== undefined ? activeTab : internalTab;

  const handleTabChange = (id: string) => {
    setInternalTab(id);
    if (onTabChange) onTabChange(id);
    if (onValueChange) onValueChange(id);
  };

  // If children provided, render compound component pattern
  if (children) {
    return (
      <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: handleTabChange }}>
        <div className={className}>{children}</div>
      </TabsContext.Provider>
    );
  }

  // Otherwise render array-based tabs
  return (
    <div className={cn('border-b border-slate-200', className)}>
      <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
        {tabs?.map((tab) => {
          const isActive = tab.id === currentTab;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'group inline-flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors select-none',
                isActive
                  ? 'border-navy-900 text-navy-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon && (
                <span className={cn('w-4 h-4', isActive ? 'text-navy-900' : 'text-slate-400 group-hover:text-slate-600')}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'ml-1 px-2 py-0.5 text-xs font-semibold rounded-full',
                    isActive ? 'bg-navy-100 text-navy-900' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1', className)}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className }) => {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.activeTab === value;

  return (
    <button
      type="button"
      onClick={() => ctx?.setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none',
        isActive
          ? 'bg-white text-slate-900 shadow-sm font-semibold'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50',
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ value, children, className }) => {
  const ctx = useContext(TabsContext);
  if (ctx?.activeTab !== value) return null;

  return <div className={cn('mt-2 ring-offset-background focus-visible:outline-none', className)}>{children}</div>;
};
