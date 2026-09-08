'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Building2, Sliders, Save, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';

export default function AdminSettingsPage() {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch settings');
      }
      setSettings(data.data.settings || {});
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }

      success('System settings updated and recorded in audit log.');
    } catch (err: any) {
      error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    {
      id: 'company',
      label: 'Company Profile',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'system',
      label: 'System & Identifiers',
      icon: <Sliders className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-navy-700 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
              Database-Driven Configuration
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure enterprise agency metadata, financial defaults, and automated ID prefixes.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            Reload
          </Button>
          <Button
            type="submit"
            form="settings-form"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" aria-hidden="true" />}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <form id="settings-form" onSubmit={handleSave}>
        {/* Company Profile Tab */}
        {activeTab === 'company' && (
          <Card>
            <CardHeader>
              <CardTitle>Company & Recruitment Agency Profile</CardTitle>
              <CardDescription>
                Official branding, office address, and contact lines displayed on candidate receipts and public pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Input
                label="Company Legal Name"
                required
                value={settings['company.name'] || ''}
                onChange={(e) => handleChange('company.name', e.target.value)}
                placeholder="SHAKIL GLOBAL RECRUITMENT"
              />

              <Input
                label="Registered Physical Address"
                required
                value={settings['company.address'] || ''}
                onChange={(e) => handleChange('company.address', e.target.value)}
                placeholder="House 12, Road 4, Sector 7, Uttara, Dhaka-1230, Bangladesh"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Telephone / Hotline"
                  required
                  value={settings['company.phone'] || ''}
                  onChange={(e) => handleChange('company.phone', e.target.value)}
                  placeholder="+880 2 9876543 / +880 1711-000000"
                />
                <Input
                  label="Official Email Address"
                  type="email"
                  required
                  value={settings['company.email'] || ''}
                  onChange={(e) => handleChange('company.email', e.target.value)}
                  placeholder="info@shakilglobal.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Website URL"
                  value={settings['company.website'] || ''}
                  onChange={(e) => handleChange('company.website', e.target.value)}
                  placeholder="https://shakilglobal.com"
                />
                <Input
                  label="Brand Logo Asset Path"
                  value={settings['company.logo'] || ''}
                  onChange={(e) => handleChange('company.logo', e.target.value)}
                  placeholder="/images/logo.png"
                />
              </div>

              <Input
                label="Business Hours"
                value={settings['company.business_hours'] || ''}
                onChange={(e) => handleChange('company.business_hours', e.target.value)}
                placeholder="Sat - Thu: 9:00 AM - 6:00 PM (Friday Closed)"
              />
            </CardContent>
          </Card>
        )}

        {/* System Configuration Tab */}
        {activeTab === 'system' && (
          <Card>
            <CardHeader>
              <CardTitle>System & Identifier Defaults</CardTitle>
              <CardDescription>
                Control default currency symbol, regional timezone, and automated sequence prefixes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Default Currency"
                  value={settings['system.currency'] || 'BDT'}
                  onChange={(e) => handleChange('system.currency', e.target.value)}
                >
                  <option value="BDT">BDT (৳ - Bangladeshi Taka)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="SAR">SAR (﷼ - Saudi Riyal)</option>
                  <option value="AED">AED (د.إ - UAE Dirham)</option>
                </Select>

                <Select
                  label="System Timezone"
                  value={settings['system.timezone'] || 'Asia/Dhaka'}
                  onChange={(e) => handleChange('system.timezone', e.target.value)}
                >
                  <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                  <option value="UTC">UTC (GMT+0)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                </Select>

                <Select
                  label="Date Format"
                  value={settings['system.date_format'] || 'DD/MM/YYYY'}
                  onChange={(e) => handleChange('system.date_format', e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </Select>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">
                  Formatted Business ID Prefixes
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  IDs automatically generate as{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-navy-900 font-bold">
                    [PREFIX]-[YEAR]-[SEQUENCE]
                  </code>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Applicant Prefix"
                    required
                    value={settings['system.prefix_applicant'] || 'SGR'}
                    onChange={(e) => handleChange('system.prefix_applicant', e.target.value)}
                    helperText="e.g. SGR-2026-000001"
                  />

                  <Input
                    label="Application Prefix"
                    required
                    value={settings['system.prefix_application'] || 'SGR-APP'}
                    onChange={(e) => handleChange('system.prefix_application', e.target.value)}
                    helperText="e.g. SGR-APP-2026-000001"
                  />

                  <Input
                    label="Invoice Prefix"
                    required
                    value={settings['system.prefix_invoice'] || 'SGR-INV'}
                    onChange={(e) => handleChange('system.prefix_invoice', e.target.value)}
                    helperText="e.g. SGR-INV-2026-000001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
