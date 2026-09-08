'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Plus,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FolderLock,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';

export default function DocumentTypesPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('PASSPORT');
  const [isRequired, setIsRequired] = useState(false);
  const [description, setDescription] = useState('');
  const [maxSizeMb, setMaxSizeMb] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/document-types');
      const data = await res.json();
      if (data.success) {
        setTypes(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/document-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code: code.toUpperCase().trim(),
          category,
          isRequired,
          description: description || undefined,
          maxSizeMb: Number(maxSizeMb),
          allowedFormats: ['pdf', 'jpg', 'png'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setName('');
        setCode('');
        setDescription('');
        fetchTypes();
      } else {
        setError(data.error || 'Failed to create document type');
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
          <Link href="/admin/documents" className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 font-medium mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Documents Vault
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-primary-600" />
            Document Types Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Define mandatory and optional documentation prerequisites for international recruitment.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Add Document Type
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Code</th>
              <th className="py-3.5 px-4">Type Name</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Requirement</th>
              <th className="py-3.5 px-4">Max Size</th>
              <th className="py-3.5 px-4">Total Files</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
                  Loading document types...
                </td>
              </tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No document types configured yet.
                </td>
              </tr>
            ) : (
              types.map((dt) => (
                <tr key={dt.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary-700">{dt.code}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{dt.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{dt.category}</td>
                  <td className="py-3.5 px-4">
                    {dt.isRequired ? (
                      <Badge variant="gold">Mandatory</Badge>
                    ) : (
                      <Badge variant="neutral">Optional</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{dt.maxSizeMb} MB</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{dt._count?.documents || 0}</td>
                  <td className="py-3.5 px-4">
                    {dt.isActive ? (
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

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Document Type"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Code *</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. GAMCA_FITNESS"
              className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GAMCA Medical Fitness Certificate"
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
                <option value="PASSPORT">Passport</option>
                <option value="NID">National ID</option>
                <option value="PHOTO">Photo</option>
                <option value="MEDICAL">Medical</option>
                <option value="POLICE_CLEARANCE">Police Clearance</option>
                <option value="CERTIFICATE">Education / Skill</option>
                <option value="VISA">Visa</option>
                <option value="CONTRACT">Contract</option>
                <option value="BMET">BMET Smart Card</option>
                <option value="TICKET">Air Ticket</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Max Size (MB)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxSizeMb}
                onChange={(e) => setMaxSizeMb(Number(e.target.value))}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="reqCheck"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
            />
            <label htmlFor="reqCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
              Mark as Mandatory Prerequisite Document
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description / Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Guidance for applicant or recruitment officer..."
              rows={2}
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isCreating} className="bg-primary-600 text-white text-xs">
              {isCreating ? 'Saving...' : 'Save Document Type'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
