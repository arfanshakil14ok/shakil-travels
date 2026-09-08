'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BriefcaseBusiness,
  Plus,
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('RECRUITMENT');
  const [defaultAmount, setDefaultAmount] = useState('25000');
  const [currency, setCurrency] = useState('BDT');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name || !defaultAmount) return;

    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          name,
          category,
          defaultAmount: Number(defaultAmount),
          currency,
          description: description || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setCode('');
        setName('');
        setDescription('');
        fetchServices();
      } else {
        setError(data.error || 'Failed to create service');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/accounts" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-medium mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Accounts Overview
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BriefcaseBusiness className="w-7 h-7 text-primary-600" />
            Service Fee Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardized recruitment fees, embassy charges, medical coordination, and processing costs.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Service
        </Button>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Code</th>
              <th className="py-3.5 px-4">Service Name</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Default Fee</th>
              <th className="py-3.5 px-4">Description</th>
              <th className="py-3.5 px-4">Invoiced Count</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Loading service catalog...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No services configured in catalog yet.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary-700">{s.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{s.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{s.category}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">
                    {s.currency} {Number(s.defaultAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{s.description || '—'}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{s._count?.invoiceItems || 0} times</td>
                  <td className="py-3.5 px-4">
                    {s.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="neutral">Inactive</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Service to Catalog"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Service Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. VISA-002 or BMET-001"
              className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Service Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BMET Smart Card Clearance & Fingerprint"
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
              >
                <option value="RECRUITMENT">Recruitment Placement</option>
                <option value="VISA">Visa Processing</option>
                <option value="MEDICAL">Medical Coordination</option>
                <option value="DOCUMENT">Document Attestation</option>
                <option value="TICKET">Flight Ticketing</option>
                <option value="TRAINING">Training / Orientation</option>
                <option value="OTHER">Other Service</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Default Fee (BDT) *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 font-bold text-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Service Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this service covers..."
              rows={2}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isCreating} className="bg-primary-600 text-white text-xs">
              {isCreating ? 'Saving...' : 'Add Service'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
