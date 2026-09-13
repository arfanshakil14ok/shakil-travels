'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  RefreshCw,
  Filter,
  CheckSquare,
  Square,
  ShieldAlert,
  FileText,
  Briefcase,
  Users,
  Building2,
  Receipt,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

interface TrashItem {
  id: string;
  type: 'Applicant' | 'Job' | 'Employer' | 'Invoice' | 'Document';
  title: string;
  identifier: string;
  deletedAt: string;
  deletedBy: string;
  details?: Record<string, any>;
}

export default function AdminTrashPage() {
  const { success, error } = useToast();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Delete modal state
  const [deleteModalItem, setDeleteModalItem] = useState<TrashItem | null>(null);
  const [isBulkDeleteModal, setIsBulkDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTrashItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/trash?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch trash items');
      }

      setItems(data.items || []);
      setSelectedIds(new Set());
    } catch (err: any) {
      error(err.message || 'Error loading trash');
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, searchQuery, error]);

  useEffect(() => {
    fetchTrashItems();
  }, [fetchTrashItems]);

  // Handle Select All
  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Restore Single Item
  const handleRestoreSingle = async (item: TrashItem) => {
    try {
      setIsProcessing(true);
      const res = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: item.type, id: item.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');

      success(`Successfully restored ${item.title} (${item.identifier})`, 'Item Restored');
      fetchTrashItems();
    } catch (err: any) {
      error(err.message || 'Restore failed', 'Restore Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Restore
  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;
    const selectedItems = items.filter((i) => selectedIds.has(i.id));

    try {
      setIsProcessing(true);
      const res = await fetch('/api/admin/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map((i) => ({ type: i.type, id: i.id })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk restore failed');

      success(`Restored ${selectedIds.size} items successfully`, 'Items Restored');
      fetchTrashItems();
    } catch (err: any) {
      error(err.message || 'Bulk restore failed', 'Bulk Restore Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Permanent Delete Single
  const handlePermanentDeleteSingle = async () => {
    if (!deleteModalItem) return;

    try {
      setIsProcessing(true);
      const res = await fetch('/api/admin/trash/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: deleteModalItem.type,
          id: deleteModalItem.id,
          confirmText: confirmInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');

      success(
        `${deleteModalItem.title} and related records have been permanently wiped.`,
        'Item Permanently Deleted'
      );
      setDeleteModalItem(null);
      setConfirmInput('');
      fetchTrashItems();
    } catch (err: any) {
      error(err.message || 'Deletion failed', 'Deletion Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Permanent Delete
  const handleBulkPermanentDelete = async () => {
    if (selectedIds.size === 0) return;
    const selectedItems = items.filter((i) => selectedIds.has(i.id));

    try {
      setIsProcessing(true);
      const res = await fetch('/api/admin/trash/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map((i) => ({ type: i.type, id: i.id })),
          confirmText: confirmInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk delete failed');

      success(`Successfully removed ${selectedIds.size} records.`, 'Items Permanently Deleted');
      setIsBulkDeleteModal(false);
      setConfirmInput('');
      fetchTrashItems();
    } catch (err: any) {
      error(err.message || 'Bulk delete failed', 'Bulk Deletion Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Applicant':
        return <Users className="w-4 h-4 text-sky-500" />;
      case 'Job':
        return <Briefcase className="w-4 h-4 text-emerald-500" />;
      case 'Employer':
        return <Building2 className="w-4 h-4 text-amber-500" />;
      case 'Invoice':
        return <Receipt className="w-4 h-4 text-indigo-500" />;
      case 'Document':
        return <FileText className="w-4 h-4 text-violet-500" />;
      default:
        return <Trash2 className="w-4 h-4 text-slate-400" />;
    }
  };

  const tabs = [
    { key: 'ALL', label: 'All / সমস্ত' },
    { key: 'Applicant', label: 'Applicants / প্রার্থী' },
    { key: 'Job', label: 'Jobs / চাকুরীর বিজ্ঞপ্তি' },
    { key: 'Employer', label: 'Employers / নিয়োগকর্তা' },
    { key: 'Invoice', label: 'Invoices / ইনভয়েস' },
    { key: 'Document', label: 'Documents / নথিপত্র' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Trash & Recycle Bin <span className="text-sm font-normal text-slate-500 font-bengali">রিসাইকেল বিন</span>
              </h1>
              <p className="text-xs text-slate-500">
                Manage soft-deleted candidates, jobs, employers, and records. Restore or permanently purge items.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrashItems}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedType(tab.key)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  selectedType === tab.key
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-rose-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              {selectedIds.size} items selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRestore}
                disabled={isProcessing}
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 flex items-center gap-1.5 text-xs h-8"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                Restore Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteModal(true)}
                disabled={isProcessing}
                className="flex items-center gap-1.5 text-xs h-8 bg-rose-600 hover:bg-rose-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Permanent Delete Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Trash Table / List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
            <p className="text-xs text-slate-500 font-medium">Scanning trash records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-4 bg-emerald-50 rounded-full text-emerald-600">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Recycle Bin is Empty</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              There are no deleted or archived records in the recycle bin. All active records are healthy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {selectedIds.size === items.length && items.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Record Name / Title</th>
                  <th className="py-3 px-4">Identifier / Code</th>
                  <th className="py-3 px-4">Deleted Date</th>
                  <th className="py-3 px-4">Deleted By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleSelect(item.id)}
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-100 rounded-md">
                            {getTypeIcon(item.type)}
                          </div>
                          <span className="font-semibold text-slate-800">{item.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.type === 'Applicant' && (
                            <ProfileAvatar
                              name={item.title}
                              photoUrl={item.details?.photo}
                              size="sm"
                            />
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{item.title}</p>
                            {item.details?.phone && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                {item.details.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                          {item.identifier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-sans">
                        {formatDate(item.deletedAt)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.deletedBy}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreSingle(item)}
                            disabled={isProcessing}
                            className="h-7 text-xs px-2.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                            title="Restore record"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteModalItem(item)}
                            disabled={isProcessing}
                            className="h-7 text-xs px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border border-rose-200"
                            title="Permanently wipe record"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Purge
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Permanent Delete Single Item */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => {
                  setDeleteModalItem(null);
                  setConfirmInput('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Permanent Purge Confirmation
              </h3>
              <p className="text-xs text-rose-600 font-semibold mt-1">
                ⚠️ WARNING: THIS ACTION CANNOT BE UNDONE!
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                You are about to permanently delete <strong>{deleteModalItem.title}</strong> (
                <span className="font-mono">{deleteModalItem.identifier}</span>). All associated
                documents, files, relations, and records will be deleted from disk and database.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-700">
                Type <span className="font-mono text-rose-600">PERMANENTLY DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="PERMANENTLY DELETE"
                className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDeleteModalItem(null);
                  setConfirmInput('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={confirmInput.trim() !== 'PERMANENTLY DELETE' || isProcessing}
                onClick={handlePermanentDeleteSingle}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isProcessing ? 'Purging...' : 'Permanently Purge'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Permanent Delete */}
      {isBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => {
                  setIsBulkDeleteModal(false);
                  setConfirmInput('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Bulk Purge Confirmation
              </h3>
              <p className="text-xs text-rose-600 font-semibold mt-1">
                ⚠️ WARNING: THIS ACTION CANNOT BE UNDONE!
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                You are about to permanently purge <strong>{selectedIds.size}</strong> records from
                the database and wipe all related file assets.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-700">
                Type <span className="font-mono text-rose-600">PERMANENTLY DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="PERMANENTLY DELETE"
                className="w-full px-3 py-2 text-xs border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsBulkDeleteModal(false);
                  setConfirmInput('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={confirmInput.trim() !== 'PERMANENTLY DELETE' || isProcessing}
                onClick={handleBulkPermanentDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isProcessing ? 'Purging...' : `Purge ${selectedIds.size} Records`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
